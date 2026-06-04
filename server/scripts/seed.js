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

// ── Plants (30) ─────────────────────────────────────────────────────────────
const PLANTS = [
  // Cây để bàn (6)
  { name: "Kim Tiền Mini", category: "Cây để bàn", tags: ["indoor", "easy-care", "desktop", "office"], price: 85000, costPrice: 35000, stock: 45, description: "Cây Kim Tiền Mini để bàn làm việc phong thủy tài lộc mang lại may mắn thịnh vượng. Cây cảnh văn phòng lọc khí tốt, dễ chăm sóc.", imageCover: "https://images.unsplash.com/photo-1637967886160-fd78dc3ce3f5?w=600", isFeatured: true },
  { name: "Lưỡi Hổ Mini", category: "Cây để bàn", tags: ["indoor", "easy-care", "desktop", "low-water", "office"], price: 65000, costPrice: 25000, stock: 60, description: "Cây Lưỡi Hổ Mini thanh lọc không khí lọc bụi mịn hấp thụ bức xạ máy tính. Cây cảnh phong thủy đuổi xui xẻo thích hợp để bàn làm việc.", imageCover: "https://images.unsplash.com/photo-1593482892580-e32e47e0a38d?w=600", isFeatured: true },
  { name: "Xương Rồng Tai Thỏ", category: "Cây để bàn", tags: ["indoor", "easy-care", "desktop", "low-water", "pet-friendly"], price: 55000, costPrice: 20000, stock: 70, description: "Cây Xương Rồng Tai Thỏ mini dễ thương trang trí bàn học bàn làm việc. Cây chịu hạn tốt ưa nắng nhẹ làm quà tặng xinh xắn ý nghĩa.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600" },
  { name: "Trầu Bà Mini", category: "Cây để bàn", tags: ["indoor", "easy-care", "desktop", "shade-loving"], price: 75000, costPrice: 30000, stock: 50, description: "Cây Trầu Bà Mini dáng rủ thanh lọc không khí trong nhà hấp thụ formaldehyde. Cây trồng trong nhà lá xanh mướt dễ chăm sóc ưa bóng râm.", imageCover: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600" },
  { name: "Cẩm Nhung Đỏ", category: "Cây để bàn", tags: ["indoor", "easy-care", "desktop", "office"], price: 45000, costPrice: 18000, stock: 40, description: "Cây Cẩm Nhung Đỏ mini may mắn để bàn hợp mệnh Hỏa Thổ mang tài lộc. Cây Fittonia lá đỏ rực rỡ thu hút tài vận dễ trồng trong nhà.", imageCover: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600" },
  { name: "Nhất Mạt Hương", category: "Cây để bàn", tags: ["indoor", "easy-care", "desktop", "low-water"], price: 50000, costPrice: 20000, stock: 50, description: "Cây Nhất Mạt Hương đuổi muỗi tự nhiên để bàn làm việc văn phòng. Cây sen đá thơm tỏa hương dễ chịu giúp giải tỏa stress mệt mỏi.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600" },

  // Cây phong thủy (6)
  { name: "Kim Ngân Lộc", category: "Cây phong thủy", tags: ["indoor", "office", "living-room"], price: 320000, costPrice: 150000, stock: 20, description: "Cây Kim Ngân Lộc phong thủy phòng khách thu hút vượng khí tài lộc. Thân thắt bím sang trọng làm cây cảnh văn phòng trang trí nội thất.", imageCover: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=600", isFeatured: true },
  { name: "Phát Tài", category: "Cây phong thủy", tags: ["indoor", "shade-loving", "living-room", "office"], price: 250000, costPrice: 100000, stock: 25, description: "Cây Phát Tài phong thủy đem lại may mắn tài lộc thịnh vượng. Cây cảnh trong nhà lá xanh mướt lọc bụi bẩn làm đẹp không gian sống.", imageCover: "https://images.unsplash.com/photo-1632207691143-643e2a9a9361?w=600", isFeatured: true },
  { name: "Lan Ý", category: "Cây phong thủy", tags: ["indoor", "shade-loving", "bedroom", "living-room", "pet-friendly"], price: 180000, costPrice: 70000, stock: 30, description: "Cây Lan Ý lọc không khí hấp thụ bức xạ điện tử khí độc hại. Cây phong thủy hoa trắng thanh cao mang may mắn hòa khí cho gia đình.", imageCover: "https://images.unsplash.com/photo-1616690248297-4434834e0180?w=600" },
  { name: "Vạn Niên Thanh", category: "Cây phong thủy", tags: ["indoor", "easy-care", "living-room"], price: 150000, costPrice: 60000, stock: 35, description: "Cây Vạn Niên Thanh phong thủy mang cát tường trường thọ bình an. Cây xanh tốt quanh năm lọc không khí tốt thích hợp trồng phòng khách.", imageCover: "https://images.unsplash.com/photo-1501004318855-b174af0e925d?w=600" },
  { name: "Thiết Mộc Lan", category: "Cây phong thủy", tags: ["indoor", "office", "living-room"], price: 450000, costPrice: 200000, stock: 15, description: "Cây Thiết Mộc Lan ghép chậu phong thủy mang lại phú quý thịnh vượng. Cây cảnh nội thất lọc không khí bụi mịn thích hợp sảnh văn phòng.", imageCover: "https://images.unsplash.com/photo-1632207691143-643e2a9a9361?w=600" },
  { name: "Ngũ Gia Bì", category: "Cây phong thủy", tags: ["indoor", "easy-care", "living-room", "office"], price: 210000, costPrice: 90000, stock: 20, description: "Cây Ngũ Gia Bì đuổi muỗi côn trùng tự nhiên thanh lọc khí độc. Cây phong thủy phát triển sự nghiệp vững chắc thích hợp đặt phòng khách.", imageCover: "https://images.unsplash.com/photo-1501004318855-b174af0e925d?w=600" },

  // Cây trong nhà (6)
  { name: "Monstera", category: "Cây trong nhà", tags: ["indoor", "living-room", "shade-loving"], price: 350000, costPrice: 160000, stock: 18, description: "Cây Trầu Bà Nam Mỹ Monstera lá xẻ nghệ thuật trang trí nội thất sang trọng. Cây lọc không khí tạo không gian xanh mát phong cách châu Âu.", imageCover: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600", isFeatured: true, isFlashSale: true, discountPercentage: 15 },
  { name: "Đuôi Công", category: "Cây trong nhà", tags: ["indoor", "shade-loving", "bedroom", "living-room"], price: 280000, costPrice: 120000, stock: 15, description: "Cây Đuôi Công Calathea lá sọc hoa văn rực rỡ thu hút may mắn cát tường. Cây cảnh trong nhà ưa bóng râm mát thích hợp trang trí phòng ngủ.", imageCover: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600" },
  { name: "Cau Tiểu Trâm", category: "Cây trong nhà", tags: ["indoor", "shade-loving", "living-room", "office"], price: 220000, costPrice: 90000, stock: 22, description: "Cây Cau Tiểu Trâm để bàn làm việc hấp thụ bức xạ máy tính lọc không khí. Dáng cây mảnh mai phong thủy trừ tà khí mang may mắn.", imageCover: "https://images.unsplash.com/photo-1586185018858-33be5e70dc3c?w=600" },
  { name: "Trầu Bà Đế Vương", category: "Cây trong nhà", tags: ["indoor", "easy-care", "living-room", "office"], price: 195000, costPrice: 80000, stock: 28, description: "Cây Trầu Bà Đế Vương phong thủy sếp văn phòng thể hiện uy quyền ý chí tiến thủ. Cây lọc khí độc bụi mịn tốt dễ chăm sóc.", imageCover: "https://images.unsplash.com/photo-1637967886160-fd78dc3ce3f5?w=600" },
  { name: "Bàng Singapore", category: "Cây trong nhà", tags: ["indoor", "living-room", "office"], price: 390000, costPrice: 180000, stock: 12, description: "Cây Bàng Singapore nội thất hiện đại sang trọng dáng thẳng lá to tròn. Cây cảnh phong thủy hút tài lộc trang trí quán cafe văn phòng.", imageCover: "https://images.unsplash.com/photo-1586185018858-33be5e70dc3c?w=600" },
  { name: "Trầu Bà Thanh Xuân", category: "Cây trong nhà", tags: ["indoor", "living-room", "shade-loving"], price: 310000, costPrice: 130000, stock: 15, description: "Cây Trầu Bà Thanh Xuân lá xẻ sâu bản to tạo điểm nhấn không gian nội thất. Cây lọc khí formaldehyde độc hại cực tốt.", imageCover: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600" },

  // Cây ngoài trời (6)
  { name: "Hoa Hồng Đỏ", category: "Cây ngoài trời", tags: ["outdoor", "sunlight", "balcony"], price: 120000, costPrice: 45000, stock: 40, description: "Cây Hoa Hồng Đỏ trồng ban công sân vườn chịu nắng tốt nở hoa quanh năm. Cây hoa hồng mang vẻ quyến rũ ngát hương thơm cho ngôi nhà.", imageCover: "https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=600", isFlashSale: true, discountPercentage: 20 },
  { name: "Hoa Giấy", category: "Cây ngoài trời", tags: ["outdoor", "sunlight", "balcony", "low-water"], price: 95000, costPrice: 35000, stock: 50, description: "Cây Hoa Giấy leo ban công cổng nhà chịu nắng chịu hạn rực rỡ quanh năm. Cây hoa giấy phong thủy gắn kết gia đình mang lại may mắn.", imageCover: "https://images.unsplash.com/photo-1603912699214-92627f304eb6?w=600" },
  { name: "Nguyệt Quế", category: "Cây ngoài trời", tags: ["outdoor", "sunlight", "balcony"], price: 160000, costPrice: 65000, stock: 30, description: "Cây Nguyệt Quế hoa trắng thơm ngát phong thủy mang may mắn vinh quang. Cây cảnh ngoài trời chịu nắng thích hợp trồng ban công sân vườn.", imageCover: "https://images.unsplash.com/photo-1515586000433-45406d8e6662?w=600" },
  { name: "Hương Thảo", category: "Cây ngoài trời", tags: ["outdoor", "sunlight", "balcony", "easy-care"], price: 80000, costPrice: 30000, stock: 55, description: "Cây Hương Thảo Rosemary đuổi muỗi tự nhiên hương tinh dầu giúp thư giãn giảm stress. Cây gia vị trồng ban công sân vườn tiện lợi.", imageCover: "https://images.unsplash.com/photo-1515586000433-45406d8e6662?w=600", isFeatured: true },
  { name: "Tùng Bồng Lai", category: "Cây ngoài trời", tags: ["outdoor", "sunlight", "balcony", "easy-care"], price: 290000, costPrice: 120000, stock: 18, description: "Cây Tùng Bồng Lai bonsai mini trồng ban công phong thủy mang may mắn trường thọ. Cây tùng phong thủy thu hút quý nhân phù trợ gia chủ.", imageCover: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=600" },
  { name: "Hoa Nhài Ta", category: "Cây ngoài trời", tags: ["outdoor", "sunlight", "balcony"], price: 110000, costPrice: 45000, stock: 25, description: "Cây Hoa Nhài Ta hoa nhài trắng ngát hương thơm dễ chịu. Cây cảnh ngoài trời trồng ban công ưa nắng hoa nhài dùng ướp trà thanh mát.", imageCover: "https://images.unsplash.com/photo-1515586000433-45406d8e6662?w=600" },

  // Sen đá (6)
  { name: "Sen Đá Hồng Ngọc", category: "Sen đá", tags: ["indoor", "outdoor", "easy-care", "low-water", "desktop"], price: 45000, costPrice: 15000, stock: 80, description: "Sen Đá Hồng Ngọc mọng nước màu hồng pastel dễ thương biểu tượng tình bạn vĩnh cửu. Sen đá để bàn làm việc chịu hạn ít tưới nước.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600", isFeatured: true },
  { name: "Sen Đá Cẩm Thạch", category: "Sen đá", tags: ["indoor", "easy-care", "low-water", "desktop", "office"], price: 55000, costPrice: 18000, stock: 65, description: "Sen Đá Cẩm Thạch vân đá tự nhiên độc đáo mang bình an may mắn tài lộc. Thích hợp trang trí bàn làm việc làm quà tặng.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600", isFlashSale: true, discountPercentage: 10 },
  { name: "Xương Rồng Sao", category: "Sen đá", tags: ["indoor", "outdoor", "easy-care", "low-water", "desktop"], price: 40000, costPrice: 12000, stock: 90, description: "Xương Rồng Sao mini để bàn làm việc gai mềm dáng tròn xinh xắn. Cây chịu hạn tốt lọc bức xạ máy tính trừ tà khí phong thủy.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600" },
  { name: "Sen Đá Kim Cương", category: "Sen đá", tags: ["indoor", "easy-care", "low-water", "desktop", "pet-friendly"], price: 60000, costPrice: 22000, stock: 55, description: "Sen Đá Kim Cương lá trong suốt lấp lánh như ngọc quý mang phú quý tài lộc. Cây sen đá để bàn văn phòng kiên cường dễ chăm.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600" },
  { name: "Sen Đá Bánh Bao", category: "Sen đá", tags: ["indoor", "easy-care", "low-water", "desktop"], price: 50000, costPrice: 20000, stock: 40, description: "Sen Đá Bánh Bao lá to tròn bầu bĩnh mọng nước dễ thương chịu nắng tốt. Cây sen đá phong thủy may mắn dễ trồng cho người mới.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600" },
  { name: "Sen Đá Phật Bà", category: "Sen đá", tags: ["indoor", "easy-care", "low-water", "desktop"], price: 65000, costPrice: 25000, stock: 35, description: "Sen Đá Phật Bà nhiều lớp lá đan xen mang lại may mắn bình an cát tường hóa giải vận xui. Cây sen đá phong thủy để bàn xinh xắn.", imageCover: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600" },
];

// ── Users (1 admin + 10 users + 2 delivery partners) ────────────────────────
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
  {
    title: "Cây Phong Thủy May Mắn Cho Nhà Bạn",
    slug: "cay-phong-thuy-may-man-cho-nha-ban",
    excerpt: "Theo phong thủy phương Đông, những loại cây này mang lại may mắn, tài lộc và sức khỏe cho gia chủ.",
    content: "<h2>Cây Phong Thủy May Mắn</h2><p>Trong văn hóa Á Đông, cây cảnh không chỉ trang trí mà còn mang ý nghĩa phong thủy sâu sắc.</p><h3>Kim Ngân Lộc</h3><p>Đây là cây được coi là biểu tượng của tài lộc và thịnh vượng. Theo phong thủy, cây kim ngân nên được đặt gần cửa chính hoặc gần bàn làm việc để hút tài lộc.</p><h3>Phát Tài</h3><p>Cây phát tài với những chiếc lá xanh bóng mượt được cho là mang lại may mắn và tài vận. Nó phù hợp đặt trong phòng khách hoặc nơi làm việc.</p><h3>Cây Bạch Tuyết</h3><p>Với hoa trắng tinh khiết, cây bạch tuyết được coi là biểu tượng của sạch sẽ và may mắn. Nó rất thích hợp đặt trong phòng ngủ.</p><h3>Hướng Dẫn Đặt Cây Phong Thủy</h3><p>- Đặt ở vị trí nhận ánh sáng tốt<br/>- Tránh đặt cây bị héo úi hoặc chết khô<br/>- Luôn giữ cây xanh tươi và sạch sẽ<br/>- Đặt trong những vị trí được xem là đem lại may mắn theo phong thủy</p>",
    category: "Phong Thủy",
    tags: ["feng-shui", "lucky", "prosperity", "indoor"],
    author: "Lê Văn C",
    coverImage: "https://images.unsplash.com/photo-1604242680892-0b8e5ca7d3a8?w=800",
    status: "published",
    isFeatured: false,
    viewCount: 1850,
  },
  {
    title: "Hướng Dẫn Tưới Nước Đúng Cách Cho Cây Cảnh",
    slug: "huong-dan-tuoi-nuoc-dung-cach-cho-cay-canh",
    excerpt: "Tưới nước là yếu tố quan trọng nhất trong chăm sóc cây. Bài viết này sẽ giúp bạn hiểu rõ cách tưới nước đúng cho từng loại cây.",
    content: "<h2>Cách Tưới Nước Đúng Cho Cây Cảnh</h2><p>Một trong những sai lầm phổ biến nhất của những người trồng cây là tưới nước không đúng cách.</p><h3>Kiểm Tra Độ Ẩm Của Đất</h3><p>Trước khi tưới, luôn kiểm tra độ ẩm của đất bằng cách nhúng ngón tay vào sâu khoảng 2-3cm. Nếu cảm thấy đất khô, bạn có thể tưới nước.</p><h3>Tần Suất Tưới Nước</h3><p>- Cây trong nhà: 1-2 lần một tuần<br/>- Cây ngoài trời: 3-4 lần một tuần (phụ thuộc vào thời tiết)<br/>- Cây chịu hạn như xương rồng: 1 lần 2-3 tuần<br/>- Cây yêu ẩm: 2-3 lần một tuần</p><h3>Loại Nước Nên Dùng</h3><p>Nước lạnh thường tốt nhất. Nếu dùng nước máy, để nó 24 giờ trước khi tưới để chlorine thoát ra. Nước mưa là lựa chọn tốt nhất cho cây.</p><h3>Các Lỗi Thường Gặp</h3><p>- Tưới nước quá sáng sớm khi không cần<br/>- Để cây ngồi trong nước đọng<br/>- Tưới nước vào lúc quá nóng<br/>- Không kiểm tra độ ẩm trước khi tưới</p>",
    category: "Chăm Sóc Cây",
    tags: ["watering", "tips", "care", "basics"],
    author: "Phạm Văn D",
    coverImage: "https://images.unsplash.com/photo-1540220527546-75ee89f6f503?w=800",
    status: "published",
    isFeatured: true,
    viewCount: 2890,
  },
  {
    title: "Cách Nhân Giống Cây Cảnh Bằng Cách Cắt Cành",
    slug: "cach-nhan-giong-cay-canh-bang-cach-cat-canh",
    excerpt: "Muốn có thêm cây mà không cần mua? Tìm hiểu cách nhân giống cây bằng cách cắt cành đơn giản.",
    content: "<h2>Nhân Giống Cây Bằng Cách Cắt Cành</h2><p>Đây là một cách tiết kiệm để có thêm cây và cũng là cách tuyệt vời để làm mới cây cũ.</p><h3>Các Loại Cây Phù Hợp Để Cắt Cành</h3><p>- Trầu bà<br/>- Cây kim tiền<br/>- Cây ray nắng<br/>- Cây hóp lá<br/>- Cây lòi lan</p><h3>Các Bước Nhân Giống</h3><p><strong>Bước 1:</strong> Chọn cành khỏe mạnh, dài khoảng 10-15cm với 2-3 lá<br/><strong>Bước 2:</strong> Cắt cành bằng dao sạch, cắt ngay dưới nút lá<br/><strong>Bước 3:</strong> Loại bỏ lá dưới cùng, chỉ giữ 1-2 lá trên cùng<br/><strong>Bước 4:</strong> Nhúng phần cắt vào hormôn rễ (nếu có)<br/><strong>Bước 5:</strong> Cắm cành vào đất ẩm hoặc nước<br/><strong>Bước 6:</strong> Đặt ở nơi sáng, tránh nắng trực tiếp<br/><strong>Bước 7:</strong> Rễ thường mọc sau 1-2 tuần</p><h3>Chăm Sóc Cây Con</h3><p>Sau khi rễ mọc, tiếp tục giữ đất ẩm nhưng không quá ướt. Chỉ bắt đầu bón phân sau 3-4 tuần.</p>",
    category: "Chăm Sóc Cây",
    tags: ["propagation", "multiplying", "cuttings", "tips"],
    author: "Võ Thị E",
    coverImage: "https://images.unsplash.com/photo-1535673519555-de43abb2e10c?w=800",
    status: "published",
    isFeatured: false,
    viewCount: 1620,
  },
  {
    title: "Tạo Vườn Cây Xanh Trên Ban Công Nhỏ Hẹp",
    slug: "tao-vuon-cay-xanh-tren-ban-cong-nho-hep",
    excerpt: "Không có sân vườn lớn? Bạn vẫn có thể tạo một khu vườn xanh tuyệt đẹp trên ban công nhỏ hẹp của mình.",
    content: "<h2>Tạo Vườn Trên Ban Công Nhỏ</h2><p>Ban công là không gian hoàn hảo để trồng cây nếu bạn biết cách sử dụng nó.</p><h3>Chọn Cây Thích Hợp Cho Ban Công</h3><p>- Cây chịu nắng: cây hoa hồng, đâu kiểng, hoa bóp<br/>- Cây bán chịu nắng: trầu bà, phát tài<br/>- Cây rủi: cây trầu bà rủi, cây thịt man</p><h3>Hệ Thống Chậu Trồng</h3><p>Sử dụng các chậu nhỏ để tiết kiệm không gian. Chọn chậu có lỗ thoát nước để tránh tích tụ nước.</p><h3>Sắp Xếp Hợp Lý</h3><p>- Đặt cây cao hơn ở phía sau<br/>- Cây thấp ở phía trước<br/>- Sử dụng kệ để tăng chiều cao<br/>- Tạo lớp xanh đa tầng</p><h3>Chăm Sóc Cây Trên Ban Công</h3><p>Ban công thường có nắng mạnh, nên cây cần tưới nước thường xuyên hơn. Che phủ 20-30% ánh sáng trong những ngày nắng gắt bằng vải che hoặc rèm.</p>",
    category: "Trang Trí",
    tags: ["balcony", "small-space", "design", "decoration"],
    author: "Đỗ Văn F",
    coverImage: "https://images.unsplash.com/photo-1585741537191-ebc2d128ce8c?w=800",
    status: "published",
    isFeatured: true,
    viewCount: 2340,
  },
  {
    title: "Cây Cảnh Thanh Lọc Không Khí Tốt Nhất Cho Nhà",
    slug: "cay-canh-thanh-loc-khong-khi-tot-nhat-cho-nha",
    excerpt: "Những loại cây này không chỉ đẹp mà còn giúp thanh lọc không khí, tạo môi trường sống lành mạnh hơn.",
    content: "<h2>Cây Thanh Lọc Không Khí Trong Nhà</h2><p>Theo nghiên cứu, nhiều loại cây cảnh có khả năng hấp thụ các chất độc hại trong không khí.</p><h3>Cây Lưỡi Hổ</h3><p>Lưỡi hổ được NASA công nhận là một trong những loại cây thanh lọc không khí tốt nhất. Nó hấp thụ formaldehyde và benzene.</p><h3>Cây Kim Tiền</h3><p>Cây kim tiền lọc được xylene và formaldehyde khỏi không khí, đồng thời tăng độ ẩm.</p><h3>Cây Dành Dạ</h3><p>Loài hoa dành dạ màu trắng này hấp thụ xylene, benzene và formaldehyde rất tốt.</p><h3>Cây Bạch Tuyết</h3><p>Cây bạch tuyết lọc được ammonia, xylene, toluene và nhiều khí độc hại khác.</p><h3>Cây Cúc Hoa Dại</h3><p>Có khả năng lọc benzene, trichloroethylene, và formaldehyde.</p>",
    category: "Sức Khỏe",
    tags: ["air-purifying", "health", "indoor", "benefits"],
    author: "Ngô Thị G",
    coverImage: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800",
    status: "published",
    isFeatured: true,
    viewCount: 3450,
  },
  {
    title: "Những Sai Lầm Phổ Biến Khi Trồng Cây Trong Chậu",
    slug: "nhung-sai-lam-pho-bien-khi-trong-cay-trong-chau",
    excerpt: "Để tránh những sai lầm phổ biến, bạn cần biết những lỗi mà hầu hết những người trồng cây mắc phải.",
    content: "<h2>Những Sai Lầm Phổ Biến Trong Trồng Cây</h2><p>Dưới đây là những lỗi mà hầu hết mọi người đều mắc phải khi bắt đầu trồng cây.</p><h3>1. Chọn Chậu Quá Lớn</h3><p>Chậu quá lớn khiến đất quá ẩm, dẫn đến thối rễ. Chọn chậu vừa phải, chỉ lớn hơn cây 1-2cm.</p><h3>2. Đất Không Thoát Nước</h3><p>Sử dụng đất vườn thường khiến nước đọng. Hãy dùng đất trồng cây chuyên dụng hoặc trộn thêm cát, than nén để cải thiện thoát nước.</p><h3>3. Tưới Nước Quá Nhiều</h3><p>Đây là nguyên nhân chính gây chết cây. Luôn kiểm tra độ ẩm trước khi tưới.</p><h3>4. Không Bón Phân</h3><p>Cây trong chậu hết dinh dưỡng nhanh. Bón phân mỗi 2-3 tuần trong mùa sinh trưởng.</p><h3>5. Đặt Cây Ở Vị Trí Sai</h3><p>Mỗi loại cây cần nhu cầu ánh sáng khác nhau. Tìm hiểu yêu cầu của cây trước khi đặt vị trí.</p><h3>6. Không Kiểm Tra Sâu Bệnh</h3><p>Sâu bệnh phát triển nhanh trong chậu. Kiểm tra cây thường xuyên để phát hiện sớm.</p>",
    category: "Chăm Sóc Cây",
    tags: ["mistakes", "beginners", "tips", "care"],
    author: "Hạ Vĩ H",
    coverImage: "https://images.unsplash.com/photo-1600411652283-4b94f8dd3e47?w=800",
    status: "published",
    isFeatured: false,
    viewCount: 1950,
  },
  {
    title: "Hướng Dẫn Chọn Cây Cảnh Phù Hợp Với Phòng Của Bạn",
    slug: "huong-dan-chon-cay-canh-phu-hop-voi-phong-cua-ban",
    excerpt: "Mỗi phòng có đặc điểm ánh sáng và độ ẩm khác nhau. Hãy chọn cây phù hợp để chúng phát triển tốt nhất.",
    content: "<h2>Chọn Cây Cảnh Cho Từng Phòng</h2><p>Việc chọn cây phù hợp với từng không gian là chìa khóa thành công.</p><h3>Phòng Ngủ</h3><p>- Nên chọn cây thanh lọc không khí<br/>- Cây lưỡi hổ, cây bạch tuyết<br/>- Tránh cây có mùi quá nồng nặc</p><h3>Phòng Khách</h3><p>- Cây lớn để trang trí: kim ngân, phát tài<br/>- Cây có hoa để thêm màu sắc<br/>- Cây rủi trang trí góc</p><h3>Phòng Làm Việc</h3><p>- Cây để bàn dáng nhỏ<br/>- Cây kim tiền, xương rồng mini<br/>- Giúp tập trung và tạo không gian sạch</p><h3>Nhà Bếp</h3><p>- Cây kháng khuẩn tốt<br/>- Cây lưỡi hổ, cây bạch tuyết<br/>- Cây được đặt ở vị trí an toàn, tránh mỡ bắn</p><h3>Phòng Tắm</h3><p>- Cây yêu ẩm: trầu bà, cây hóp lá<br/>- Cây chịu độ ẩm cao<br/>- Đặt gần cửa sổ nếu có</p>",
    category: "Trang Trí",
    tags: ["room-selection", "placement", "tips", "design"],
    author: "Tâm Văn I",
    coverImage: "https://images.unsplash.com/photo-1599599810694-b5ac4dd64e58?w=800",
    status: "published",
    isFeatured: false,
    viewCount: 2120,
  },
  {
    title: "Quy Trình Trồng Cây Từ Hạt Giống - Từ A Đến Z",
    slug: "quy-trinh-trong-cay-tu-hat-giong-tu-a-den-z",
    excerpt: "Muốn trồng cây từ đầu bằng hạt giống? Bài viết này sẽ hướng dẫn bạn toàn bộ quy trình chi tiết.",
    content: "<h2>Trồng Cây Từ Hạt Giống</h2><p>Trồng cây từ hạt giống là trải nghiệm rất thú vị và bổ ích.</p><h3>Chuẩn Bị Dụng Cụ Và Vật Liệu</h3><p>- Chậu trồng với lỗ thoát nước<br/>- Đất trồng hạt giống (đất tơi nhẹ)<br/>- Hạt giống<br/>- Bình xịt nước<br/>- Giấy báo hoặc màng nhựa<br/>- Ánh sáng và nhiệt độ ổn định</p><h3>Bước 1: Chuẩn Bị Đất</h3><p>Trộn đất trồng cây với cát hoặc xơ dừa để tăng độ tơi và thoát nước. Đất phải ẩm nhưng không quá ướt.</p><h3>Bước 2: Gieo Hạt</h3><p>Rải hạt lên mặt đất, sau đó nhẹ nhàng ấn xuống. Một số loại hạt cần phủ lên một lớp đất mỏng.</p><h3>Bước 3: Tạo Độ Ẩm</h3><p>Phủ giấy báo hoặc màng nhựa lên chậu để giữ độ ẩm. Mỗi ngày xịt nước nhẹ để giữ đất ẩm.</p><h3>Bước 4: Chờ Nảy Mầm</h3><p>Đặt ở nơi ấm, nhưng không cần ánh sáng. Hạt thường nảy mầm trong 1-2 tuần.</p><h3>Bước 5: Di Chuyển Ánh Sáng</h3><p>Khi cây mọc, loại bỏ màng nhựa và đặt ở vị trí sáng để cây không bị徒長.</p>",
    category: "Chăm Sóc Cây",
    tags: ["seeds", "growing", "from-seeds", "guide"],
    author: "Nam Việt J",
    coverImage: "https://images.unsplash.com/photo-1574943320219-553eb2f72b84?w=800",
    status: "published",
    isFeatured: false,
    viewCount: 1540,
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

  for (let ui = 0; ui < normalUserInfos.length; ui++) {
    const { id: userId, index: userIdx } = normalUserInfos[ui];
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

      const roll = Math.random();
      let orderStatus = "delivered";
      let paymentStatus = "paid";
      let deliveryPartnerId = null;
      let deliveryPartnerName = null;
      let returnReason = null;

      if (roll < 0.15) {
        orderStatus = "shipped";
        paymentStatus = "unpaid";
        const partner = pick(deliveryPartnerUsers);
        if (partner) {
          deliveryPartnerId = partner.id;
          deliveryPartnerName = partner.name;
        }
      } else if (roll < 0.3) {
        orderStatus = "returned";
        paymentStatus = "unpaid";
        const partner = pick(deliveryPartnerUsers);
        if (partner) {
          deliveryPartnerId = partner.id;
          deliveryPartnerName = partner.name;
          returnReason = pick([
            "Khách hàng hẹn lại ngày giao khác",
            "Không liên lạc được với khách hàng qua số điện thoại",
            "Khách từ chối nhận hàng do thay đổi ý định",
            "Địa chỉ giao hàng không chính xác"
          ]);
        }
      } else {
        // delivered
        if (Math.random() < 0.5) {
          const partner = pick(deliveryPartnerUsers);
          if (partner) {
            deliveryPartnerId = partner.id;
            deliveryPartnerName = partner.name;
          }
        }
      }

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
  console.log(`   Blogs:       ${blogDocs.length}`);
  console.log(`   Revenue:     ${totalRevenue.toLocaleString("vi-VN")}đ`);
  console.log("═".repeat(50));
  console.log("   🔑 All passwords: 123456");
  console.log("   👑 Admin: admin@plantworld.com / 123456");
  console.log("═".repeat(50));

  await client.close();
  process.exit(0);
}

main().catch((err) => { console.error("❌ Seed failed:", err); process.exit(1); });
