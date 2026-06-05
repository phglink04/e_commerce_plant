# PlantWorld — Phân Tích Luồng Hệ Thống (Phần 2)

## 3. User Flow — Khách Hàng

```
[Truy cập trang chủ /]
    │
    ├──► Xem featured products → /shop → Filter/Search → /plant/[id]
    │         │
    │    [Chưa đăng nhập]
    │         │
    │         ▼
    │    Thêm vào giỏ → Redirect → /auth/login
    │
    ├──► Đăng ký tài khoản
    │    /auth/register → POST /api/auth/register → Email OTP
    │    → /auth/verify → POST /api/auth/activate → Đăng nhập
    │
    ├──► Đăng nhập
    │    /auth/login → POST /api/auth/login → JWT token
    │    → Cookie: auth_token + auth_role
    │    → Redirect theo role:
    │       user → /shop | admin → /admin | delivery → /deliveryPartner
    │
    ├──► Google OAuth
    │    → POST /api/auth/google-auth → JWT → Redirect
    │
    └──► [Đã đăng nhập] Luồng mua hàng:
         │
         ├── Thêm vào giỏ → POST /api/users/addtocart
         │   (server validate stock, điều chỉnh nếu vượt quá)
         │
         ├── Xem giỏ /cart → GET /api/users/cart
         │   → Hiển thị CartItem, xóa/cập nhật số lượng
         │
         ├── Checkout /cart (dùng OrderSummary component)
         │   → Chọn địa chỉ → GET /api/addresses/my
         │   → Áp mã giảm giá → POST /api/discounts/apply
         │   → Chọn phương thức thanh toán
         │       ├── COD → POST /api/orders → Redirect /order-success
         │       └── QR → POST /api/orders
         │                → POST /api/payment/generate-qr → QR modal
         │                → Polling GET /api/payment/check/:orderId
         │                → Paid → Redirect /order-success
         │
         ├── Xem đơn hàng /my-orders → GET /api/orders/myorders
         │   → Chi tiết → GET /api/orders/myorders/:id
         │   → Hủy → PATCH /api/orders/:id/cancel
         │
         ├── Đánh giá sản phẩm
         │   /profile → Tab Đánh giá
         │   → GET /api/reviews/pending (sản phẩm chờ review)
         │   → POST /api/reviews (tạo review + upload ảnh)
         │   → GET /api/reviews/my-reviews (lịch sử review)
         │
         ├── Hồ sơ /profile
         │   → GET /api/users/me
         │   → PATCH /api/users/updateMe
         │   → PATCH /api/users/update-avatar
         │
         ├── Cài đặt /settings
         │   → PATCH /api/users/updateMyPassword
         │   → 2FA setup/verify/disable
         │
         └── Chat với bot
             → POST /api/chatbot/session/create
             → POST /api/chatbot/message/send
             → POST /api/chatbot/request-admin (nếu cần)
```

## 4. Admin Flow

```
[/admin/login] → POST /api/auth/login (targetRole: admin)
    │
    ▼
[/admin] — Dashboard
    ├── GET /api/admin/dashboard/stats
    ├── GET /api/admin/dashboard/chart/revenue
    ├── GET /api/admin/dashboard/top-products
    ├── GET /api/admin/dashboard/recent-orders
    └── GET /api/admin/dashboard/low-stock

[/admin/plants] — Quản lý cây
    ├── GET /api/plants?admin=true (danh sách)
    ├── POST /api/plants (tạo + upload ảnh)
    ├── PATCH /api/plants/:id (cập nhật)
    └── Soft-delete (đổi availability = "Discontinued")

[/admin/orders] — Quản lý đơn
    ├── GET /api/orders (filter status/search/page)
    ├── PATCH /api/orders/:id/status
    └── POST /api/delivery/assign (giao cho đối tác)

[/admin/users] — Quản lý người dùng
    ├── GET /api/users (filter role/search/page)
    ├── GET /api/users/:id
    ├── PATCH /api/users/:id (role, isActive)
    ├── DELETE /api/users/:id
    └── GET /api/orders?userId=xxx (lịch sử đơn)

[/admin/reviews] — Duyệt đánh giá
    ├── GET /api/reviews/admin
    ├── POST /api/reviews/:id/reply
    └── DELETE /api/reviews/admin/:id

[/admin/blogs] — Quản lý blog
    ├── GET /api/blogs
    ├── POST /api/blogs (tạo + upload ảnh)
    ├── PATCH /api/blogs/:id
    └── DELETE /api/blogs/:id

[/admin/discounts] — Mã giảm giá
    ├── GET /api/discounts
    ├── POST /api/discounts
    ├── PATCH /api/discounts/:id
    └── DELETE /api/discounts/:id

[/admin/analytics] — Thống kê
    ├── GET /api/admin/dashboard/analytics/stats?start&end
    ├── GET /api/admin/dashboard/analytics/order-status?start&end
    ├── GET /api/admin/dashboard/analytics/top-products?start&end
    ├── GET /api/admin/dashboard/analytics/review-stats?start&end
    └── GET /api/admin/dashboard/analytics/recent-customers?start&end

[/admin/home-settings] — Cài đặt trang chủ
    ├── GET /api/home-settings
    ├── PATCH /api/home-settings
    └── POST /api/home-settings/upload-banner

[/admin/chat] — Hỗ trợ khách hàng (Socket.IO)
    ├── GET /api/chatbot/admin/all
    ├── Socket: adminJoin, adminTakeover, adminSendMessage
    ├── Socket: adminRelease, adminCloseChat, adminTyping
    └── DELETE /api/chatbot/admin/:id

[/admin/deliveryPartner] — Quản lý đối tác
    ├── GET /api/users?role=deliverypartner
    └── POST /api/users/add-delivery-partner
```

## 5. Data Flow — Frontend → API → Database

```
[Browser]
    │
    │ HTTP/HTTPS
    ▼
[Next.js Client]
    ├── BaseApiService (axios) → Đọc token từ localStorage
    ├── lib/api.ts (axios) → Đọc token từ Cookie (auth_token)
    ├── lib/admin-api.ts → Đọc token từ Zustand store
    │
    │ REST API calls to http://localhost:5000/api
    ▼
[NestJS Server]
    ├── ThrottlerGuard → Rate limit 100 req/60s
    ├── JwtAuthGuard → Verify JWT
    ├── RolesGuard / AdminGuard → Phân quyền
    ├── ValidationPipe → Validate DTO
    ├── RequestLoggingInterceptor → Log requests
    ├── HttpExceptionFilter → Format errors
    │
    ├── Service Layer
    │     ├── MongoDB (Mongoose) → Users, Plants, Orders, Reviews...
    │     ├── Supabase Storage → Images (plants, blogs, avatars, reviews)
    │     ├── NodeMailer / SMTP → Email verification, password reset
    │     ├── Google OAuth Client → Xác thực Google
    │     ├── VietQR API → Tạo QR thanh toán
    │     ├── SepayAPI → Kiểm tra giao dịch
    │     ├── Gemini AI API → Chatbot responses
    │     └── Turnstile → CAPTCHA verification
    │
    └── Socket.IO Gateway → Real-time chat

[Database — MongoDB]
    ├── users collection → { name, email, passwordHash, role, cart[], ... }
    ├── plants collection → { name, price, stock, availability, ... }
    ├── orders collection → { userId, items[], status, payment, ... }
    ├── reviews collection → { productId, userId, rating, content, ... }
    ├── blogs collection → { title, content, status, ... }
    ├── discounts collection → { code, percentage, usageLimit, ... }
    ├── chatbots collection → { userId, messages[], status, ... }
    ├── addresses collection → { userId, city, district, ... }
    ├── categories collection → { name, slug, ... }
    └── homesettings collection → { heroSection, featuredSection, ... }
```

---

## 6. Endpoints Không Được Sử Dụng Từ Frontend

| Endpoint | Server | Lý do nghi ngờ không dùng |
|---------|--------|--------------------------|
| `POST /api/payment/checkout` | ✅ Có | Stub function — trả về message hướng dẫn, không logic thực |
| `GET /api/plants/plantTotal` | ✅ Có | Không thấy call trong client src |
| `DELETE /api/users/deleteMe` | ✅ Có | Không tìm thấy trong client components |
| `GET /api/users/check-availability` | ✅ Có | Trả về hardcoded `available: true` — chưa implement thực |
| `GET /api/users/cart/total` | ✅ Có | Client tính tổng locally, không call API này |
| `GET /api/chatbot/admin/active` | ✅ Có | Admin chat page chỉ dùng `getAllChats` |
| `GET /api/chatbot/admin/pending` | ✅ Có | Admin chat page chỉ dùng `getAllChats` với filter |
| `GET /api/chatbot/admin/stats` | ✅ Có | Không thấy component nào gọi `getChatStats()` |
| `GET /api/chatbot/admin/:adminId` | ✅ Có | `getAdminChats()` không được gọi ở đâu |
| `POST /api/users/signup` | ✅ Có | Trùng với `/api/auth/register` — route cũ, không dùng |
| `POST /api/users/login` | ✅ Có | Trùng với `/api/auth/login` — route cũ, không dùng |
| `POST /api/users/forgetPassword` | ✅ Có | Trùng với `/api/auth/forgot-password` |
| `PATCH /api/users/resetPassword/:token` | ✅ Có | Trùng với `/api/auth/reset-password` |
| `POST /api/auth/verify-account` | ✅ Có | Trùng với `/api/auth/activate` |
| `PATCH /api/reviews/admin/:id/approve` | ✅ Có | `approveReview()` trong service nhưng không được gọi từ UI |
| `PATCH /api/reviews/admin/:id/reject` | ✅ Có | `rejectReview()` trong service nhưng không được gọi từ UI |
| `GET /api/delivery` | ✅ Có | Admin không có UI để xem danh sách delivery riêng |
| `POST /api/debug/upload` | ✅ Có | **🔴 Debug code — phải xóa** |

---

## 7. Pages Không Được Sử Dụng / Orphan

| Page | Path | Vấn đề |
|------|------|--------|
| `/checkout/success` | `(protected-user)/checkout/success` | Tồn tại nhưng routing qua `/order-success` |
| `/checkout/pending` | `(protected-user)/checkout/pending` | Không thấy redirect đến đây trong checkout flow |
| `/checkout/failed` | `(protected-user)/checkout/failed` | Không thấy redirect đến đây trong checkout flow |
| `/admin/profile` | `(admin)/admin/profile` | Admin có trang profile riêng — chưa verify dùng không |
| `/admin/deliveryPartner` | `(admin)/admin/deliveryPartner` | Quản lý delivery partner — tách biệt với `/admin/users` |

> **Ghi chú:** `/order-success` và `/checkout/success` có thể là 2 trang khác nhau cho 2 flow khác nhau (COD vs QR).

---

## 8. Components Không Được Sử Dụng

| Component | File | Vấn đề |
|-----------|------|--------|
| `admin-card.tsx` | `components/admin/ui/admin-card.tsx` | Không tìm thấy import nào |
| `form-input.tsx` | `components/admin/ui/form-input.tsx` | Không tìm thấy import nào |
| `QRPaymentModal.tsx` | `components/cart-checkout/QRPaymentModal.tsx` | Định nghĩa nhưng **không có component nào import** |
| `components/common/` | `components/common/` | **Thư mục rỗng** |

> **Lưu ý:** `QRPaymentModal` có thể đã bị thay bằng modal inline trong `OrderSummary.tsx`

---

## 9. Kiểm Tra Tính Nhất Quán Frontend — Backend

### ✅ Nhất quán
- Auth flow: register → verify → login → JWT → cookie ✅
- Plant CRUD: Frontend gọi đúng endpoints ✅
- Order lifecycle: pending → confirmed → preparing → shipped → delivered ✅
- Payment QR: generate → poll → confirm ✅
- Admin reviews: list, delete, reply ✅
- Discounts: CRUD + apply ✅
- Dashboard analytics: 5 endpoints frontend gọi đủ ✅

### ❌ Không nhất quán

| Vấn đề | Chi tiết |
|--------|---------|
| **Admin reviews thiếu approve/reject UI** | Backend có `/api/reviews/admin/:id/approve` và `/reject` nhưng admin page không có nút này — chỉ có xóa và trả lời |
| **Cart được lưu 2 nơi** | Server: trong `users.cart[]` (embedded) và module `cart/` riêng — nhưng `CartModule` không có controller riêng |
| **Delivery assign không có UI** | Backend `POST /api/delivery/assign` tồn tại nhưng admin không gọi — thay vào đó gọi `PATCH /api/orders/:id/status` với deliveryPartnerId |
| **Duplicate auth routes** | `/api/users/signup` vs `/api/auth/register` — frontend dùng `/auth/register` |
| **Chatbot không có auth guard** | Tất cả chatbot endpoints public — bao gồm cả admin endpoints |
| **`check-availability` stub** | Backend trả về hardcoded `{available: true, unavailableItems: []}` không validate thực |
| **`payment/checkout` stub** | Backend trả về message hướng dẫn thay vì logic thực |

---

## 10. Chức Năng Bị Thiếu / Chưa Hoàn Thiện

| # | Chức năng | Trạng thái | File liên quan |
|---|-----------|-----------|----------------|
| 1 | **Approve/Reject review** trong admin UI | ❌ Backend có, Frontend thiếu UI | `admin/reviews/page.tsx` |
| 2 | **Check-availability** khi checkout | ❌ Backend stub (hardcoded) | `users.controller.ts` L281-296 |
| 3 | **Checkout success/failed/pending pages** | ⚠️ Pages tồn tại nhưng flow chưa clear | `checkout/success|failed|pending` |
| 4 | **Chatbot auth guard** | 🔴 Admin endpoints không có bảo vệ | `chatbot.controller.ts` |
| 5 | **Debug module** | 🔴 Phải xóa trước production | `debug/debug-upload.controller.ts` |
| 6 | **Mock topCustomers dashboard** | ⚠️ Data giả hardcode | `admin/page.tsx` L251-257 |
| 7 | **Categories management UI** | ❌ Backend CRUD đầy đủ, không có trang `/admin/categories` | `categories.controller.ts` |
| 8 | **Delivery assign từ admin** | ⚠️ Dùng orders/status thay vì delivery/assign | `admin/orders/page.tsx` |
| 9 | **Delete account (deleteMe)** | ❌ Backend có, Frontend không có nút xóa tài khoản | `settings/page.tsx` |
| 10 | **2FA trong admin profile** | ⚠️ Chỉ user profile có 2FA settings, admin chưa rõ | `admin/profile/page.tsx` |
| 11 | **Rate limiting cho chatbot** | ⚠️ Global throttler 100/60s — có thể bị abuse qua bot | `app.module.ts` |
| 12 | **Blog search/filter cho user** | ❌ Backend hỗ trợ query, Frontend blog page chưa có filter | `(public)/blog/page.tsx` |

---

## Tổng Kết

| Hạng mục | Số lượng |
|----------|---------|
| Backend modules | 16 (gồm debug) |
| Tổng endpoints | ~85 |
| Endpoints không dùng | ~18 |
| Frontend pages | ~30 |
| Pages nghi vấn | 5 |
| Components không dùng | 4 |
| Vấn đề nhất quán | 7 |
| Chức năng thiếu | 12 |
