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
  { name: "Cây để bàn", slug: "cay-de-ban", description: "Cây cảnh nhỏ gọn phù hợp để bàn làm việc, bàn học, tăng năng lượng tích cực", isActive: true },
  { name: "Cây phong thủy", slug: "cay-phong-thuy", description: "Cây mang ý nghĩa phong thủy tốt lành, thu hút tài lộc, may mắn và thịnh vượng", isActive: true },
  { name: "Cây trong nhà", slug: "cay-trong-nha", description: "Cây cảnh phù hợp trồng trong nhà, lọc sạch không khí, giảm bức xạ điện từ", isActive: true },
  { name: "Cây ngoài trời", slug: "cay-ngoai-troi", description: "Cây cảnh chịu nắng tốt, bền bỉ, phù hợp ban công, sân vườn và hiên nhà", isActive: true },
  { name: "Sen đá", slug: "sen-da", description: "Các loại sen đá mọng nước, xương rồng mini xinh xắn dễ chăm sóc cho người mới bắt đầu", isActive: true },
];

// ── Plants (60 items) ───────────────────────────────────────────────────────
const PLANTS = [
  // Cây để bàn (12)
  { name: "Kim Tiền Mini", category: "Cây để bàn", tags: ["indoor", "easy-care", "desktop", "office"], price: 85000, costPrice: 35000, stock: 45, description: "Cây Kim Tiền Mini để bàn làm việc phong thủy tài lộc mang lại may mắn thịnh vượng. Cây cảnh văn phòng lọc khí tốt, dễ chăm sóc, tưới nước ít.", imageCover: "https://images.unsplash.com/photo-1637967886160-fd78dc3ce3f5?w=600", isFeatured: true },
  { name: "Lưỡi Hổ Mini", category: "Cây để bàn", tags: ["indoor", "easy-care", "desktop", "low-water", "office"], price: 65000, costPrice: 25000, stock: 60, description: "Cây Lưỡi Hổ Mini thanh lọc không khí lọc bụi mịn hấp thụ bức xạ máy tính. Cây cảnh phong thủy đuổi vận xui xẻo thích hợp để bàn làm việc văn phòng.", imageCover: "https://images.unsplash.com/photo-1593482892580-e32e47e0a38d?w=600", isFeatured: true },
  { name: "Xương Rồng Tai Thỏ", category: "Cây để bàn", tags: ["indoor", "easy-care", "desktop", "low-water", "pet-friendly"], price: 55000, costPrice: 20000, stock: 70, description: "Cây Xương Rồng Tai Thỏ mini dễ thương trang trí bàn học bàn làm việc. Cây chịu hạn tốt ưa nắng nhẹ làm quà tặng xinh xắn ý nghĩa cho người thân.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600" },
  { name: "Trầu Bà Mini", category: "Cây để bàn", tags: ["indoor", "easy-care", "desktop", "shade-loving"], price: 75000, costPrice: 30000, stock: 50, description: "Cây Trầu Bà Mini dáng rủ thanh lọc không khí trong nhà hấp thụ độc chất. Cây trồng trong nhà lá xanh mướt dễ chăm sóc ưa bóng râm mát mẻ.", imageCover: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600" },
  { name: "Cẩm Nhung Đỏ", category: "Cây để bàn", tags: ["indoor", "easy-care", "desktop", "office"], price: 45000, costPrice: 18000, stock: 40, description: "Cây Cẩm Nhung Đỏ mini may mắn để bàn hợp mệnh Hỏa Thổ mang tài lộc dồi dào. Cây Fittonia lá đỏ rực rỡ thu hút sinh khí tốt lành cho phòng làm việc.", imageCover: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600" },
  { name: "Nhất Mạt Hương", category: "Cây để bàn", tags: ["indoor", "easy-care", "desktop", "low-water"], price: 50000, costPrice: 20000, stock: 50, description: "Cây Nhất Mạt Hương đuổi muỗi tự nhiên để bàn làm việc văn phòng. Cây sen đá thơm tỏa hương dễ chịu giúp thư giãn tinh thần và giải tỏa stress.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600" },
  { name: "Cỏ Đồng Tiền", category: "Cây để bàn", tags: ["indoor", "desktop", "water-loving"], price: 40000, costPrice: 15000, stock: 35, description: "Cây Cỏ Đồng Tiền để bàn trồng thủy sinh hoặc trồng đất xanh tươi. Giúp thu hút tiền tài, phú quý cho gia chủ, cây phát triển cực nhanh và dễ sống.", imageCover: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=600" },
  { name: "Sen Đá Dù Hồng", category: "Cây để bàn", tags: ["indoor", "easy-care", "desktop"], price: 48000, costPrice: 18000, stock: 80, description: "Sen Đá Dù Hồng mọng nước siêu đáng yêu, phù hợp decor bàn học, kệ sách. Loài sen đá chịu khô hạn tốt, thích hợp làm quà tặng ý nghĩa.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600" },
  { name: "Cau Tiểu Trâm Desktop", category: "Cây để bàn", tags: ["indoor", "desktop", "air-purifying"], price: 90000, costPrice: 38000, stock: 25, description: "Cây Cau Tiểu Trâm mini để bàn làm việc lọc sạch bức xạ từ màn hình máy tính. Mang lại vượng khí tốt lành và giúp giảm mỏi mắt khi làm việc.", imageCover: "https://images.unsplash.com/photo-1586185018858-33be5e70dc3c?w=600" },
  { name: "Tùng La Hán Mini", category: "Cây để bàn", tags: ["indoor", "desktop", "bonsai"], price: 150000, costPrice: 60000, stock: 15, description: "Cây Tùng La Hán dáng bonsai mini thích hợp cho người yêu thích phong cách thanh nhã. Cây lọc khí tốt, thể hiện sự bình yên và khí chất quân tử.", imageCover: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=600" },
  { name: "Ngũ Gia Bì Mini", category: "Cây để bàn", tags: ["indoor", "desktop", "mosquito-repelling"], price: 70000, costPrice: 28000, stock: 40, description: "Cây Ngũ Gia Bì Mini để bàn chống muỗi tốt, làm mát không khí văn phòng. Phù hợp đặt nơi làm việc giúp thư giãn, tăng sự tập trung hiệu quả.", imageCover: "https://images.unsplash.com/photo-1501004318855-b174af0e925d?w=600" },
  { name: "Hạnh Phúc Mini", category: "Cây để bàn", tags: ["indoor", "desktop", "easy-care"], price: 110000, costPrice: 45000, stock: 20, description: "Cây Hạnh Phúc dáng mini xinh xắn giúp mang lại niềm vui, sự đầm ấm cho gia đình. Cây có lá xanh bóng mượt dễ chăm sóc ở môi trường điều hòa.", imageCover: "https://images.unsplash.com/photo-1637967886160-fd78dc3ce3f5?w=600" },

  // Cây phong thủy (12)
  { name: "Kim Ngân Lộc", category: "Cây phong thủy", tags: ["indoor", "office", "living-room"], price: 320000, costPrice: 150000, stock: 20, description: "Cây Kim Ngân Lộc phong thủy phòng khách thu hút vượng khí tài lộc. Thân thắt bím sang trọng làm cây cảnh văn phòng trang trí nội thất.", imageCover: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=600", isFeatured: true },
  { name: "Phát Tài", category: "Cây phong thủy", tags: ["indoor", "shade-loving", "living-room", "office"], price: 250000, costPrice: 100000, stock: 25, description: "Cây Phát Tài phong thủy đem lại may mắn tài lộc thịnh vượng. Cây cảnh trong nhà lá xanh mướt lọc bụi bẩn làm đẹp không gian sống gia đình.", imageCover: "https://images.unsplash.com/photo-1632207691143-643e2a9a9361?w=600", isFeatured: true },
  { name: "Lan Ý", category: "Cây phong thủy", tags: ["indoor", "shade-loving", "bedroom", "living-room"], price: 180000, costPrice: 70000, stock: 30, description: "Cây Lan Ý lọc không khí hấp thụ bức xạ điện tử khí độc hại. Cây phong thủy hoa trắng thanh cao mang may mắn hòa khí cho gia đình.", imageCover: "https://images.unsplash.com/photo-1616690248297-4434834e0180?w=600" },
  { name: "Vạn Niên Thanh", category: "Cây phong thủy", tags: ["indoor", "easy-care", "living-room"], price: 150000, costPrice: 60000, stock: 35, description: "Cây Vạn Niên Thanh phong thủy mang cát tường trường thọ bình an. Cây xanh tốt quanh năm lọc không khí tốt thích hợp trồng phòng khách.", imageCover: "https://images.unsplash.com/photo-1501004318855-b174af0e925d?w=600" },
  { name: "Thiết Mộc Lan", category: "Cây phong thủy", tags: ["indoor", "office", "living-room"], price: 450000, costPrice: 200000, stock: 15, description: "Cây Thiết Mộc Lan ghép chậu phong thủy mang lại phú quý thịnh vượng. Cây cảnh nội thất lọc không khí bụi mịn thích hợp sảnh văn phòng.", imageCover: "https://images.unsplash.com/photo-1632207691143-643e2a9a9361?w=600" },
  { name: "Ngũ Gia Bì", category: "Cây phong thủy", tags: ["indoor", "easy-care", "living-room", "office"], price: 210000, costPrice: 90000, stock: 20, description: "Cây Ngũ Gia Bì đuổi muỗi côn trùng tự nhiên thanh lọc khí độc. Cây phong thủy phát triển sự nghiệp vững chắc thích hợp đặt phòng khách.", imageCover: "https://images.unsplash.com/photo-1501004318855-b174af0e925d?w=600" },
  { name: "Bạch Mã Hoàng Tử", category: "Cây phong thủy", tags: ["indoor", "living-room", "shade-loving"], price: 270000, costPrice: 110000, stock: 18, description: "Cây Bạch Mã Hoàng Tử dáng vẻ lịch lãm sang trọng thích hợp làm quà biếu sếp. Cây mang lại may mắn, suôn sẻ trong công việc kinh doanh.", imageCover: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600" },
  { name: "Hồng Môn Đỏ", category: "Cây phong thủy", tags: ["indoor", "living-room", "office"], price: 190000, costPrice: 85000, stock: 22, description: "Cây Hồng Môn Đỏ phong thủy mang sắc đỏ thắm mang lại may mắn cát tường. Hoa hồng môn bền bỉ biểu trưng cho lòng hiếu khách chân thành.", imageCover: "https://images.unsplash.com/photo-1616690248297-4434834e0180?w=600", isFeatured: true },
  { name: "Trầu Bà Đế Vương Đỏ", category: "Cây phong thủy", tags: ["indoor", "office", "executive"], price: 380000, costPrice: 160000, stock: 10, description: "Cây Trầu Bà Đế Vương Đỏ thể hiện tinh thần lãnh đạo, uy quyền vượt trội. Rất thích hợp đặt bàn sếp, lọc sạch không khí văn phòng.", imageCover: "https://images.unsplash.com/photo-1637967886160-fd78dc3ce3f5?w=600" },
  { name: "Trầu Bà Đế Vương Xanh", category: "Cây phong thủy", tags: ["indoor", "office", "executive"], price: 360000, costPrice: 150000, stock: 12, description: "Cây Trầu Bà Đế Vương Xanh phong thủy mang lại cảm giác bình yên, thư thái. Giúp xua tan mệt mỏi, căng thẳng và thu hút tài lộc công danh.", imageCover: "https://images.unsplash.com/photo-1637967886160-fd78dc3ce3f5?w=600" },
  { name: "Kim Tiền Đại Lộc", category: "Cây phong thủy", tags: ["indoor", "living-room", "office"], price: 490000, costPrice: 210000, stock: 14, description: "Cây Kim Tiền kích thước lớn trồng chậu sứ cao cấp trang trí văn phòng, phòng khách. Giúp đón tài lộc dồi dào, vạn sự hanh thông cát tường.", imageCover: "https://images.unsplash.com/photo-1637967886160-fd78dc3ce3f5?w=600" },
  { name: "Bàng Singapore Phong Thủy", category: "Cây phong thủy", tags: ["indoor", "living-room", "office"], price: 330000, costPrice: 140000, stock: 19, description: "Cây Bàng Singapore dáng thẳng thanh lịch, tượng trưng cho năng lượng tích cực, sự kiên cường vượt qua khó khăn. Phù hợp phong thủy văn phòng.", imageCover: "https://images.unsplash.com/photo-1586185018858-33be5e70dc3c?w=600" },

  // Cây trong nhà (12)
  { name: "Monstera Nam Mỹ", category: "Cây trong nhà", tags: ["indoor", "living-room", "shade-loving"], price: 350000, costPrice: 160000, stock: 18, description: "Cây Trầu Bà Nam Mỹ Monstera lá xẻ nghệ thuật trang trí nội thất sang trọng. Cây lọc không khí tạo không gian xanh mát phong cách châu Âu.", imageCover: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600", isFeatured: true, isFlashSale: true, discountPercentage: 15 },
  { name: "Đuôi Công Calathea", category: "Cây trong nhà", tags: ["indoor", "shade-loving", "bedroom", "living-room"], price: 280000, costPrice: 120000, stock: 15, description: "Cây Đuôi Công Calathea lá sọc hoa văn rực rỡ thu hút may mắn cát tường. Cây cảnh trong nhà ưa bóng râm mát thích hợp trang trí phòng ngủ.", imageCover: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600" },
  { name: "Cau Tiểu Trâm Lớn", category: "Cây trong nhà", tags: ["indoor", "shade-loving", "living-room", "office"], price: 220000, costPrice: 90000, stock: 22, description: "Cây Cau Tiểu Trâm để bàn làm việc hấp thụ bức xạ máy tính lọc không khí. Dáng cây mảnh mai phong thủy trừ tà khí mang may mắn.", imageCover: "https://images.unsplash.com/photo-1586185018858-33be5e70dc3c?w=600" },
  { name: "Trầu Bà Thanh Xuân", category: "Cây trong nhà", tags: ["indoor", "living-room", "shade-loving"], price: 310000, costPrice: 130000, stock: 15, description: "Cây Trầu Bà Thanh Xuân lá xẻ sâu bản to tạo điểm nhấn không gian nội thất. Cây lọc khí formaldehyde độc hại cực tốt phù hợp sảnh nhà.", imageCover: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600" },
  { name: "Bàng Singapore Lớn", category: "Cây trong nhà", tags: ["indoor", "living-room", "office"], price: 390000, costPrice: 180000, stock: 12, description: "Cây Bàng Singapore nội thất hiện đại sang trọng dáng thẳng lá to tròn. Cây cảnh phong thủy hút tài lộc trang trí quán cafe văn phòng.", imageCover: "https://images.unsplash.com/photo-1586185018858-33be5e70dc3c?w=600" },
  { name: "Cọ Cảnh Nội Thất", category: "Cây trong nhà", tags: ["indoor", "air-purifying", "living-room"], price: 260000, costPrice: 105000, stock: 20, description: "Cây Cọ Cảnh nội thất xòe lá rộng thanh lọc không khí cực tốt, mang lại vẻ đẹp mộc mạc hoang dã cho không gian phòng khách của bạn.", imageCover: "https://images.unsplash.com/photo-1586185018858-33be5e70dc3c?w=600" },
  { name: "Dương Xỉ Cổ Đại", category: "Cây trong nhà", tags: ["indoor", "shade-loving", "decor"], price: 680000, costPrice: 300000, stock: 8, description: "Cây Dương Xỉ Cổ Đại dáng vẻ hoài cổ, độc lạ làm điểm nhấn kiến trúc cho ngôi nhà. Cây ưa ẩm và ánh sáng nhẹ, lọc không khí rất tốt.", imageCover: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600" },
  { name: "Đại Đế Vương Xanh", category: "Cây trong nhà", tags: ["indoor", "office", "shade-loving"], price: 420000, costPrice: 190000, stock: 11, description: "Cây Đại Đế Vương Xanh lá to rộng, thể hiện sự thịnh vượng quyền lực. Thích hợp trang trí phòng khách rộng rãi hoặc tiền sảnh cơ quan.", imageCover: "https://images.unsplash.com/photo-1637967886160-fd78dc3ce3f5?w=600" },
  { name: "Phát Tài Núi", category: "Cây trong nhà", tags: ["indoor", "office", "decor"], price: 850000, costPrice: 400000, stock: 5, description: "Cây Phát Tài Núi dáng thân gỗ uyển chuyển nghệ thuật, thường dùng trang trí các căn hộ cao cấp hoặc quán cafe phong cách tối giản.", imageCover: "https://images.unsplash.com/photo-1632207691143-643e2a9a9361?w=600", isFeatured: true },
  { name: "Cây Hạnh Phúc Lớn", category: "Cây trong nhà", tags: ["indoor", "living-room", "gift"], price: 580000, costPrice: 250000, stock: 7, description: "Cây Hạnh Phúc dáng cao đại diện cho hạnh phúc sum vầy đầm ấm. Thích hợp làm quà tân gia, khai trương, trang trí nội thất phòng khách rộng.", imageCover: "https://images.unsplash.com/photo-1637967886160-fd78dc3ce3f5?w=600" },
  { name: "Trầu Bà Cột Đại", category: "Cây trong nhà", tags: ["indoor", "easy-care", "air-purifying"], price: 340000, costPrice: 150000, stock: 16, description: "Cây Trầu Bà Cột cao lớn leo bám quanh cột dừa, thanh lọc độc chất hữu cơ bay hơi trong nhà rất mạnh mẽ, dễ sống thích nghi bóng râm.", imageCover: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600" },
  { name: "Đa Búp Đỏ Cảnh", category: "Cây trong nhà", tags: ["indoor", "living-room", "air-purifying"], price: 290000, costPrice: 120000, stock: 24, description: "Cây Đa Búp Đỏ có màu lá sẫm cá tính và búp non đỏ rực rỡ độc đáo. Cây lọc khói bụi và khí gas độc hại rất hiệu quả cho căn hộ.", imageCover: "https://images.unsplash.com/photo-1593482892580-e32e47e0a38d?w=600" },

  // Cây ngoài trời (12)
  { name: "Hoa Hồng Đỏ", category: "Cây ngoài trời", tags: ["outdoor", "sunlight", "balcony"], price: 120000, costPrice: 45000, stock: 40, description: "Cây Hoa Hồng Đỏ trồng ban công sân vườn chịu nắng tốt nở hoa quanh năm. Cây hoa hồng mang vẻ quyến rũ ngát hương thơm cho ngôi nhà của bạn.", imageCover: "https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=600", isFlashSale: true, discountPercentage: 20 },
  { name: "Hoa Giấy Ngũ Sắc", category: "Cây ngoài trời", tags: ["outdoor", "sunlight", "balcony", "low-water"], price: 185000, costPrice: 80000, stock: 50, description: "Cây Hoa Giấy leo ban công cổng nhà chịu nắng chịu hạn rực rỡ quanh năm. Cây hoa giấy phong thủy gắn kết gia đình mang lại may mắn, bình an.", imageCover: "https://images.unsplash.com/photo-1603912699214-92627f304eb6?w=600" },
  { name: "Nguyệt Quế Thơm", category: "Cây ngoài trời", tags: ["outdoor", "sunlight", "balcony"], price: 160000, costPrice: 65000, stock: 30, description: "Cây Nguyệt Quế hoa trắng thơm ngát phong thủy mang may mắn vinh quang. Cây cảnh ngoài trời chịu nắng thích hợp trồng ban công sân vườn.", imageCover: "https://images.unsplash.com/photo-1515586000433-45406d8e6662?w=600" },
  { name: "Hương Thảo Rosemary", category: "Cây ngoài trời", tags: ["outdoor", "sunlight", "balcony", "easy-care"], price: 80000, costPrice: 30000, stock: 55, description: "Cây Hương Thảo Rosemary đuổi muỗi tự nhiên hương tinh dầu giúp thư giãn giảm stress. Cây gia vị trồng ban công sân vườn cực tiện lợi.", imageCover: "https://images.unsplash.com/photo-1515586000433-45406d8e6662?w=600", isFeatured: true },
  { name: "Tùng Bồng Lai Bonsai", category: "Cây ngoài trời", tags: ["outdoor", "sunlight", "balcony", "easy-care"], price: 290000, costPrice: 120000, stock: 18, description: "Cây Tùng Bồng Lai bonsai mini trồng ban công phong thủy mang may mắn trường thọ. Cây tùng phong thủy thu hút quý nhân phù trợ cho gia chủ.", imageCover: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=600" },
  { name: "Hoa Nhài Ta Thơm", category: "Cây ngoài trời", tags: ["outdoor", "sunlight", "balcony"], price: 110000, costPrice: 45000, stock: 25, description: "Cây Hoa Nhài Ta hoa nhài trắng ngát hương thơm dễ chịu. Cây cảnh ngoài trời trồng ban công ưa nắng hoa nhài dùng ướp trà thanh mát sảng khoái.", imageCover: "https://images.unsplash.com/photo-1515586000433-45406d8e6662?w=600" },
  { name: "Hoa Sử Quân Tử", category: "Cây ngoài trời", tags: ["outdoor", "sunlight", "climbing"], price: 140000, costPrice: 55000, stock: 32, description: "Cây hoa Sử Quân Tử hoa giàn leo rủ tường cực đẹp, chịu nắng gió và ra hoa chùm rực rỡ, thơm ngọt thanh nhẹ, tô điểm cho ban công nhà bạn.", imageCover: "https://images.unsplash.com/photo-1603912699214-92627f304eb6?w=600" },
  { name: "Hoa Mẫu Đơn Ta", category: "Cây ngoài trời", tags: ["outdoor", "sunlight"], price: 220000, costPrice: 95000, stock: 15, description: "Cây Hoa Mẫu Đơn ta (Trang đỏ) hoa nở bền màu, phong thủy chiêu tài lộc và đại cát đại lợi. Thích hợp trồng bồn sân vườn đón nắng.", imageCover: "https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=600" },
  { name: "Lộc Vừng Bonsai", category: "Cây ngoài trời", tags: ["outdoor", "sunlight", "bonsai"], price: 1200000, costPrice: 550000, stock: 3, description: "Cây Lộc Vừng dáng bonsai thế đẹp trồng chậu đón may mắn tiền tài cho gia chủ. Cây chịu nắng tốt, rủ hoa đỏ lộng lẫy khi đến mùa.", imageCover: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=600", isFeatured: true },
  { name: "Trúc Cần Câu Cảnh", category: "Cây ngoài trời", tags: ["outdoor", "sunlight", "fence"], price: 130000, costPrice: 50000, stock: 45, description: "Cây Trúc Cần Câu thân xanh bóng trồng hàng rào hoặc lối đi sân vườn cực đẹp. Cây tạo bóng mát thanh nhã và chịu được thời tiết khắc nghiệt tốt.", imageCover: "https://images.unsplash.com/photo-1585741537191-ebc2d128ce8c?w=800" },
  { name: "Hoa Triệu Chuông", category: "Cây ngoài trời", tags: ["outdoor", "sunlight", "hanging"], price: 75000, costPrice: 28000, stock: 50, description: "Chậu Hoa Triệu Chuông treo ban công nở hoa ngập tràn như những chiếc chuông nhỏ sặc sỡ. Cây ưa nắng gắt, siêng hoa quanh năm.", imageCover: "https://images.unsplash.com/photo-1603912699214-92627f304eb6?w=600", isFlashSale: true, discountPercentage: 15 },
  { name: "Cúc Tần Ấn Độ", category: "Cây ngoài trời", tags: ["outdoor", "climbing", "green-wall"], price: 60000, costPrice: 22000, stock: 120, description: "Dây Cúc Tần Ấn Độ mọc rủ dài tạo thành bức tường xanh mát chắn nắng bụi cực tốt cho ban công hoặc mái nhà, rủ dài xanh mướt.", imageCover: "https://images.unsplash.com/photo-1585741537191-ebc2d128ce8c?w=800" },

  // Sen đá (12)
  { name: "Sen Đá Hồng Ngọc", category: "Sen đá", tags: ["indoor", "outdoor", "easy-care", "low-water", "desktop"], price: 45000, costPrice: 15000, stock: 80, description: "Sen Đá Hồng Ngọc mọng nước màu hồng pastel dễ thương biểu tượng tình bạn vĩnh cửu. Sen đá để bàn làm việc chịu hạn tốt, tưới nước rất ít.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600", isFeatured: true },
  { name: "Sen Đá Cẩm Thạch", category: "Sen đá", tags: ["indoor", "easy-care", "low-water", "desktop"], price: 55000, costPrice: 18000, stock: 65, description: "Sen Đá Cẩm Thạch vân đá tự nhiên độc đáo mang bình an may mắn tài lộc. Thích hợp trang trí bàn làm việc hoặc làm quà tặng ý nghĩa bạn bè.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600", isFlashSale: true, discountPercentage: 10 },
  { name: "Xương Rồng Sao Độc Lạ", category: "Sen đá", tags: ["indoor", "outdoor", "easy-care", "low-water", "desktop"], price: 40000, costPrice: 12000, stock: 90, description: "Xương Rồng Sao mini để bàn làm việc gai mềm dáng tròn xinh xắn. Cây chịu hạn tốt lọc bức xạ máy tính trừ tà khí phong thủy hiệu quả.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600" },
  { name: "Sen Đá Kim Cương Trong", category: "Sen đá", tags: ["indoor", "easy-care", "low-water", "desktop"], price: 60000, costPrice: 22000, stock: 55, description: "Sen Đá Kim Cương lá trong suốt lấp lánh như ngọc quý mang phú quý tài lộc cho gia chủ. Cây sen đá để bàn văn phòng kiên cường dễ chăm sóc.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600" },
  { name: "Sen Đá Bánh Bao Mập", category: "Sen đá", tags: ["indoor", "easy-care", "low-water", "desktop"], price: 50000, costPrice: 20000, stock: 40, description: "Sen Đá Bánh Bao lá to tròn bầu bĩnh mọng nước dễ thương chịu nắng tốt. Cây sen đá phong thủy may mắn dồi dào dễ trồng cho người mới bắt đầu.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600" },
  { name: "Sen Đá Phật Bà Đẹp", category: "Sen đá", tags: ["indoor", "easy-care", "low-water", "desktop"], price: 65000, costPrice: 25000, stock: 35, description: "Sen Đá Phật Bà nhiều lớp lá đan xen mang lại may mắn bình an cát tường hóa giải vận xui. Cây sen đá phong thủy để bàn xinh xắn dễ thương.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600" },
  { name: "Sen Đá Đất Xanh", category: "Sen đá", tags: ["indoor", "easy-care", "low-water"], price: 42000, costPrice: 15000, stock: 75, description: "Sen Đá Đất Xanh dáng đài xếp lớp đều đặn như bông hoa đất, chịu nắng khô hạn cực tốt. Phù hợp trồng chậu gốm nhỏ trang trí cửa sổ.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600" },
  { name: "Sen Đá Nâu Socola", category: "Sen đá", tags: ["indoor", "low-water", "easy-care"], price: 45000, costPrice: 17000, stock: 85, description: "Sen Đá Nâu sẫm màu socola độc đáo, mang vẻ ngoài mạnh mẽ cá tính. Cây có ý nghĩa tình yêu chung thủy son sắt vững bền theo thời gian.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600" },
  { name: "Xương Rồng Thanh Sơn", category: "Sen đá", tags: ["indoor", "outdoor", "low-water"], price: 55000, costPrice: 22000, stock: 60, description: "Xương Rồng Thanh Sơn mô phỏng những ngọn núi thu nhỏ xanh trùng điệp. Cây phát triển nhanh, chịu hạn tốt, lọc khí và chống tia bức xạ tốt.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600" },
  { name: "Sen Đá Thạch Bích", category: "Sen đá", tags: ["indoor", "low-water", "feng-shui"], price: 70000, costPrice: 25000, stock: 30, description: "Cây Sen Đá Thạch Bích (Ngọc Bích) biểu trưng cho tiền bạc tài sản dồi dào. Lá viền đỏ rực rỡ khi đón đủ nắng, thích hợp đặt quầy thu ngân.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600" },
  { name: "Sen Đá Đô La Hồng", category: "Sen đá", tags: ["indoor", "low-water", "hanging"], price: 85000, costPrice: 32000, stock: 40, description: "Cây Sen Đá Đô La Hồng dáng rủ lá nhỏ tròn viền hồng phớt lãng mạn. Mang lại tài lộc và vận may tiền tài thịnh vượng cho phòng khách sếp.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600", isFeatured: true },
  { name: "Sen Đá Dù Xanh Mini", category: "Sen đá", tags: ["indoor", "low-water", "desktop"], price: 38000, costPrice: 13000, stock: 95, description: "Sen Đá Dù Xanh dáng tròn xếp nếp như những chiếc dù nhỏ xanh tươi đan xen, sinh con nhánh cực nhanh, chịu khô hạn chịu bóng tốt.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600" },
];

// ── Users (20 users: 1 admin + 17 users + 2 delivery partners) ──────────────
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
  { name: "Vũ Thị Nam", email: "nam.vu@gmail.com", role: "user", phone: "0933445566" },
  { name: "Đỗ Tấn Phát", email: "phat.do@gmail.com", role: "user", phone: "0944556677" },
  { name: "Lý Thu Thảo", email: "thao.ly@gmail.com", role: "user", phone: "0955667788" },
  { name: "Mai Quốc Việt", email: "viet.mai@gmail.com", role: "user", phone: "0966778899" },
  { name: "Dương Mỹ Linh", email: "linh.duong@gmail.com", role: "user", phone: "0977889900" },
  { name: "Trịnh Minh Khang", email: "khang.trinh@gmail.com", role: "user", phone: "0988990011" },
  { name: "Phan Thanh Vy", email: "vy.phan@gmail.com", role: "user", phone: "0999001122" },
  { name: "Giao Hàng Nhanh (SPX)", email: "spx1@gmail.com", role: "deliverypartner", phone: "0900000001" },
  { name: "Giao Hàng Tiết Kiệm (GHTK)", email: "ghtk@gmail.com", role: "deliverypartner", phone: "0900000002" },
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

// ── Blogs (10) ───────────────────────────────────────────────────────────────
const BLOGS = [
  {
    title: "7 Loại Cây Cảnh Dễ Chăm Sóc Cho Người Bận Rộn",
    slug: "7-loai-cay-canh-de-cham-soc-cho-nguoi-ban-rong",
    excerpt: "Bạn bận rộn với công việc nhưng muốn có cây cảnh xanh trong nhà? Dưới đây là 7 loại cây rất dễ chăm sóc, chỉ cần tưới nước vài lần một tuần là khỏe mạnh.",
    content: "<h2>Cây Dễ Chăm Sóc Cho Người Bận Rộn</h2><p>Nếu bạn yêu thích cây cảnh nhưng không có nhiều thời gian để chăm sóc, đây là những gợi ý tuyệt vời cho bạn:</p><h3>1. Lưỡi Hổ (Snake Plant)</h3><p>Cây lưỡi hổ là vua của các cây chịu hạn. Bạn có thể để nó mấy tuần không tưới nước vẫn sống tốt. Nó chỉ cần ánh sáng gián tiếp và giữ độ ẩm vừa phải.</p><h3>2. Cây Kim Tiền (Pothos)</h3><p>Pothos rất thích hợp cho những người mới bắt đầu trồng cây. Nó phát triển nhanh, có thể sống trong ánh sáng yếu và chỉ cần tưới khi đất khô.</p><h3>3. Xương Rồng (Cactus)</h3><p>Xương rồng là loại cây chịu hạn tuyệt vời. Chúng có thể sống trong những điều kiện khô hạn nhất. Chỉ cần tưới nước ít lần một tháng và để nơi ánh sáng sáng.</p><h3>4. Trầu Bà (Philodendron)</h3><p>Trầu bà rất linh hoạt với ánh sáng và không quá khó tính về độ ẩm. Nó phát triển tốt cả trong ánh sáng yếu lẫn sáng.</p>",
    category: "Chăm Sóc Cây",
    tags: ["beginner", "easy-care", "indoor", "tips"],
    author: "Nguyễn Văn A",
    coverImage: "https://images.unsplash.com/photo-1576624471613-7ec5a8cfb637?w=800",
    status: "published",
    isFeatured: true,
    viewCount: 2450,
  },
  {
    title: "Cách Chữa Lành Cây Bị Vàng Lá Và Yếu Dần",
    slug: "cach-chua-lanh-cay-bi-vang-la-va-yeu-dan",
    excerpt: "Cây bị vàng lá là tín hiệu cảnh báo rằng cây của bạn có vấn đề. Tìm hiểu các nguyên nhân và cách khắc phục để cây lại xanh tươi.",
    content: "<h2>Tại Sao Cây Bị Vàng Lá?</h2><p>Cây bị vàng lá là một vấn đề phổ biến mà nhiều người gặp phải. Dưới đây là các nguyên nhân chính:</p><h3>1. Tưới Nước Quá Nhiều</h3><p>Đây là nguyên nhân hàng đầu gây vàng lá. Khi đất quá ẩm, rễ cây sẽ thối rễ và không thể hấp thụ dinh dưỡng. Luôn kiểm tra độ ẩm của đất trước khi tưới.</p><h3>2. Thiếu Ánh Sáng</h3><p>Nếu cây không nhận đủ ánh sáng, lá sẽ bắt đầu vàng và rơi. Hãy đặt cây ở vị trí nhận ánh sáng gián tiếp ít nhất 4-6 giờ mỗi ngày.</p><h3>3. Sâu Bệnh</h3><p>Các loại sâu và bệnh nấm cũng có thể gây vàng lá. Kiểm tra kỹ lưỡng mặt dưới các lá để phát hiện sâu bệnh.</p><h3>Cách Khắc Phục</h3><p>- Giảm tần suất tưới nước<br/>- Di chuyển cây đến vị trí sáng hơn<br/>- Bổ sung phân hữu cơ<br/>- Xử lý sâu bệnh bằng thuốc trừ sâu an toàn</p>",
    category: "Chăm Sóc Cây",
    tags: ["troubleshooting", "plant-care", "yellowing", "health"],
    author: "Trần Thị B",
    coverImage: "https://images.unsplash.com/photo-1530598394637-d3fc14007d53?w=800",
    status: "published",
    isFeatured: true,
    viewCount: 3120,
  },
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
  const userDocs = USERS.map((u) => {
    // Generate scattered register dates for users
    const registerDate = u.role === "admin" ? now : daysAgo(rand(1, 45));
    return {
      name: u.name, email: u.email, accountType: "LOCAL", googleId: null,
      role: u.role, phone: u.phone, avatar: null, isActive: true, passwordHash,
      isVerified: true, verificationCode: null, verificationCodeExpiresAt: null,
      resetToken: null, resetTokenExpiresAt: null, isTwoFactorEnabled: false,
      twoFactorSecret: null, backupCodes: [], cart: [],
      createdAt: registerDate, updatedAt: registerDate,
    };
  });
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

  // 6. Orders — Diverse statuses and times (over the past 60 days) to populate statistics
  console.log("📦 Seeding orders...");
  
  const deliveryPartnerUsers = [];
  const normalUserInfos = [];
  
  userIds.forEach((id, i) => {
    if (USERS[i].role === "user") {
      normalUserInfos.push({ id: id.toString(), index: i });
    } else if (USERS[i].role === "deliverypartner") {
      deliveryPartnerUsers.push({ id: id.toString(), name: USERS[i].name });
    }
  });

  const orderDocs = [];

  // Generate diverse orders for the 17 regular users
  for (let ui = 0; ui < normalUserInfos.length; ui++) {
    const { id: userId, index: userIdx } = normalUserInfos[ui];
    
    // Each user makes 4-8 orders across a range of 1 to 60 days ago
    const numOrders = rand(4, 8);

    for (let oi = 0; oi < numOrders; oi++) {
      const numItems = rand(1, 4);
      const chosen = new Set();
      while (chosen.size < numItems) chosen.add(rand(0, plantIds.length - 1));

      const items = [];
      let subtotal = 0;
      for (const pIdx of chosen) {
        const pId = plantIds[pIdx];
        const plant = plantLookup[pId.toString()];
        const qty = rand(1, 3);
        const unitPrice = plant.discountPercentage > 0
          ? Math.round(plant.price * (1 - plant.discountPercentage / 100))
          : plant.price;
        subtotal += unitPrice * qty;
        items.push({ plantId: pId.toString(), name: plant.name, quantity: qty, price: unitPrice });
      }

      // Free shipping threshold >= 500k VND
      const shippingFee = subtotal >= 500000 ? 0 : pick([15000, 20000, 30000]);
      let total = subtotal + shippingFee;

      // Random Order Statuses
      const statusRoll = Math.random();
      let orderStatus = "delivered";
      let paymentStatus = "paid";
      let deliveryPartnerId = null;
      let deliveryPartnerName = null;
      let returnReason = null;

      if (statusRoll < 0.15) {
        orderStatus = "pending";
        paymentStatus = pick(["paid", "unpaid"]);
      } else if (statusRoll < 0.30) {
        orderStatus = "processing";
        paymentStatus = "paid";
      } else if (statusRoll < 0.40) {
        orderStatus = "shipped";
        paymentStatus = pick(["paid", "unpaid"]);
        const partner = pick(deliveryPartnerUsers);
        if (partner) {
          deliveryPartnerId = partner.id;
          deliveryPartnerName = partner.name;
        }
      } else if (statusRoll < 0.48) {
        orderStatus = "returned";
        paymentStatus = "unpaid";
        const partner = pick(deliveryPartnerUsers);
        if (partner) {
          deliveryPartnerId = partner.id;
          deliveryPartnerName = partner.name;
          returnReason = pick([
            "Không liên lạc được với khách hàng qua số điện thoại",
            "Khách từ chối nhận hàng do thay đổi ý định",
            "Địa chỉ giao hàng không chính xác"
          ]);
        }
      } else if (statusRoll < 0.55) {
        orderStatus = "cancelled";
        paymentStatus = "unpaid";
      } else {
        // delivered
        orderStatus = "delivered";
        paymentStatus = "paid";
        if (Math.random() < 0.8) {
          const partner = pick(deliveryPartnerUsers);
          if (partner) {
            deliveryPartnerId = partner.id;
            deliveryPartnerName = partner.name;
          }
        }
      }

      // Scatter order dates in the past 60 days
      const daysAgoCount = rand(0, 60);
      const createdAt = daysAgo(daysAgoCount);
      const addr = addressDocs[userIdx];

      orderDocs.push({
        userId: userId,
        orderStatus,
        paymentStatus,
        total, items, shippingFee,
        shippingAddress: `${addr.fullName}, ${addr.phone}, ${addr.addressLine}, ${addr.ward}, ${addr.district}, ${addr.city}`,
        addressId: Object.values(addrResult.insertedIds)[userIdx],
        paymentMethod: pick(["cash", "qr"]),
        transactionCode: null,
        deliveryPartnerId,
        deliveryPartnerName,
        returnReason,
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
    // 60% chance to review each order item
    for (const item of order.items) {
      if (Math.random() > 0.6) continue;
      const pair = `${order.userId}_${item.plantId}`;
      if (reviewedPairs.has(pair)) continue;
      reviewedPairs.add(pair);

      const userIndex = userIds.findIndex((id) => id.toString() === order.userId.toString());
      const userName = USERS[userIndex]?.name || "Khách hàng";

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

  // 8. Blogs
  console.log("📝 Seeding blogs...");
  const blogDocs = BLOGS.map((b, i) => ({
    title: b.title,
    slug: b.slug,
    content: b.content,
    excerpt: b.excerpt,
    coverImage: b.coverImage,
    category: b.category,
    tags: b.tags || [],
    status: b.status || "published",
    author: b.author || "PlantWorld Admin",
    isFeatured: b.isFeatured || false,
    viewCount: b.viewCount || 0,
    createdAt: daysAgo(rand(5, 60)),
    updatedAt: now,
  }));

  if (blogDocs.length > 0) {
    await db.collection("blogs").insertMany(blogDocs);
  }

  // ── Summary ──
  const totalRevenue = orderDocs
    .filter(o => o.orderStatus === "delivered" && o.paymentStatus === "paid")
    .reduce((s, o) => s + o.total, 0);

  console.log("\n" + "═".repeat(50));
  console.log("✅ SEED COMPLETE!");
  console.log("═".repeat(50));
  console.log(`   Categories:  ${CATEGORIES.length}`);
  console.log(`   Plants:      ${plantDocs.length} (Expanded to 60 SEO-friendly plants)`);
  console.log(`   Users:       ${userDocs.length} (1 admin + 17 users + 2 delivery partners)`);
  console.log(`   Addresses:   ${addressDocs.length}`);
  console.log(`   Orders:      ${orderDocs.length} (Diverse order statuses: pending, processing, delivered, etc.)`);
  console.log(`   Reviews:     ${reviewDocs.length}`);
  console.log(`   Blogs:       ${blogDocs.length}`);
  console.log(`   Revenue (Paid/Delivered): ${totalRevenue.toLocaleString("vi-VN")}đ`);
  console.log("═".repeat(50));
  console.log("   🔑 All passwords: 123456");
  console.log("   👑 Admin: admin@plantworld.com / 123456");
  console.log("═".repeat(50));

  await client.close();
  process.exit(0);
}

main().catch((err) => { console.error("❌ Seed failed:", err); process.exit(1); });
