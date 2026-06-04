# Thiết Kế Lại Trang Thống Kê (`/admin/analytics`)

## Triết Lý Thiết Kế

| | Tổng quan (`/admin`) | Thống kê (`/admin/analytics`) |
|---|---|---|
| **Mục đích** | Snapshot nhanh hôm nay | Phân tích toàn diện theo khoảng thời gian |
| **Bộ lọc** | ❌ Không có | ✅ **Bộ lọc thời gian toàn trang** |
| **Phạm vi** | KPI + Chart + Widget nhỏ | **7 sections chuyên sâu** |
| **Dữ liệu** | Tổng hợp cố định | **Dữ liệu thay đổi theo bộ lọc** |
| **Export** | ❌ Không có | ✅ **Xuất báo cáo Excel (.xlsx)** |

---

## ❰ BỘ LỌC THỜI GIAN ❱ — Điểm khác biệt cốt lõi

Nằm ngay dưới header, ảnh hưởng đến **tất cả 7 sections** bên dưới.

```
┌──────────────────────────────────────────────────────────┐
│  "Phân tích kinh doanh"       [📥 Xuất Excel] [🔄 Refresh]│
│                                                          │
│  📅 Khoảng thời gian:                                    │
│  [ Hôm nay ] [ 7 ngày ] [● 30 ngày ] [ Tùy chỉnh ▾ ]   │
│                                      [01/05 → 31/05]    │
└──────────────────────────────────────────────────────────┘
```

### Các preset:
| Preset | `startDate` | `endDate` |
|---|---|---|
| Hôm nay | `today 00:00` | `now` |
| 7 ngày | `today - 7d` | `now` |
| 30 ngày | `today - 30d` | `now` |
| Tùy chỉnh | User chọn start | User chọn end |

### Dữ liệu bị ảnh hưởng:
- ❶ Revenue Breakdown → chỉ tính doanh thu trong khoảng
- ❷ Revenue Chart → đã có range toggle riêng (giữ nguyên)
- ❸ Order Distribution → đơn hàng trong khoảng
- ❹ Khách hàng → KH đăng ký trong khoảng + danh sách
- ❺ Đánh giá → reviews tạo trong khoảng
- ❻ Cảnh báo tồn kho → không ảnh hưởng (tồn kho là real-time)
- ❼ Top Products → sản phẩm bán trong khoảng

---

## Layout 7 Sections

```
┌────────────────────────────────────────────────────────────────┐
│  Header + [📥 Xuất Excel] + Bộ lọc thời gian                   │
├────────────────────────────────────────────────────────────────┤
│  ❶ Revenue Breakdown (4 thẻ)                                  │
├────────────────────────────────────────────────────────────────┤
│  ❷ Revenue Chart (full-width, 350px)                          │
├────────────────────────────────────────────────────────────────┤
│  ❸ Order Donut (1/2) + Summary Cards (1/2)                    │
├────────────────────────────────────────────────────────────────┤
│  ❹ Khách hàng: KPI cards (1/3) + Recent list (2/3)            │
├────────────────────────────────────────────────────────────────┤
│  ❺ Đánh giá: Stats + Phân bố sao (1/3) + Recent reviews (2/3)│
├────────────────────────────────────────────────────────────────┤
│  ❻ Cảnh báo tồn kho (full-width)                              │
├────────────────────────────────────────────────────────────────┤
│  ❼ Top Products Table (medals + progress bars)                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Proposed Changes

### Backend

#### [MODIFY] [dashboard.module.ts](file:///d:/study_document/web/plant%20e_commerce/server/src/module/dashboard/dashboard.module.ts)
- Import `Review` + `ReviewSchema` vào MongooseModule

#### [MODIFY] [dashboard.service.ts](file:///d:/study_document/web/plant%20e_commerce/server/src/module/dashboard/dashboard.service.ts)
- Inject `Review` model
- **Thêm** `getAnalyticsStats(startDate, endDate)`: Aggregate doanh thu, đơn hàng, users **trong khoảng thời gian**
- **Thêm** `getReviewStats(startDate, endDate)`: Tổng reviews, trung bình rating, phân bố 1-5★, chờ duyệt, 5 reviews gần nhất (populate product name)
- **Thêm** `getRecentCustomers(startDate, endDate, limit)`: Users đăng ký trong khoảng, sort desc
- **Thêm** `getAnalyticsTopProducts(startDate, endDate, limit)`: Top products **theo khoảng thời gian** (khác `getTopProducts` hiện tại không có filter)
- **Thêm** `getAnalyticsOrderStatus(startDate, endDate)`: Order status distribution **theo khoảng thời gian**

#### [MODIFY] [dashboard.controller.ts](file:///d:/study_document/web/plant%20e_commerce/server/src/module/dashboard/dashboard.controller.ts)
- `@Get("analytics/stats")` → nhận `?start=...&end=...`
- `@Get("analytics/review-stats")` → nhận `?start=...&end=...`
- `@Get("analytics/recent-customers")` → nhận `?start=...&end=...&limit=5`
- `@Get("analytics/top-products")` → nhận `?start=...&end=...&limit=10`
- `@Get("analytics/order-status")` → nhận `?start=...&end=...`

---

### Frontend

#### [MODIFY] [admin.ts](file:///d:/study_document/web/plant%20e_commerce/client/src/types/admin.ts)
```typescript
// Thêm types mới:
export interface AnalyticsStats {
  revenue: number;
  orders: number;
  newCustomers: number;
}

export interface ReviewStats {
  total: number;
  avgRating: number;
  pending: number;
  distribution: { rating: number; count: number }[];
  recent: {
    _id: string;
    rating: number;
    content: string;
    userName: string;
    productName: string;
    createdAt: string;
  }[];
}

export interface RecentCustomer {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}
```

#### [MODIFY] [dashboard.service.ts](file:///d:/study_document/web/plant%20e_commerce/client/src/services/admin/dashboard.service.ts)
Thêm 5 methods mới, tất cả nhận `start` và `end` params:
- `getAnalyticsStats(start, end)`
- `getReviewStats(start, end)`
- `getRecentCustomers(start, end, limit)`
- `getAnalyticsTopProducts(start, end, limit)`
- `getAnalyticsOrderStatus(start, end)`

#### [MODIFY] [page.tsx](file:///d:/study_document/web/plant%20e_commerce/client/src/app/%28admin%29/admin/analytics/page.tsx)
Viết lại toàn bộ:
- **Time Filter UI**: Toggle buttons (Hôm nay / 7 ngày / 30 ngày) + Custom date picker
- State: `dateRange: { start: Date, end: Date }`, `activePreset: string`
- Khi `dateRange` thay đổi → gọi lại tất cả API endpoints
- **Export Excel**: Sử dụng thư viện `xlsx` (SheetJS) để tạo file `.xlsx` với nhiều sheet:
  - Sheet 1: Tổng quan doanh thu
  - Sheet 2: Top sản phẩm bán chạy
  - Sheet 3: Phân bố đơn hàng
  - Sheet 4: Thống kê đánh giá

> [!NOTE]
> Cần cài đặt: `npm install xlsx` ở client. Thư viện này chạy hoàn toàn client-side, không cần backend.
- 7 sections render inline (không tách component riêng để đơn giản)

#### [MODIFY] [admin-dashboard.css](file:///d:/study_document/web/plant%20e_commerce/client/src/app/admin-dashboard.css)
Thêm CSS analytics-specific:
- `.analytics-time-filter` — filter bar sticky-ish
- `.analytics-breakdown-grid` — 4 columns
- `.analytics-split-grid` — 1/3 + 2/3
- `.analytics-progress-bar` — rating/product bars
- `.analytics-mini-kpi` — mini stat cards
- `.analytics-alert-item` — severity colored stock items
- `.analytics-donut-grid` — 1/2 + 1/2 for donut section

---

## Verification Plan

### Automated Tests
- `npm run build` — server
- `npm run build` — client

### Manual Verification
- Chọn từng preset thời gian → verify dữ liệu thay đổi
- Chọn custom date range → verify
- So sánh visual `/admin` vs `/admin/analytics`
- Test Export Excel → mở file .xlsx kiểm tra 4 sheets
- Test responsive
