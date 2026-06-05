# 🌿 PlantWorld — Báo Cáo Audit Toàn Diện Pre-Production

> **Thực hiện bởi:** Principal Software Architect + Senior Next.js/NestJS Engineer + Senior UI/UX Designer  
> **Ngày audit:** 2026-06-05  
> **Stack:** Next.js 15.2.3 (App Router) · NestJS · MongoDB · Zustand · Tailwind CSS · Framer Motion

---

## Executive Summary

Dự án PlantWorld là một nền tảng thương mại điện tử cây cảnh full-stack với kiến trúc tương đối vững chắc. Tuy nhiên, trước khi lên production, có **14 vấn đề Critical/High** cần xử lý ngay, đặc biệt liên quan đến bảo mật debug endpoint, data giả hardcode trên dashboard, và sự không đồng nhất nghiêm trọng trong UI/UX giữa các module admin.

### Tóm tắt mức độ rủi ro
| Mức độ | Số lượng vấn đề |
|--------|----------------|
| 🔴 Critical | 4 |
| 🟠 High | 10 |
| 🟡 Medium | 18 |
| 🟢 Low | 12 |

---

## Phase 1: Architecture Overview

### Kiến trúc tổng quan
```
client/ (Next.js 15 App Router)
├── app/
│   ├── (admin)/admin/        ← 12 admin pages
│   ├── (public)/             ← Landing, Shop, Plant detail, Blog
│   ├── (protected-user)/     ← Profile, My-orders, Cart, Checkout
│   └── (delivery)/           ← Delivery partner pages
├── components/               ← Feature components
├── services/                 ← Axios-based API clients
├── store/                    ← Zustand stores (3 stores)
├── hooks/                    ← Custom hooks
├── lib/                      ← Utilities (admin-api, auth, socket)
└── types/                    ← TypeScript type definitions

server/ (NestJS)
├── auth/                     ← JWT, Google OAuth, 2FA
├── module/                   ← 14 feature modules
├── common/                   ← Filters, Interceptors
├── helpers/                  ← Mail, Turnstile services
├── debug/                    ← ⚠️ Debug controller (XEM PHẦN BẢO MẬT)
└── infrastructure/           ← Config validation
```

### Module Overview — Backend
| Module | Controller | Service | Schema | Ghi chú |
|--------|-----------|---------|--------|---------|
| auth | ✅ | ✅ | ❌ (dùng users) | 2FA, Google OAuth |
| users | ✅ | ✅ | ✅ | |
| plants | ✅ | ✅ | ✅ | |
| orders | ✅ | ✅ | ✅ | |
| dashboard | ✅ | ✅ | ❌ | Aggregate nhiều schema |
| chatbot | ✅ | ✅ | ✅ | Socket.IO |
| discounts | ✅ | ✅ | ✅ | |
| reviews | ✅ | ✅ | ✅ | |
| blogs | ✅ | ✅ | ✅ | |
| delivery | ✅ | ✅ | ❌ | Dùng orders schema |
| **debug** | ✅ | ❌ | ❌ | 🔴 CRITICAL: Phải xóa |

### Current Problems (Tổng quan)
1. **DebugModule** tồn tại trên production — unauthenticated upload endpoint
2. **Hardcoded mock data** `topCustomers` trên dashboard admin
3. **Dual authentication patterns** — `lib/admin-api.ts` dùng token riêng, `base-api.service.ts` dùng localStorage
4. **Inconsistent CSS architecture** — mix giữa Tailwind classes + vanilla CSS modules + inline styles
5. **`window.confirm()` / `alert()`** được dùng trong 3 admin pages (UX anti-pattern)

---

## Phase 2: UI/UX Consistency Audit

### ❌ Vấn đề nghiêm trọng nhất: Thiếu thống nhất giữa các admin pages

| Trang | CSS Approach | Button Style | Table Style |
|-------|-------------|-------------|-------------|
| `/admin` (Dashboard) | Vanilla CSS classes (`admin-dashboard__*`) + inline styles | `style={{...}}` inline | Không có table |
| `/admin/plants` | **Tailwind** utilities | `className="rounded-xl bg-gradient-to-r..."` | Tailwind table |
| `/admin/orders` | **Tailwind** utilities | `className="rounded-xl bg-emerald-600..."` | DataTable component |
| `/admin/discounts` | **Tailwind** utilities | `className="rounded-xl bg-gradient-to-r..."` | Tailwind table |
| `/admin/reviews` | **Vanilla CSS** (`admin-reviews__*`) | `admin-reviews__btn--approve` | `admin-reviews__table` |
| `/admin/chat` | **Vanilla CSS** (`achat-*`, `admin-chat__*`) | Emoji buttons | Custom layout |
| `/admin/analytics` | **Mix**: CSS classes + massive inline styles | `admin-dashboard__refresh-btn` | No table |
| `/admin/users` | **Tailwind** utilities | Tailwind | DataTable component |

**Kết luận:** Có ít nhất **3 design languages** khác nhau đang tồn tại song song trong cùng một admin panel — đây là technical debt nghiêm trọng.

### Màu sắc không đồng nhất
```
Cùng là "nút chính" nhưng có nhiều màu khác nhau:
- plants: bg-gradient-to-r from-emerald-600 to-emerald-500
- orders: bg-emerald-600 (flat)
- analytics export btn: linear-gradient(135deg, #1e293b, #334155) [KHÁC HOÀN TOÀN]
- reviews: .admin-reviews__btn--approve (CSS class, không rõ màu từ code)
- chat: style={{ background: "#2563eb" }} (màu xanh dương — không liên quan)
```

### Spacing không đồng nhất
- Dashboard: `padding: "1.25rem"` (inline)
- Plants/Orders/Discounts: `space-y-5`, `px-4 py-3` (Tailwind)
- Reviews: `admin-reviews__*` CSS classes
- Analytics: mix của tất cả 3 loại trên

### Modal/Dialog không đồng nhất
- `ConfirmDialog` component: dùng ở Plants, Discounts, Users ✅
- Reviews page: dùng `window.confirm()` native browser ❌
- Chat page: dùng `window.confirm()` và `alert()` native ❌
- Delivery Partner page: dùng `window.confirm()` ❌

### Badge/Status không đồng nhất
- Orders/Users: `StatusBadge` component ✅
- Plants: inline conditional className ❌ (copy-paste 4 lần)
- Discounts: inline conditional className ❌
- Reviews: custom CSS `.admin-reviews__stars` ❌

### Input không đồng nhất
- Plants/Discounts: `SearchBar` component ✅
- Orders/Users: raw `<input>` với Tailwind inline ❌
- Reviews: raw `<input>` với CSS class ❌

---

## Phase 3: Design System Proposal

### Hiện trạng
Dự án **chưa có Design System**. Đang dùng:
- Tailwind CSS utilities (hardcoded colors)
- Vanilla CSS với BEM naming
- Inline `style={{}}` objects
- CSS variables không được định nghĩa đồng nhất

### Đề xuất cấu trúc `src/theme/`

```typescript
// src/theme/colors.ts
export const colors = {
  primary: {
    DEFAULT: '#059669',  // emerald-600
    hover: '#047857',    // emerald-700
    light: '#d1fae5',    // emerald-100
    muted: 'rgba(5,150,105,0.08)',
  },
  danger: {
    DEFAULT: '#dc2626',  // red-600
    hover: '#b91c1c',    // red-700
    light: '#fee2e2',    // red-100
  },
  warning: {
    DEFAULT: '#d97706',  // amber-600
    light: '#fef3c7',
  },
  info: {
    DEFAULT: '#2563eb',  // blue-600
    light: '#dbeafe',
  },
  neutral: {
    text: '#0f172a',
    muted: '#64748b',
    border: '#e2e8f0',
    bg: '#f8fafc',
  },
} as const;

// src/theme/radius.ts  
export const radius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  full: '9999px',
} as const;
```

### Hardcoded colors cần chuyển sang token

| File | Line | Hiện tại | Token thay thế |
|------|------|---------|----------------|
| `ProductCard.tsx` | 123 | `bg-green-600` | `bg-primary` |
| `Pagination.tsx` | 86 | `bg-green-600` | `bg-primary` |
| `FeaturedProducts.tsx` | 315 | `bg-green-600` | `bg-primary` |
| `SaleProducts.tsx` | 350 | `bg-green-600` | `bg-primary` |
| `plant/[plantId]/page.tsx` | 255, 361, 372 | `bg-green-*`, `text-green-*` | `bg-primary-*` |
| `BarChart.tsx` | 9 | `"bg-green-500"` | string token |
| `admin/page.tsx` | 48-76 | Massive inline color objects | `colors.primary.*` |
| `analytics/page.tsx` | 65-119 | `statusConfig` inline hex | Centralized config |

---

## Phase 4: Components To Extract

### 4.1 `admin/page.tsx` — 618 dòng

Tách thành:
```
components/admin/dashboard/
├── KPICard.tsx              ← Đã có inline, cần tách file
├── ChatAlertBanner.tsx      ← Lines 308-373
├── TopProductsWidget.tsx    ← Lines 441-502
├── TopCustomersWidget.tsx   ← Lines 504-541
└── LowStockWidget.tsx       ← Lines 543-614
```

### 4.2 `admin/orders/page.tsx` — 685 dòng

Tách thành:
```
components/admin/orders/
├── OrderTable.tsx           ← Lines 282-438 (DataTable columns def)
├── OrderDetailDrawer.tsx    ← Lines 465-673
├── OrderStatusSelect.tsx    ← Lines 356-416 (lặp lại 2 lần trong cùng file)
└── OrderPagination.tsx      ← Lines 441-463 (custom pagination, không dùng Pagination component)
```

### 4.3 `admin/users/page.tsx` — 555 dòng

Tách thành:
```
components/admin/users/
├── UserTable.tsx
├── UserDetailDrawer.tsx
└── UserOrderHistory.tsx
```

### 4.4 `admin/analytics/page.tsx` — 1151 dòng ⚠️ Lớn nhất

Tách thành:
```
components/admin/analytics/
├── TimeFilterBar.tsx        ← Lines 388-450
├── RevenueBreakdown.tsx     ← Lines 459-588
├── OrderDistribution.tsx    ← Lines 595-705
├── CustomerSection.tsx      ← Lines 707-773
├── ReviewSection.tsx        ← Lines 776-900
├── LowStockSection.tsx      ← Lines ~900-1000
└── TopProductsSection.tsx   ← Lines ~1000-1100
```

### 4.5 `admin/chat/page.tsx` — 698 dòng

Tách thành:
```
components/admin/chat/
├── ChatSidebar.tsx          ← Lines 353-478
├── Chatroom.tsx             ← Lines 487-683
├── ChatMessageList.tsx      ← Lines 563-630
└── ChatInputArea.tsx        ← Lines 633-666
```

---

## Phase 5: Shared Components To Create

### Lặp lại được phát hiện

| Pattern | Files | Số lần lặp | Component đề xuất |
|---------|-------|-----------|-------------------|
| Toast notification | plants, discounts, orders, users, ... | 6+ pages | `AdminToast` ✅ (đã có — nhưng **chat và delivery không dùng**) |
| Status badge inline | plants/page.tsx, analytics | 3+ | `StatusBadge` ✅ (đã có — nhưng **chưa được dùng ở plants và analytics**) |
| Confirm dialog | orders, discounts, users | 3 pages | `ConfirmDialog` ✅ (reviews, chat, delivery vẫn dùng native) |
| Search input | plants, discounts | 2 | `SearchBar` ✅ (orders, users, reviews không dùng) |
| Pagination | plants, discounts | 2 | `Pagination` ✅ (orders, reviews tự viết inline) |
| Loading skeleton | orders, dashboard, analytics | 3 | ❌ Chưa có shared `LoadingSkeleton` |
| Empty state | plants, discounts, orders... | 5+ | ❌ Chưa có shared `EmptyState` |
| Page header (h2 + count) | tất cả admin pages | 7+ | ❌ Chưa có shared `PageHeader` |
| Format currency VND | dashboard, analytics | 2+ | ❌ Trùng lặp logic `formatCurrency` + `formatCompactCurrency` |

### Shared Components cần tạo mới

```
components/admin/shared/
├── PageHeader.tsx       → {title, count, actions}
├── EmptyState.tsx       → {icon, title, description, action}
├── LoadingSkeleton.tsx  → {rows, type: 'table'|'card'|'list'}
└── FormatUtils.ts       → formatCurrency, formatCompactCurrency, formatDate
```

---

## Phase 6: Dead Code Report

### 🔴 Safe To Delete

| File | Lý do | Rủi ro nếu giữ |
|------|-------|----------------|
| `server/src/debug/debug-upload.controller.ts` | Debug controller không có auth guard — **unauthenticated public endpoint** `/api/debug/upload` lộ Supabase bucket | **CRITICAL security risk** |
| `server/src/debug/debug.module.ts` | Import của debug controller trên | Tương tự |

### ⚠️ Cần xác nhận trước khi xóa

| File | Lý do nghi ngờ | Cần kiểm tra |
|------|---------------|-------------|
| `client/src/lib/auth.ts` | Chỉ export `getToken()` từ localStorage, đã bị thay thế bởi `useAuthStore` | Tìm tất cả import |
| `client/src/components/admin/Cards/` | Có `stats-card.tsx` trong `/ui/` rồi | So sánh 2 cards |
| `admin/page.tsx` KPICard inline component | Cần tách ra file riêng | Không phải xóa nhưng cần refactor |

### Hardcoded mock data (phải sửa không phải xóa)

```typescript
// admin/page.tsx — Lines 251-257
// ⚠️ DATA GIẢ TRÊN DASHBOARD PRODUCTION
const topCustomers = [
  { name: "Nguyễn Văn Hải", email: "hai.nguyen@gmail.com", spend: 6450000, orders: 12 },
  { name: "Lê Thị Mai", email: "mai.le@gmail.com", spend: 5120000, orders: 9 },
  // ...
];
```

**Hậu quả:** Widget "Top 5 khách hàng chi tiêu cao" trên dashboard LUÔN hiển thị data giả bất kể database thực tế.

---

## Phase 7: Performance Issues

### Frontend

| Vấn đề | File | Mức độ | Giải pháp |
|--------|------|--------|-----------|
| Dashboard gọi 3 API riêng biệt trong 3 `useEffect` riêng | `admin/page.tsx` L175-220 | High | Gom vào `Promise.all` như analytics page |
| Analytics page 1151 dòng render toàn bộ trong 1 component | `analytics/page.tsx` | High | Tách component, dùng `React.lazy` |
| `fetchAnalyticsData` không có `useCallback` | `analytics/page.tsx` L147 | Medium | Wrap với `useCallback` |
| Duplicate `formatCurrency` function | `admin/page.tsx` & `analytics/page.tsx` | Medium | Tách ra shared util |
| Orders page tự implement debounce bằng `setTimeout` | `orders/page.tsx` L100-106 | Low | Dùng `useDebouncedValue` hook có sẵn |
| Chat page polling `fetchChats()` trên mỗi socket event | `chat/page.tsx` | Medium | Chỉ cập nhật state local, không fetch lại toàn bộ |

### Backend

| Vấn đề | File | Mức độ | Giải pháp |
|--------|------|--------|-----------|
| Rate limiting global 100 req/60s có thể quá thấp cho production | `app.module.ts` | Medium | Tăng limit, tách theo endpoint |
| MongoDB connection pool min=5, max=50 — cần đánh giá | `app.module.ts` | Low | Monitor dựa theo traffic thực tế |

---

## Phase 8: Security Issues

### 🔴 CRITICAL

**1. Unauthenticated Debug Upload Endpoint**
- **File:** `server/src/debug/debug-upload.controller.ts`
- **Route:** `POST /api/debug/upload`
- **Vấn đề:** Không có `@UseGuards(JwtAuthGuard)`, bất kỳ ai cũng có thể upload file lên Supabase bucket, xem Supabase URL/config qua console.log
- **Hậu quả:** Attacker có thể upload malicious files, hoặc fill storage
- **Fix:** Xóa hoàn toàn `DebugModule` khỏi `AppModule` trước khi deploy

**2. `shouldExposeDebugTokens()` logic**
- **File:** `server/src/auth/auth.service.ts`
- **Vấn đề:** Cần verify function này không còn expose token trong bất kỳ response nào ở production
- **Trạng thái:** Đã được fix trong session trước — verify lại

### 🟠 High

**3. Auth Token trong localStorage**
- **Files:** `base-api.service.ts`, `auth.ts`, `auth-store.ts`
- **Vấn đề:** JWT được lưu trong localStorage — dễ bị XSS attack đọc token
- **Fix:** Chuyển sang HttpOnly cookie (token đã được set trong cookie `auth_token` theo middleware, nhưng `localStorage` vẫn được dùng song song — cần thống nhất)

**4. `window.confirm()` trong admin pages**
- **Files:** `reviews/page.tsx`, `chat/page.tsx`, `deliveryPartner/page.tsx`
- **Vấn đề:** Không phải security issue nhưng là UX issue — native dialog có thể bị browser block
- **Fix:** Thay bằng `ConfirmDialog` component

**5. CORS hardcode localhost:3001**
- **File:** `server/src/main.ts` L20
- **Vấn đề:** `"http://localhost:3001"` hardcoded trong CORS origins
- **Fix:** Chuyển thành env variable

```typescript
// Hiện tại:
origin: [
  configService.get<string>("FRONTEND_URL", "http://localhost:3000"),
  "http://localhost:3001",  // ← HARDCODED
],

// Cần sửa:
origin: [
  configService.get<string>("FRONTEND_URL", "http://localhost:3000"),
  configService.get<string>("FRONTEND_URL_ALT", ""),
].filter(Boolean),
```

**6. Middleware JWT decoding client-side**
- **File:** `middleware.ts` — `decodeRoleFromJwt(token)` decode JWT mà không verify signature
- **Vấn đề:** Attacker có thể forge cookie `auth_role` để bypass role check
- **Trạng thái:** Có `isAdminRole()` check, nhưng server-side guard là quan trọng nhất — cần đảm bảo tất cả admin API đều có `@Roles()` guard

---

## Phase 9: Production Readiness

### Environment Variables — Cần kiểm tra

| Biến | Server | Client | Ghi chú |
|------|--------|--------|---------|
| `MONGODB_URI` | ✅ Required | ❌ | |
| `JWT_SECRET` | ✅ Required | ❌ | |
| `FRONTEND_URL` | ✅ | ❌ | |
| `NEXT_PUBLIC_API_URL` | ❌ | ✅ | Hardcode fallback `localhost:5000` |
| `SUPABASE_URL` | ✅ | ❌ | |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ❌ | Secret key — không được expose |
| `SMTP_*` | ✅ | ❌ | Required cho email verification |
| `NODE_ENV` | ✅ | ✅ | Ảnh hưởng Turnstile, debug tokens |

### Error Handling

| Vấn đề | File | Mức độ |
|--------|------|--------|
| Analytics page `catch (err: any)` rồi `console.error(err)` — lỗi bị nuốt | `analytics/page.tsx` L174 | Medium |
| Chat page nhiều `console.error()` không có user feedback | `chat/page.tsx` L39, 52, 177... | Medium |
| Reviews page: `catch {} finally` — errors bị nuốt hoàn toàn | `reviews/page.tsx` L54, 65 | High |

### SEO

| Trang | title | description | Ghi chú |
|-------|-------|-------------|---------|
| Public pages | Cần verify | Cần verify | |
| Admin pages | ❌ Không cần SEO | ❌ | Đúng |
| `/shop` | Cần verify | Cần verify | |

### Loading/Empty States

| Pattern | Consistent? |
|---------|------------|
| Loading skeleton | ❌ Mỗi page tự implement khác nhau |
| Empty state text | ❌ Mix tiếng Anh (`"No products found"`) và tiếng Việt |
| Loading text | ❌ `"Loading products..."` còn tiếng Anh ở plants/page.tsx L279 |

---

## Phase 10: Deployment Checklist

### 🔴 PHẢI làm trước deploy

- [ ] **Xóa DebugModule** khỏi AppModule và xóa file `debug/`
- [ ] **Xóa hardcoded mock data** `topCustomers` — kết nối API thực
- [ ] **Fix CORS** — xóa hardcode `localhost:3001`
- [ ] **Verify** `shouldExposeDebugTokens()` không còn hoạt động ở production
- [ ] **Đổi tất cả** `window.confirm()` sang `ConfirmDialog` component
- [ ] **Fix tiếng Anh còn sót** trong UI: "Loading products...", "No products found", "Edit Product", "Create New Product" (trong `AdminModal` title ở plants/page.tsx)

### 🟠 Nên làm trước deploy

- [ ] Thống nhất CSS approach cho admin pages (ưu tiên Tailwind)
- [ ] Tách `analytics/page.tsx` (1151 dòng) thành components
- [ ] Tạo shared `PageHeader`, `EmptyState`, `LoadingSkeleton`
- [ ] Gom 3 `useEffect` trong dashboard thành 1 `Promise.all`
- [ ] Chuyển format currency ra shared util

### 🟡 Có thể làm sau deploy

- [ ] Implement Design System tokens
- [ ] Tách toàn bộ admin pages thành components nhỏ hơn
- [ ] Thêm Error Boundaries
- [ ] Đánh giá chuyển JWT từ localStorage sang HttpOnly cookie thuần túy
- [ ] Monitoring setup (Sentry hoặc tương đương)
- [ ] Thêm loading states đồng nhất

---

## Refactor Roadmap

### Sprint 1 — Blockers (Trước deploy, ~1-2 ngày)
1. Xóa DebugModule
2. Fix CORS hardcode  
3. Xóa mock topCustomers, tạo API endpoint thực
4. Fix tất cả `window.confirm()` → ConfirmDialog
5. Fix text tiếng Anh còn sót

### Sprint 2 — Consistency (Sau deploy, ~3-5 ngày)
1. Tạo shared components: `PageHeader`, `EmptyState`, `LoadingSkeleton`
2. Tách `analytics/page.tsx` thành sub-components
3. Chuẩn hóa all admin pages dùng cùng 1 CSS approach
4. Gom duplicate `formatCurrency` ra 1 util file

### Sprint 3 — Design System (Dài hạn, ~1-2 tuần)
1. Định nghĩa design tokens
2. Migrate tất cả hardcoded colors sang tokens
3. Viết component library documentation

---

## Safe Files To Delete

| File | Lý do | Mức độ an toàn |
|------|-------|----------------|
| `server/src/debug/debug-upload.controller.ts` | Debug code, security risk | ✅ Safe - xóa ngay |
| `server/src/debug/debug.module.ts` | Paired với controller | ✅ Safe - xóa ngay |

> ⚠️ **Lưu ý:** Sau khi xóa debug files, phải remove import trong `app.module.ts`:  
> `import { DebugModule } from "./debug/debug.module";` và xóa `DebugModule` khỏi `imports[]`
