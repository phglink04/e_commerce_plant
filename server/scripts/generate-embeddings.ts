/**
 * Script: Generate embeddings cho tất cả sản phẩm hiện có
 * Chạy: npx ts-node scripts/generate-embeddings.ts
 */

const mongoose = require('mongoose');
const path = require('path');

// Load .env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI;

if (!GEMINI_API_KEY || !MONGODB_URI) {
  console.error('❌ Missing GEMINI_API_KEY or MONGODB_URI in .env');
  process.exit(1);
}

// Schema tối thiểu cho Plant
const PlantSchema = new mongoose.Schema({
  name: String,
  category: String,
  description: String,
  tags: [String],
  embedding: [Number],
}, { collection: 'plants', strict: false });

/**
 * Gọi Gemini Embedding API trực tiếp bằng fetch (không dùng SDK)
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/gemini-embedding-001',
      content: { parts: [{ text }] },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  return data?.embedding?.values || [];
}

async function main() {
  // Test API key trước
  console.log('🔑 Testing Gemini API key...');
  try {
    const testEmb = await generateEmbedding('test');
    console.log(`✅ API key works! Embedding dimensions: ${testEmb.length}\n`);
  } catch (error: any) {
    console.error(`❌ API key test failed: ${error.message}`);
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected!\n');

  const Plant = mongoose.model('Plant', PlantSchema);
  const plants = await Plant.find({});
  console.log(`📦 Found ${plants.length} plants\n`);

  let success = 0;
  let failed = 0;

  for (const plant of plants) {
    try {
      const searchText = [
        plant.name,
        plant.category,
        plant.description || '',
        ...(plant.tags || []),
      ].filter(Boolean).join(' ');

      console.log(`  🌿 ${plant.name} — generating embedding...`);

      const embedding = await generateEmbedding(searchText);

      if (embedding && embedding.length > 0) {
        await Plant.findByIdAndUpdate(plant._id, { $set: { embedding } });
        console.log(`     ✅ Done (${embedding.length} dimensions)`);
        success++;
      } else {
        console.log(`     ⚠️ Empty embedding`);
        failed++;
      }

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error: any) {
      console.error(`     ❌ Error: ${error.message}`);
      failed++;

      if (error.message?.includes('429')) {
        console.log('     ⏳ Rate limited, waiting 60s...');
        await new Promise(resolve => setTimeout(resolve, 60000));
      }
    }
  }

  console.log(`\n📊 Results: ${success} success, ${failed} failed out of ${plants.length} plants`);

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  TIẾP THEO: Tạo Atlas Vector Search Index (tùy chọn)         ║
║                                                               ║
║  1. MongoDB Atlas → Database → Cluster → "Atlas Search"       ║
║  2. "Create Search Index" → JSON Editor → Collection: plants  ║
║  3. Index name: plant_vector_index                            ║
║  4. Paste JSON:                                               ║
║  {                                                            ║
║    "fields": [{                                               ║
║      "type": "vector",                                        ║
║      "path": "embedding",                                     ║
║      "numDimensions": 3072,                                    ║
║      "similarity": "cosine"                                   ║
║    }]                                                         ║
║  }                                                            ║
╚════════════════════════════════════════════════════════════════╝
`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected');
}

main().catch(console.error);
