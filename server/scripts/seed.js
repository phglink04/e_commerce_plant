/**
 * seed.js — Drop all collections, then create Vietnamese plant shop demo data
 *
 * Usage:  node scripts/seed.js
 * (or)    npm run seed
 */

const { MongoClient, ObjectId } = require("mongodb");
const { hash } = require("bcryptjs");
const path = require("path");
const fs = require("fs");

// ── Read .env ───────────────────────────────────────────────────────────────
const envPath = path.resolve(__dirname, "..", ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};
for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx === -1) continue;
  envVars[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
}

const MONGODB_URI = envVars.MONGODB_URI;
if (!MONGODB_URI) { console.error("❌ MONGODB_URI not found"); process.exit(1); }

// ── Helpers ─────────────────────────────────────────────────────────────────
const slugify = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
function daysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n);
  d.setHours(rand(7, 20), rand(0, 59)); return d;
}

// ── Categories ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: "Cây để bàn", slug: "cay-de-ban", description: "Cây cảnh nhỏ gọn phù hợp để bàn làm việc, bàn học", isActive: true },
  { name: "Cây phong thủy", slug: "cay-phong-thuy", description: "Cây mang ý nghĩa phong thủy, tài lộc, may mắn", isActive: true },
  { name: "Cây trong nhà", slug: "cay-trong-nha", description: "Cây cảnh phù hợp trồng trong nhà, thanh lọc không khí", isActive: true },
  { name: "Cây ngoài trời", slug: "cay-ngoai-troi", description: "Cây cảnh chịu nắng, phù hợp ban công, sân vườn", isActive: true },
  { name: "Sen đá", slug: "sen-da", description: "Các loại sen đá, xương rồng mini dễ chăm sóc", isActive: true },
];

// ── Plants (20) ─────────────────────────────────────────────────────────────
const PLANTS = [
  // Cây để bàn (4)
  { name: "Kim Tiền Mini", category: "Cây để bàn", tags: ["indoor", "easy-care", "desktop", "office"], price: 85000, costPrice: 35000, stock: 45, description: "Cây kim tiền mini dáng nhỏ gọn, mang ý nghĩa tài lộc, rất thích hợp để bàn làm việc.", imageCover: "https://images.unsplash.com/photo-1637967886160-fd78dc3ce3f5?w=600", isFeatured: true },
  { name: "Lưỡi Hổ Mini", category: "Cây để bàn", tags: ["indoor", "easy-care", "desktop", "low-water", "office"], price: 65000, costPrice: 25000, stock: 60, description: "Cây lưỡi hổ mini thanh lọc không khí, cực kỳ dễ chăm sóc, chịu hạn tốt.", imageCover: "https://images.unsplash.com/photo-1593482892580-e32e47e0a38d?w=600", isFeatured: true },
  { name: "Xương Rồng Tai Thỏ", category: "Cây để bàn", tags: ["indoor", "easy-care", "desktop", "low-water", "pet-friendly"], price: 55000, costPrice: 20000, stock: 70, description: "Xương rồng tai thỏ dễ thương, ít tưới nước, trang trí bàn học cực xinh.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600" },
  { name: "Trầu Bà Mini", category: "Cây để bàn", tags: ["indoor", "easy-care", "desktop", "shade-loving"], price: 75000, costPrice: 30000, stock: 50, description: "Trầu bà lá nhỏ dáng rủ, phù hợp để bàn hoặc treo cửa sổ.", imageCover: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600" },

  // Cây phong thủy (4)
  { name: "Kim Ngân Lộc", category: "Cây phong thủy", tags: ["indoor", "office", "living-room"], price: 320000, costPrice: 150000, stock: 20, description: "Cây kim ngân tết thân, biểu tượng tài lộc và thịnh vượng cho gia chủ.", imageCover: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=600", isFeatured: true },
  { name: "Phát Tài", category: "Cây phong thủy", tags: ["indoor", "shade-loving", "living-room", "office"], price: 250000, costPrice: 100000, stock: 25, description: "Cây phát tài lá xanh bóng, mang may mắn và phú quý, chịu bóng râm tốt.", imageCover: "https://images.unsplash.com/photo-1632207691143-643e2a9a9361?w=600", isFeatured: true },
  { name: "Lan Ý", category: "Cây phong thủy", tags: ["indoor", "shade-loving", "bedroom", "living-room", "pet-friendly"], price: 180000, costPrice: 70000, stock: 30, description: "Lan ý hoa trắng thanh tao, thanh lọc không khí, hợp phong thủy phòng khách.", imageCover: "https://images.unsplash.com/photo-1616690248297-4434834e0180?w=600" },
  { name: "Vạn Niên Thanh", category: "Cây phong thủy", tags: ["indoor", "easy-care", "living-room"], price: 150000, costPrice: 60000, stock: 35, description: "Vạn niên thanh lá xanh quanh năm, biểu tượng trường thọ và bình an.", imageCover: "https://images.unsplash.com/photo-1501004318855-b174af0e925d?w=600" },

  // Cây trong nhà (4)
  { name: "Monstera", category: "Cây trong nhà", tags: ["indoor", "living-room", "shade-loving"], price: 350000, costPrice: 160000, stock: 18, description: "Monstera lá xẻ thùy đặc trưng, điểm nhấn trang trí nội thất hiện đại.", imageCover: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600", isFeatured: true, isFlashSale: true, discountPercentage: 15 },
  { name: "Đuôi Công", category: "Cây trong nhà", tags: ["indoor", "shade-loving", "bedroom", "living-room"], price: 280000, costPrice: 120000, stock: 15, description: "Cây đuôi công (Calathea) lá sọc đẹp mắt, ưa bóng râm, hợp phòng ngủ.", imageCover: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600" },
  { name: "Cau Tiểu Trâm", category: "Cây trong nhà", tags: ["indoor", "shade-loving", "living-room", "office"], price: 220000, costPrice: 90000, stock: 22, description: "Cau tiểu trâm dáng thanh mảnh, thanh lọc không khí rất tốt.", imageCover: "https://images.unsplash.com/photo-1586185018858-33be5e70dc3c?w=600" },
  { name: "Trầu Bà Đế Vương", category: "Cây trong nhà", tags: ["indoor", "easy-care", "living-room", "office"], price: 195000, costPrice: 80000, stock: 28, description: "Trầu bà đế vương lá xanh bóng to, dễ chăm, hợp văn phòng và phòng khách.", imageCover: "https://images.unsplash.com/photo-1637967886160-fd78dc3ce3f5?w=600" },

  // Cây ngoài trời (4)
  { name: "Hoa Hồng Đỏ", category: "Cây ngoài trời", tags: ["outdoor", "sunlight", "balcony"], price: 120000, costPrice: 45000, stock: 40, description: "Hoa hồng đỏ rực rỡ, thích hợp trồng ban công nơi có nắng.", imageCover: "https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=600", isFlashSale: true, discountPercentage: 20 },
  { name: "Hoa Giấy", category: "Cây ngoài trời", tags: ["outdoor", "sunlight", "balcony", "low-water"], price: 95000, costPrice: 35000, stock: 50, description: "Hoa giấy nhiều màu sắc, chịu nắng và hạn rất tốt, nở hoa quanh năm.", imageCover: "https://images.unsplash.com/photo-1603912699214-92627f304eb6?w=600" },
  { name: "Nguyệt Quế", category: "Cây ngoài trời", tags: ["outdoor", "sunlight", "balcony"], price: 160000, costPrice: 65000, stock: 30, description: "Nguyệt quế hoa trắng thơm nhẹ, hợp trồng sân vườn và ban công.", imageCover: "https://images.unsplash.com/photo-1515586000433-45406d8e6662?w=600" },
  { name: "Hương Thảo", category: "Cây ngoài trời", tags: ["outdoor", "sunlight", "balcony", "easy-care"], price: 80000, costPrice: 30000, stock: 55, description: "Hương thảo (Rosemary) vừa trang trí vừa dùng nấu ăn, hương thơm dễ chịu.", imageCover: "https://images.unsplash.com/photo-1515586000433-45406d8e6662?w=600", isFeatured: true },

  // Sen đá (4)
  { name: "Sen Đá Hồng Ngọc", category: "Sen đá", tags: ["indoor", "outdoor", "easy-care", "low-water", "desktop"], price: 45000, costPrice: 15000, stock: 80, description: "Sen đá hồng ngọc màu hồng pastel, dễ trồng, ít tưới nước.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600", isFeatured: true },
  { name: "Sen Đá Cẩm Thạch", category: "Sen đá", tags: ["indoor", "easy-care", "low-water", "desktop", "office"], price: 55000, costPrice: 18000, stock: 65, description: "Sen đá cẩm thạch vân đá tự nhiên, trang trí bàn làm việc tuyệt đẹp.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600", isFlashSale: true, discountPercentage: 10 },
  { name: "Xương Rồng Sao", category: "Sen đá", tags: ["indoor", "outdoor", "easy-care", "low-water", "desktop"], price: 40000, costPrice: 12000, stock: 90, description: "Xương rồng sao dáng tròn đều, cực dễ chăm, tưới 1 lần/tuần.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600" },
  { name: "Sen Đá Kim Cương", category: "Sen đá", tags: ["indoor", "easy-care", "low-water", "desktop", "pet-friendly"], price: 60000, costPrice: 22000, stock: 55, description: "Sen đá kim cương lá mọng nước lấp lánh, quà tặng ý nghĩa.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600" },
];

// ── Users (1 admin + 10 users) ──────────────────────────────────────────────
const USERS = [
  { name: "Admin PlantWorld", email: "admin@plantworld.com", role: "admin", phone: "0901234567" },
  { name: "Nguyễn Văn An", email: "an.nguyen@gmail.com", role: "user", phone: "0912345678" },
  { name: "Trần Thị Bình", email: "binh.tran@gmail.com", role: "user", phone: "0923456789" },
  { name: "Lê Minh Châu", email: "chau.le@gmail.com", role: "user", phone: "0934567890" },
  { name: "Phạm Đức Dũng", email: "dung.pham@gmail.com", role: "user", phone: "0945678901" },
  { name: "Hoàng Thị Em", email: "em.hoang@gmail.com", role: "user", phone: "0956789012" },
  { name: "Võ Quốc Phong", email: "phong.vo@gmail.com", role: "user", phone: "0967890123" },
  { name: "Đặng Ngọc Giàu", email: "giau.dang@gmail.com", role: "user", phone: "0978901234" },
  { name: "Bùi Thanh Hà", email: "ha.bui@gmail.com", role: "user", phone: "0989012345" },
  { name: "Ngô Thị Lan", email: "lan.ngo@gmail.com", role: "user", phone: "0911223344" },
  { name: "Đinh Quang Minh", email: "minh.dinh@gmail.com", role: "user", phone: "0922334455" },
];

const CITIES = ["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ"];
const DISTRICTS = [
  ["Ba Đình", "Hoàn Kiếm", "Cầu Giấy", "Thanh Xuân"],
  ["Quận 1", "Quận 3", "Quận 7", "Bình Thạnh", "Thủ Đức"],
  ["Hải Châu", "Thanh Khê", "Sơn Trà"],
  ["Hồng Bàng", "Lê Chân", "Ngô Quyền"],
  ["Ninh Kiều", "Cái Răng", "Bình Thủy"],
];
const WARDS = ["Phường 1", "Phường 2", "Phường 3", "Phường 5", "Phường 7", "Phường 10"];
const STREETS = [
  "123 Nguyễn Trãi", "45 Lê Lợi", "78 Trần Hưng Đạo", "12 Phạm Ngũ Lão",
  "99 Nguyễn Huệ", "34 Hai Bà Trưng", "56 Lý Thường Kiệt", "88 Điện Biên Phủ",
];

const REVIEW_CONTENTS = [
  "Cây rất đẹp, đóng gói cẩn thận. Sẽ mua lại!",
  "Giao hàng nhanh, cây tươi xanh, rất hài lòng.",
  "Chất lượng tốt so với giá tiền. Recommend cho mọi người.",
  "Cây khỏe mạnh, lá xanh mướt. Shop gói hàng kỹ lắm.",
  "Mình đặt lần 2 rồi, lần nào cũng ưng ý.",
  "Cây đúng như hình, shop tư vấn nhiệt tình.",
  "Trồng được 2 tuần rồi, cây vẫn rất xanh tốt.",
  "Quà tặng bạn bè ai cũng thích. Sẽ ủng hộ tiếp.",
  "Đóng gói chắc chắn, ship xa mà cây vẫn tươi.",
  "Giá hợp lý, cây đẹp hơn mong đợi.",
];

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Connecting to MongoDB...");
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();

  // 1. Drop collections
  console.log("🗑️  Dropping existing collections...");
  const toDrop = ["users", "plants", "orders", "categories", "addresses", "carts", "deliveries", "homesettings", "reviews", "blogs", "discounts", "chats"];
  for (const name of toDrop) {
    try { await db.collection(name).drop(); console.log(`   ✓ dropped ${name}`); } catch { /* skip */ }
  }

  const now = new Date();

  // 2. Categories
  console.log("📂 Seeding categories...");
  const catDocs = CATEGORIES.map((c) => ({ ...c, createdAt: now, updatedAt: now }));
  await db.collection("categories").insertMany(catDocs);

  // 3. Plants
  console.log("🌿 Seeding plants...");
  const plantDocs = PLANTS.map((p) => ({
    name: p.name, slug: slugify(p.name), price: p.price, costPrice: p.costPrice || 0,
    isFeatured: p.isFeatured || false, isFlashSale: p.isFlashSale || false,
    discountPercentage: p.discountPercentage || 0, imageCover: p.imageCover,
    category: p.category, tags: p.tags || [],
    availability: p.stock > 0 ? "In Stock" : "Out Of Stock", stock: p.stock,
    description: p.description, rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
    createdAt: now, updatedAt: now,
  }));
  const plantResult = await db.collection("plants").insertMany(plantDocs);
  const plantIds = Object.values(plantResult.insertedIds);
  const plantLookup = {};
  plantDocs.forEach((p, i) => { plantLookup[plantIds[i].toString()] = p; });

  // 4. Users
  console.log("👤 Seeding users...");
  const passwordHash = await hash("123456", 10);
  const userDocs = USERS.map((u) => ({
    name: u.name, email: u.email, accountType: "LOCAL", googleId: null,
    role: u.role, phone: u.phone, avatar: null, isActive: true, passwordHash,
    isVerified: true, verificationCode: null, verificationCodeExpiresAt: null,
    resetToken: null, resetTokenExpiresAt: null, isTwoFactorEnabled: false,
    twoFactorSecret: null, backupCodes: [], cart: [],
    createdAt: daysAgo(rand(30, 90)), updatedAt: now,
  }));
  const userResult = await db.collection("users").insertMany(userDocs);
  const userIds = Object.values(userResult.insertedIds);

  // 5. Addresses
  console.log("📍 Seeding addresses...");
  const addressDocs = [];
  for (let i = 0; i < userIds.length; i++) {
    const ci = i % CITIES.length;
    addressDocs.push({
      userId: userIds[i], fullName: USERS[i].name, phone: USERS[i].phone,
      city: CITIES[ci], district: pick(DISTRICTS[ci]), ward: pick(WARDS),
      addressLine: pick(STREETS), isDefault: true, createdAt: now, updatedAt: now,
    });
  }
  const addrResult = await db.collection("addresses").insertMany(addressDocs);

  // 6. Orders — each of 10 normal users gets 5-6 completed orders
  console.log("📦 Seeding orders...");
  const normalUserIds = userIds.slice(1); // skip admin
  const orderDocs = [];

  for (let ui = 0; ui < normalUserIds.length; ui++) {
    const userId = normalUserIds[ui];
    const userIdx = ui + 1; // index in full USERS array
    const numOrders = rand(5, 6);

    for (let oi = 0; oi < numOrders; oi++) {
      const numItems = rand(1, 4);
      const chosen = new Set();
      while (chosen.size < numItems) chosen.add(rand(0, plantIds.length - 1));

      const items = [];
      let total = 0;
      for (const pIdx of chosen) {
        const pId = plantIds[pIdx];
        const plant = plantLookup[pId.toString()];
        const qty = rand(1, 3);
        const unitPrice = plant.discountPercentage > 0
          ? Math.round(plant.price * (1 - plant.discountPercentage / 100))
          : plant.price;
        total += unitPrice * qty;
        items.push({ plantId: pId.toString(), name: plant.name, quantity: qty, price: unitPrice });
      }

      const shippingFee = pick([0, 15000, 25000, 30000]);
      total += shippingFee;
      const createdAt = daysAgo(rand(3, 90));
      const addr = addressDocs[userIdx];

      orderDocs.push({
        userId: userId.toString(),
        orderStatus: "delivered",
        paymentStatus: "paid",
        total, items, shippingFee,
        shippingAddress: `${addr.fullName}, ${addr.phone}, ${addr.addressLine}, ${addr.ward}, ${addr.district}, ${addr.city}`,
        addressId: Object.values(addrResult.insertedIds)[userIdx],
        paymentMethod: pick(["cash", "qr"]),
        transactionCode: null,
        createdAt, updatedAt: createdAt,
      });
    }
  }

  const orderResult = await db.collection("orders").insertMany(orderDocs);
  const orderIds = Object.values(orderResult.insertedIds);

  // 7. Reviews
  console.log("⭐ Seeding reviews...");
  const reviewDocs = [];
  const reviewedPairs = new Set();

  for (let oi = 0; oi < orderDocs.length; oi++) {
    const order = orderDocs[oi];
    // ~60% chance to review each order item
    for (const item of order.items) {
      if (Math.random() > 0.6) continue;
      const pair = `${order.userId}_${item.plantId}`;
      if (reviewedPairs.has(pair)) continue;
      reviewedPairs.add(pair);

      const userObj = USERS.find((u) => u.role === "user" && userDocs.findIndex((ud) => ud.email === u.email) === (userIds.indexOf(userIds.find((id) => id.toString() === order.userId.toString())) ?? -1));
      const userName = userObj?.name || "Khách hàng";

      reviewDocs.push({
        userId: order.userId, userName,
        userAvatar: "", productId: item.plantId,
        orderId: orderIds[oi].toString(),
        rating: rand(3, 5), content: pick(REVIEW_CONTENTS),
        images: [], isVerifiedPurchase: true, isApproved: true,
        likes: rand(0, 12), likedBy: [], replies: [],
        createdAt: new Date(order.createdAt.getTime() + rand(1, 7) * 86400000),
        updatedAt: now,
      });
    }
  }

  if (reviewDocs.length > 0) {
    await db.collection("reviews").insertMany(reviewDocs);
  }

  // ── Summary ──
  const totalRevenue = orderDocs.reduce((s, o) => s + o.total, 0);
  console.log("\n" + "═".repeat(50));
  console.log("✅ SEED COMPLETE!");
  console.log("═".repeat(50));
  console.log(`   Categories:  ${CATEGORIES.length}`);
  console.log(`   Plants:      ${plantDocs.length}`);
  console.log(`   Users:       ${userDocs.length} (1 admin + ${userDocs.length - 1} users)`);
  console.log(`   Addresses:   ${addressDocs.length}`);
  console.log(`   Orders:      ${orderDocs.length} (all delivered & paid)`);
  console.log(`   Reviews:     ${reviewDocs.length}`);
  console.log(`   Revenue:     ${totalRevenue.toLocaleString("vi-VN")}đ`);
  console.log("═".repeat(50));
  console.log("   🔑 All passwords: 123456");
  console.log("   👑 Admin: admin@plantworld.com / 123456");
  console.log("═".repeat(50));

  await client.close();
  process.exit(0);
}

main().catch((err) => { console.error("❌ Seed failed:", err); process.exit(1); });
