# Tài liệu ý nghĩa các file/thư mục trong `client`

Tài liệu này giải thích nhanh vai trò của các file và thư mục chính trong frontend Next.js.

## 1) Cấu hình gốc (thư mục `client`)

| File/Thư mục          | Ý nghĩa                                                                             |
| --------------------- | ----------------------------------------------------------------------------------- |
| `package.json`        | Khai báo dependencies và scripts chạy dự án (`dev`, `build`, `start`, `lint`, ...). |
| `next.config.ts`      | Cấu hình Next.js ở mức project (image domains, rewrite, optimization...).           |
| `tsconfig.json`       | Cấu hình TypeScript và alias import (ví dụ `@/`).                                   |
| `eslint.config.mjs`   | Luật lint cho code frontend.                                                        |
| `next-env.d.ts`       | File generated bởi Next.js để hỗ trợ type. Không chỉnh tay.                         |
| `.env` / `.env.local` | Biến môi trường frontend (ví dụ `NEXT_PUBLIC_API_URL`).                             |
| `README.md`           | Hướng dẫn chạy client và mô tả baseline hiện tại.                                   |
| `public/`             | Chứa static assets được serve trực tiếp.                                            |
| `src/`                | Toàn bộ mã nguồn chính của frontend.                                                |

## 2) Static assets (`public/frontend`)

| Thư mục                                                                                                                                    | Ý nghĩa                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `AboutUS`, `BlogPage`, `Contact Us`, `Featured Products`, `Feedback`, `Home Page`, `Shop By Category`, `Shop Page`, `Notification`, `logo` | Chứa ảnh/banner/icon dùng cho các section landing và trang public. |
| `Profile.jpg`                                                                                                                              | Ảnh profile mẫu, được dùng trong mock data/profile UI.             |

Lưu ý: các ảnh trong `public` truy cập bằng path tuyệt đối kiểu `/frontend/...`.

## 3) App Router (`src/app`)

| File/Thư mục                  | Ý nghĩa                                                                 |
| ----------------------------- | ----------------------------------------------------------------------- |
| `globals.css`                 | CSS global áp dụng cho toàn bộ app.                                     |
| `layout.tsx`                  | Root layout của Next.js; bọc toàn app bằng `AppLayout`.                 |
| `(public)/`                   | Route group cho trang public: home, about, blog, contact, auth, shop... |
| `(protected-user)/`           | Route group cho người dùng đã đăng nhập: cart, my-orders, profile...    |
| `(admin)/admin/`              | Route group dashboard quản trị viên.                                    |
| `(delivery)/deliveryPartner/` | Route group dashboard đối tác giao hàng.                                |

### Một vài route quan trọng đã thấy

- `(public)/page.tsx`: trang home, render `HomeContent`.
- `(public)/layout.tsx`: layout riêng cho route public.
- `(protected-user)/layout.tsx`: layout cho route yêu cầu user đăng nhập.

## 4) Bảo vệ route (`src/middleware.ts`)

`middleware.ts` xử lý điều hướng theo trạng thái đăng nhập và role:

- Đọc token từ cookie `auth_token`.
- Xác định role từ cookie `auth_role` hoặc decode từ JWT.
- Chặn truy cập route protected nếu chưa login.
- Chặn truy cập sai role (user vào admin, admin vào route chỉ dành cho user, ...).
- Redirect người đã login khỏi các trang login về trang home theo role.

## 5) Components (`src/components`)

| Thư mục    | Ý nghĩa                                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `auth/`    | Các form và UI luồng xác thực: `LoginForm`, `RegisterForm`, `ForgotPasswordForm`, `ResetPasswordForm`, `VerifyAccountForm`, `AuthShell`, `role-guard`. |
| `landing/` | Các section cho landing/home/public pages.                                                                                                             |
| `layouts/` | Các layout component dùng chung (bao gồm `app-layout`).                                                                                                |
| `site/`    | UI dùng chung cho site (header/footer/menu/chunk tái sử dụng).                                                                                         |

## 6) Lib dùng chung (`src/lib`)

| File              | Ý nghĩa                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| `api.ts`          | Khởi tạo Axios instance, tự gắn `Authorization` header từ token, xử lý lỗi 401 toàn cục.                  |
| `auth.ts`         | Helper token phía client: `getToken`, `setToken`, `clearToken`; đồng bộ localStorage và cookie.           |
| `role-routing.ts` | Chuẩn hóa role, phân loại role admin/delivery, map route home theo role, decode role từ JWT.              |
| `mock-content.ts` | Dữ liệu giả cho About/Blog/FAQ/Contact/Profile/Cart/Order/Plant để render UI khi chưa nối backend đầy đủ. |

## 7) State và types

| File                  | Ý nghĩa                                                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `store/auth-store.ts` | Zustand store cho auth: login, register, forgot/reset password, verify account, google login, logout; quản lý `user`, `token`, `loading`, `error`, `success`. |
| `types/auth.ts`       | Các kiểu dữ liệu auth (`User`, `LoginPayload`, `RegisterPayload`, ...).                                                                                       |

## 8) Luồng hoạt động auth (tóm tắt)

1. Form trong `components/auth/*` gọi action trong `store/auth-store.ts`.
2. Auth store gọi API qua `lib/api.ts`.
3. Khi login thành công, token và role được lưu vào localStorage + cookie qua `lib/auth.ts`.
4. `middleware.ts` dựa vào cookie/token để cho phép hoặc điều hướng route theo role.

## 9) Gợi ý bảo trì

- Khi thêm role mới: cập nhật `types/auth.ts`, `lib/role-routing.ts`, `middleware.ts`.
- Khi đổi endpoint backend: cập nhật trong `store/auth-store.ts` và/hoặc helper API tương ứng.
- Khi thêm trang protected mới: bổ sung matcher/prefix trong `middleware.ts` nếu cần bảo vệ route ở edge.
