/**
 * Migration Script: Add Slug Field to Existing Plants
 *
 * Usage:
 * 1. From server root directory:
 *    npx ts-node scripts/migrate-plant-slugs.ts
 *
 * 2. Or run with npm/yarn:
 *    npm run migrate:slugs
 *    yarn migrate:slugs
 *
 * This script:
 * - Connects to MongoDB
 * - Finds all plants without slugs
 * - Generates slugs from product names
 * - Handles duplicates by appending -1, -2, etc
 * - Updates the database
 * - Logs progress and results
 */

import { generateSlug, ensureUniqueSlug } from "../src/helpers/slug.utils";
import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/plantworld";

async function migrateSlugst() {
  try {
    console.log("🌱 Plant Slug Migration Script");
    console.log("================================\n");

    // Connect to MongoDB
    console.log(`Connecting to MongoDB: ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get plants collection
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection failed");

    const plantsCollection = db.collection("plants");

    // Find plants without slugs
    const plantsWithoutSlugs = await plantsCollection
      .find({ slug: { $exists: false } })
      .toArray();

    if (plantsWithoutSlugs.length === 0) {
      console.log("✅ All plants already have slugs!");
      await mongoose.disconnect();
      return;
    }

    console.log(`Found ${plantsWithoutSlugs.length} plants without slugs\n`);

    // Get all existing slugs
    const existingPlants = await plantsCollection.find({}).toArray();
    const existingSlugs = existingPlants
      .map((p) => p.slug)
      .filter((s) => s !== undefined);

    // Process each plant
    let updatedCount = 0;

    for (const plant of plantsWithoutSlugs) {
      const baseSlug = generateSlug(plant.name);

      // Ensure slug is unique
      const uniqueSlug = await ensureUniqueSlug(baseSlug, existingSlugs);

      // Update plant with slug
      await plantsCollection.updateOne(
        { _id: plant._id },
        { $set: { slug: uniqueSlug } },
      );

      existingSlugs.push(uniqueSlug);
      updatedCount++;

      console.log(`✅ ${plant.name} → ${uniqueSlug}`);
    }

    console.log(`\n✅ Migration complete! Updated ${updatedCount} plants\n`);

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Migration failed:");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run migration
migrateSlugst().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
