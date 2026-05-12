# PlantWorld Server (NestJS)

Tai lieu nay mo ta backend cua du an PlantWorld trong thu muc `server/`.

## 1. Tong quan

- Framework: NestJS 11 + TypeScript
- Database: MongoDB (Mongoose)
- Xac thuc: JWT, Local login, Google token verify, 2FA (TOTP)
- Upload file: Multer + Supabase Storage
- Email: SMTP (gui ma kich hoat, reset password)
- Payment: luong VietQR (tao QR, kiem tra giao dich)

Diem vao ung dung:

- Prefix API toan cuc: `/api`
- Port mac dinh: `5000`

Vi du URL:

- `http://localhost:5000/api/plants`

## 2. Cau truc thu muc chinh

```text
server/
  src/
    main.ts
    app.module.ts
    auth/
    helpers/
    module/
      users/
      plants/
      orders/
      payment/
      home-settings/
      address/
      cart/
      delivery/
  scripts/
    seed.js
  .env.example
  package.json
```

## 3. Cai dat va chay local

### 3.1 Cai dependencies

```bash
cd server
npm install
```

### 3.2 Cau hinh moi truong

Tao file `.env` tu `.env.example`:

```bash
copy .env.example .env
```

Bien toi thieu can co:

- `PORT`
- `FRONTEND_URL`
- `MONGODB_URI`
- `JWT_SECRET`

### 3.3 Chay development

```bash
npm run start:dev
```

### 3.4 Build production

```bash
npm run build
npm run start:prod
```

### 3.5 Seed du lieu mau (tuy chon)

```bash
npm run seed
```

## 4. Bien moi truong

### 4.1 Bat buoc

- `PORT`: cong backend (mac dinh 5000)
- `FRONTEND_URL`: domain frontend de CORS
- `MONGODB_URI`: chuoi ket noi MongoDB
- `JWT_SECRET`: khoa ky/verify JWT
- `JWT_EXPIRES_IN`: thoi gian het han token (vd `7d`)

### 4.2 Tich hop bo sung

- `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_BUCKET`: upload anh
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: gui email
- `GOOGLE_CLIENT_ID`: verify Google sign-in token
- `TWO_FACTOR_APP_NAME`: ten hien thi 2FA app
- `BANK_ACQ_ID`, `BANK_ACCOUNT_NO`, `BANK_ACCOUNT_NAME`, `MB_USERNAME`, `MB_PASSWORD`: thanh toan QR/chuyen khoan
- `AUTH_EXPOSE_DEBUG_TOKENS`: hien debug token trong response (chi dung local)

### 4.3 Khuyen nghi bao mat

- Khong commit `.env` len git.
- Neu da lo secret, can rotate ngay (JWT secret, SMTP, Supabase, API keys, tai khoan ngan hang).
- Tat `AUTH_EXPOSE_DEBUG_TOKENS` tren moi truong production.

## 5. Kien truc module

Module chinh dang duoc su dung:

- `auth`: dang ky/dang nhap/JWT/2FA/Google auth
- `users`: thong tin user, avatar, dia chi, gio hang, quan tri user
- `plants`: CRUD san pham cay canh
- `orders`: tao va quan ly don hang
- `payment`: tao QR va check thanh toan
- `home-settings`: cau hinh noi dung trang chu
- `helpers`: mail service, supabase storage service

Ghi chu:

- Thu muc `module/address`, `module/cart`, `module/delivery` hien co file module/controller/service nhung dang rong.

## 6. Xac thuc va phan quyen

### 6.1 JWT

- Header:
  - `Authorization: Bearer <access_token>`
- Guard:
  - `JwtAuthGuard` doc token va gan payload vao request user

### 6.2 Vai tro

He thong role:

- `user`
- `admin`
- `owner`
- `deliverypartner`

Phan quyen:

- `RolesGuard` + decorator `@Roles(...)`
- `AdminGuard`: chi cho `admin` hoac `owner`

## 7. API Endpoint (tom tat)

Tat ca endpoint deu co prefix `/api`.

### 7.1 Auth

- `POST /auth/register`: dang ky
- `POST /users/signup`: dang ky (alias)
- `POST /auth/login`: dang nhap
- `POST /users/login`: dang nhap (alias)
- `POST /auth/send-activation`: gui lai ma kich hoat
- `POST /auth/activate`: kich hoat tai khoan
- `POST /auth/verify-account`: xac minh tai khoan
- `POST /auth/forgot-password`: quen mat khau
- `POST /users/forgetPassword`: quen mat khau (alias)
- `POST /auth/reset-password`: reset password theo token trong body
- `PATCH /users/resetPassword/:token`: reset password theo token tren path
- `POST /auth/google-auth`: dang nhap bang Google token
- `POST /auth/2fa/setup`: tao secret + QR 2FA (JWT)
- `POST /auth/2fa/verify`: bat 2FA (JWT)
- `POST /auth/2fa/disable`: tat 2FA (JWT)
- `POST /auth/2fa/authenticate`: xac nhan ma 2FA sau login
- `GET /auth/2fa/status`: trang thai 2FA (JWT)

### 7.2 Users

Can JWT tru khi ghi chu khac.

- `PATCH /users/updateMyPassword`
- `PATCH /users/updateMe`
- `PATCH /users/update-avatar` (upload file `avatar`)
- `DELETE /users/deleteMe`
- `GET /users/me`

Quan ly gio hang:

- `POST /users/addtocart`
- `PATCH /users/updatecart`
- `DELETE /users/deleteitem/:plantId`
- `GET /users/cart`
- `DELETE /users/clear-cart`
- `GET /users/check-availability`
- `GET /users/cart/total`

Quan ly dia chi:

- `GET /users/addresses`
- `POST /users/addresses`
- `PATCH /users/addresses/:addressId`
- `DELETE /users/addresses/:addressId`

Quan tri user (`admin`, `owner`):

- `GET /users`
- `GET /users/:id`
- `PATCH /users/:id`
- `DELETE /users/:id`
- `POST /users/add-delivery-partner`

### 7.3 Plants

Public:

- `GET /plants`
- `GET /plants/:id`
- `GET /plants/featured-products`
- `GET /plants/plant-stats`
- `GET /plants/plantTotal`
- `GET /plants/availability/:availability`

Quan tri (`admin`, `owner`, can JWT):

- `POST /plants` (ho tro upload file `image`)
- `PATCH /plants/:id` (ho tro upload file `image`)
- `DELETE /plants/:id`

### 7.4 Orders

Can JWT:

- `POST /orders`: tao don
- `GET /orders/myorders`: danh sach don cua toi
- `GET /orders/myorders/:orderId`: chi tiet don cua toi
- `PATCH /orders/:orderId/cancel`: huy don

Quan tri/van hanh (`admin`, `owner`, `deliverypartner`):

- `GET /orders`
- `GET /orders/:orderId`
- `PATCH /orders/:orderId/status`

### 7.5 Payment

Tat ca endpoint payment can JWT + role (`user`, `admin`, `owner`, `deliverypartner`):

- `POST /payment/generate-qr`: tao QR thanh toan cho order
- `POST /payment/check-payment`: kiem tra da thanh toan chua, cap nhat trang thai don
- `POST /payment/checkout`: endpoint mo phong/compatibility

### 7.6 Home Settings

- `GET /home-settings`: public, lay setting trang chu
- `PATCH /home-settings`: can JWT + `AdminGuard` (`admin`/`owner`)

## 8. Mau request nhanh

### 8.1 Dang nhap

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"123456"}'
```

### 8.2 Goi API can JWT

```bash
curl http://localhost:5000/api/users/me \
  -H "Authorization: Bearer <TOKEN>"
```

### 8.3 Tao san pham (admin/owner)

```bash
curl -X POST http://localhost:5000/api/plants \
  -H "Authorization: Bearer <TOKEN_ADMIN>" \
  -F "name=Snake Plant" \
  -F "price=120000" \
  -F "category=indoor" \
  -F "availability=In Stock" \
  -F "image=@C:/tmp/plant.jpg"
```

## 9. Scripts npm

- `npm run start`: start NestJS
- `npm run start:dev`: start watch mode
- `npm run build`: transpile ra `dist/`
- `npm run start:prod`: chay production tu `dist/main`
- `npm run lint`: lint TypeScript source
- `npm run test`: chay Jest
- `npm run seed`: seed du lieu mau

## 10. Van de thuong gap

- Loi CORS:
  - Kiem tra `FRONTEND_URL` trung voi origin cua client.
- Loi 401:
  - Kiem tra header `Authorization: Bearer <token>`.
  - Kiem tra `JWT_SECRET` cua client token va server phai dong nhat.
- Loi upload:
  - Kiem tra bien `SUPABASE_*`.
- Loi email:
  - Kiem tra `SMTP_*` va provider SMTP.

## 11. Ghi chu dong bo voi frontend

- Frontend nen tro toi `http://localhost:5000` khi goi API local.
- Prefix route backend la `/api`.
- Vi du API base day du: `http://localhost:5000/api`.
