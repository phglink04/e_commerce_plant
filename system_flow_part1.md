# PlantWorld — Phân Tích Luồng Hệ Thống (Phần 1)

## 1. Tất Cả Module Hiện Có

### Backend (NestJS) — 15 modules
| # | Module | Controller Prefix | Auth |
|---|--------|-------------------|------|
| 1 | AuthModule | `/auth/*`, `/users/signup`, `/users/login` | Public + JWT |
| 2 | UsersModule | `/users/*` | JWT + Roles |
| 3 | PlantsModule | `/plants/*` | Public + Admin |
| 4 | OrdersModule | `/orders/*` | JWT + Roles |
| 5 | PaymentModule | `/payment/*` | JWT |
| 6 | HomeSettingsModule | `/home-settings/*` | Public GET, Admin PATCH |
| 7 | AddressModule | `/addresses/*` | JWT |
| 8 | CartModule | (trong UsersController) | JWT |
| 9 | DeliveryModule | `/delivery/*` | JWT + Roles |
| 10 | CategoriesModule | `/categories/*` | Public GET, Admin CUD |
| 11 | DashboardModule | `/admin/dashboard/*` | JWT + AdminGuard |
| 12 | BlogsModule | `/blogs/*` | Public GET, Admin CUD |
| 13 | DiscountsModule | `/discounts/*` | JWT + Roles |
| 14 | ReviewsModule | `/reviews/*` | Public + JWT |
| 15 | ChatbotModule | `/chatbot/*` | Public (⚠️ thiếu guard) |
| 16 | **DebugModule** | `/debug/*` | **❌ Không có guard** |

### Frontend (Next.js 15 App Router) — 4 route groups
| Group | Pages | Mô tả |
|-------|-------|-------|
| `(public)` | `/`, `/shop`, `/plant/[plantId]`, `/blog`, `/blog/[slug]`, `/auth/login`, `/auth/register`, `/auth/verify`, `/auth/forgot-password` | Trang công khai |
| `(admin)` | `/admin`, `/admin/plants`, `/admin/orders`, `/admin/users`, `/admin/reviews`, `/admin/blogs`, `/admin/discounts`, `/admin/chat`, `/admin/analytics`, `/admin/home-settings`, `/admin/deliveryPartner`, `/admin/profile`, `/admin/login` | Admin dashboard |
| `(protected-user)` | `/profile`, `/settings`, `/my-orders`, `/cart`, `/checkout/success`, `/checkout/pending`, `/checkout/failed`, `/order-success` | User đã đăng nhập |
| `(delivery)` | `/deliveryPartner`, `/deliveryPartner/login`, `/deliveryPartner/orders`, `/deliveryPartner/profile`, `/deliveryPartner/settings` | Đối tác giao hàng |

---

## 2. Tất Cả API Endpoints (theo module)

### AUTH — `/api/auth/*` & `/api/users/*`
| Method | Path | Guard | Mô tả |
|--------|------|-------|-------|
| POST | `/api/auth/register` | None | Đăng ký (route mới) |
| POST | `/api/users/signup` | None | Đăng ký (route cũ — trùng lặp) |
| POST | `/api/auth/login` | LocalAuthGuard | Đăng nhập (route mới) |
| POST | `/api/users/login` | LocalAuthGuard | Đăng nhập (route cũ — trùng lặp) |
| POST | `/api/auth/send-activation` | None | Gửi lại mã kích hoạt |
| POST | `/api/auth/activate` | None | Kích hoạt tài khoản |
| POST | `/api/auth/verify-account` | None | Xác minh tài khoản (trùng /activate) |
| POST | `/api/auth/forgot-password` | None | Quên mật khẩu (route mới) |
| POST | `/api/users/forgetPassword` | None | Quên mật khẩu (route cũ — trùng lặp) |
| POST | `/api/auth/reset-password` | None | Đặt lại mật khẩu (route mới) |
| PATCH | `/api/users/resetPassword/:token` | None | Đặt lại mật khẩu (route cũ — trùng lặp) |
| POST | `/api/auth/google-auth` | None | Đăng nhập Google |
| POST | `/api/auth/2fa/authenticate` | None | Xác thực 2FA |
| POST | `/api/auth/2fa/setup` | JWT | Bật 2FA |
| POST | `/api/auth/2fa/verify` | JWT | Xác minh 2FA |
| POST | `/api/auth/2fa/disable` | JWT | Tắt 2FA |
| GET | `/api/auth/2fa/status` | JWT | Trạng thái 2FA |

### USERS — `/api/users/*`
| Method | Path | Guard | Mô tả |
|--------|------|-------|-------|
| GET | `/api/users/me` | JWT | Lấy thông tin cá nhân |
| PATCH | `/api/users/updateMe` | JWT | Cập nhật hồ sơ |
| PATCH | `/api/users/updateMyPassword` | JWT | Đổi mật khẩu |
| PATCH | `/api/users/update-avatar` | JWT | Cập nhật avatar |
| DELETE | `/api/users/deleteMe` | JWT | Xóa tài khoản |
| POST | `/api/users/addtocart` | JWT | Thêm vào giỏ hàng |
| PATCH | `/api/users/updatecart` | JWT | Cập nhật giỏ hàng |
| DELETE | `/api/users/deleteitem/:plantId` | JWT | Xóa item khỏi giỏ |
| GET | `/api/users/cart` | JWT | Lấy giỏ hàng |
| DELETE | `/api/users/clear-cart` | JWT | Xóa toàn bộ giỏ |
| GET | `/api/users/check-availability` | JWT | Kiểm tra tồn kho giỏ |
| GET | `/api/users/cart/total` | JWT | Tổng giá giỏ hàng |
| GET | `/api/users` | JWT + Admin | Danh sách users |
| GET | `/api/users/:id` | JWT + Admin | Chi tiết user |
| PATCH | `/api/users/:id` | JWT + Admin | Cập nhật user |
| DELETE | `/api/users/:id` | JWT + Admin | Xóa user |
| POST | `/api/users/add-delivery-partner` | JWT + Admin | Tạo tài khoản giao hàng |

### PLANTS — `/api/plants/*`
| Method | Path | Guard | Mô tả |
|--------|------|-------|-------|
| GET | `/api/plants` | None | Danh sách cây (có filter/search/page) |
| GET | `/api/plants/featured-products` | None | Cây nổi bật |
| GET | `/api/plants/flash-sale` | None | Flash sale |
| GET | `/api/plants/plant-stats` | None | Thống kê cây |
| GET | `/api/plants/plantTotal` | None | Tổng số cây |
| GET | `/api/plants/availability/:availability` | None | Lọc theo tình trạng |
| GET | `/api/plants/:slugAndId` | None | Chi tiết cây (slug+ID) |
| POST | `/api/plants` | JWT + Admin | Tạo cây mới |
| PATCH | `/api/plants/:id` | JWT + Admin | Cập nhật cây |
| DELETE | `/api/plants/:id` | JWT + Admin | Xóa cây |

### ORDERS — `/api/orders/*`
| Method | Path | Guard | Mô tả |
|--------|------|-------|-------|
| POST | `/api/orders` | JWT | Tạo đơn hàng |
| GET | `/api/orders` | JWT + Admin/Delivery | Danh sách đơn (admin) |
| GET | `/api/orders/myorders` | JWT | Đơn hàng của tôi |
| GET | `/api/orders/myorders/:orderId` | JWT | Chi tiết đơn của tôi |
| PATCH | `/api/orders/:orderId/status` | JWT + Admin/Delivery | Cập nhật trạng thái |
| PATCH | `/api/orders/:orderId/cancel` | JWT | Hủy đơn hàng |
| GET | `/api/orders/:orderId` | JWT + Admin/Delivery | Chi tiết đơn (admin) |

### PAYMENT — `/api/payment/*`
| Method | Path | Guard | Mô tả |
|--------|------|-------|-------|
| POST | `/api/payment/generate-qr` | JWT | Tạo QR VietQR |
| POST | `/api/payment/check-payment` | JWT | Kiểm tra thanh toán |
| GET | `/api/payment/check/:orderId` | JWT | Kiểm tra thanh toán theo orderId |
| POST | `/api/payment/checkout` | JWT | ⚠️ Stub — không dùng thực |

### ADDRESSES — `/api/addresses/*`
| Method | Path | Guard | Mô tả |
|--------|------|-------|-------|
| GET | `/api/addresses/my` | JWT | Địa chỉ của tôi |
| POST | `/api/addresses` | JWT | Thêm địa chỉ mới |
| PATCH | `/api/addresses/:addressId` | JWT | Cập nhật địa chỉ |
| DELETE | `/api/addresses/:addressId` | JWT | Xóa địa chỉ |
| GET | `/api/addresses` | JWT + Admin | Xem địa chỉ theo userId |

### DELIVERY — `/api/delivery/*`
| Method | Path | Guard | Mô tả |
|--------|------|-------|-------|
| GET | `/api/delivery/my-assignments` | JWT + Delivery | Đơn được giao |
| GET | `/api/delivery` | JWT + Admin | Tất cả giao hàng |
| POST | `/api/delivery/assign` | JWT + Admin | Phân công giao hàng |
| PATCH | `/api/delivery/:deliveryId/status` | JWT + Admin/Delivery | Cập nhật trạng thái |

### CATEGORIES — `/api/categories/*`
| Method | Path | Guard | Mô tả |
|--------|------|-------|-------|
| GET | `/api/categories` | None | Danh sách danh mục |
| GET | `/api/categories/:id` | None | Chi tiết danh mục |
| POST | `/api/categories` | JWT + Admin | Tạo danh mục |
| PATCH | `/api/categories/:id` | JWT + Admin | Cập nhật danh mục |
| DELETE | `/api/categories/:id` | JWT + Admin | Xóa danh mục |

### BLOGS — `/api/blogs/*`
| Method | Path | Guard | Mô tả |
|--------|------|-------|-------|
| GET | `/api/blogs/published` | None | Bài đăng đã publish |
| GET | `/api/blogs/featured` | None | Bài đăng nổi bật |
| GET | `/api/blogs/slug/:slug` | None | Bài theo slug |
| GET | `/api/blogs` | JWT + Admin | Tất cả blogs |
| GET | `/api/blogs/:id` | JWT + Admin | Chi tiết blog (admin) |
| POST | `/api/blogs` | JWT + Admin | Tạo bài viết |
| PATCH | `/api/blogs/:id` | JWT + Admin | Cập nhật bài viết |
| DELETE | `/api/blogs/:id` | JWT + Admin | Xóa bài viết |

### DISCOUNTS — `/api/discounts/*`
| Method | Path | Guard | Mô tả |
|--------|------|-------|-------|
| POST | `/api/discounts` | JWT + Admin | Tạo mã giảm giá |
| GET | `/api/discounts` | JWT + Admin | Danh sách mã (admin) |
| GET | `/api/discounts/visible` | JWT | Mã hiển thị cho user |
| GET | `/api/discounts/:id` | JWT + Admin | Chi tiết mã |
| PATCH | `/api/discounts/:id` | JWT + Admin | Cập nhật mã |
| DELETE | `/api/discounts/:id` | JWT + Admin | Xóa mã |
| POST | `/api/discounts/apply` | JWT | Áp dụng mã giảm giá |

### REVIEWS — `/api/reviews/*`
| Method | Path | Guard | Mô tả |
|--------|------|-------|-------|
| GET | `/api/reviews?productId=` | None | Đánh giá theo sản phẩm |
| GET | `/api/reviews/summary?productId=` | None | Tóm tắt rating |
| GET | `/api/reviews/can-review` | JWT | Kiểm tra có thể review |
| GET | `/api/reviews/pending` | JWT | Sản phẩm chờ review |
| POST | `/api/reviews` | JWT | Tạo đánh giá |
| POST | `/api/reviews/upload-image` | JWT | Upload ảnh review |
| POST | `/api/reviews/:id/like` | JWT | Like đánh giá |
| POST | `/api/reviews/:id/reply` | JWT | Phản hồi đánh giá |
| GET | `/api/reviews/my-reviews` | JWT | Đánh giá của tôi |
| PATCH | `/api/reviews/:id` | JWT | Sửa đánh giá |
| DELETE | `/api/reviews/:id` | JWT | Xóa đánh giá |
| GET | `/api/reviews/admin` | JWT + Admin | Tất cả đánh giá (admin) |
| PATCH | `/api/reviews/admin/:id/approve` | JWT + Admin | Duyệt đánh giá |
| PATCH | `/api/reviews/admin/:id/reject` | JWT + Admin | Từ chối đánh giá |
| DELETE | `/api/reviews/admin/:id` | JWT + Admin | Xóa đánh giá (admin) |

### HOME-SETTINGS — `/api/home-settings/*`
| Method | Path | Guard | Mô tả |
|--------|------|-------|-------|
| GET | `/api/home-settings` | None | Lấy cấu hình trang chủ |
| PATCH | `/api/home-settings` | JWT + Admin | Cập nhật cấu hình |
| POST | `/api/home-settings/upload-banner` | JWT + Admin | Upload ảnh banner |

### DASHBOARD — `/api/admin/dashboard/*`
| Method | Path | Guard | Mô tả |
|--------|------|-------|-------|
| GET | `/api/admin/dashboard/stats` | JWT + Admin | KPIs tổng quan |
| GET | `/api/admin/dashboard/chart/revenue` | JWT + Admin | Biểu đồ doanh thu |
| GET | `/api/admin/dashboard/chart/orders` | JWT + Admin | Biểu đồ đơn hàng |
| GET | `/api/admin/dashboard/top-products` | JWT + Admin | Top sản phẩm |
| GET | `/api/admin/dashboard/recent-orders` | JWT + Admin | Đơn hàng gần đây |
| GET | `/api/admin/dashboard/low-stock` | JWT + Admin | Sắp hết hàng |
| GET | `/api/admin/dashboard/analytics/stats` | JWT + Admin | Thống kê theo ngày |
| GET | `/api/admin/dashboard/analytics/order-status` | JWT + Admin | Phân bố trạng thái |
| GET | `/api/admin/dashboard/analytics/top-products` | JWT + Admin | Top sản phẩm theo ngày |
| GET | `/api/admin/dashboard/analytics/review-stats` | JWT + Admin | Thống kê đánh giá |
| GET | `/api/admin/dashboard/analytics/recent-customers` | JWT + Admin | Khách hàng mới |

### CHATBOT — `/api/chatbot/*`
| Method | Path | Guard | Mô tả |
|--------|------|-------|-------|
| GET | `/api/chatbot/status` | **None** | Trạng thái chatbot |
| POST | `/api/chatbot/session/create` | **None** | Tạo phiên mới |
| POST | `/api/chatbot/session/new` | **None** | Tạo phiên mới (đóng cũ) |
| POST | `/api/chatbot/message/send` | **None** | Gửi tin nhắn |
| GET | `/api/chatbot/history/:chatId` | **None** | Lịch sử chat |
| GET | `/api/chatbot/user/:userId` | **None** | Chat của user |
| POST | `/api/chatbot/request-admin` | **None** | Yêu cầu admin |
| GET | `/api/chatbot/admin/active` | **None ⚠️** | Danh sách active |
| GET | `/api/chatbot/admin/pending` | **None ⚠️** | Danh sách pending |
| GET | `/api/chatbot/admin/stats` | **None ⚠️** | Thống kê chat |
| GET | `/api/chatbot/admin/all` | **None ⚠️** | Tất cả sessions |
| GET | `/api/chatbot/admin/:adminId` | **None ⚠️** | Chat theo admin |
| POST | `/api/chatbot/admin/takeover` | **None ⚠️** | Admin nhận chat |
| POST | `/api/chatbot/admin/release` | **None ⚠️** | Trả về bot |
| POST | `/api/chatbot/admin/close` | **None ⚠️** | Đóng chat |
| POST | `/api/chatbot/admin/send-message` | **None ⚠️** | Admin gửi tin nhắn |
| DELETE | `/api/chatbot/admin/:id` | **None ⚠️** | Xóa phiên |

### DEBUG — `/api/debug/*` 🔴 CRITICAL
| Method | Path | Guard | Mô tả |
|--------|------|-------|-------|
| POST | `/api/debug/upload` | **None 🔴** | Upload file Supabase |
