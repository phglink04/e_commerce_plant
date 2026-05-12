# 🌱 PlantWorld Frontend Architecture Guide

## 📁 Project Structure

```
client/src/
├── app/                           # Next.js App Router pages
├── components/
│   ├── ui/                        # Reusable UI components
│   │   ├── ProductCard.tsx        # Individual product display
│   │   ├── ProductList.tsx        # Grid of products
│   │   ├── SearchBar.tsx          # Debounced search input
│   │   ├── FilterSidebar.tsx      # Product filters
│   │   ├── Pagination.tsx         # Page navigation
│   │   ├── CartItem.tsx           # Cart item row
│   │   └── index.ts               # Barrel export
│   ├── common/                    # Navbar, Footer, etc.
│   ├── admin/                     # Admin components
│   └── auth/                      # Auth components
├── constants/
│   ├── api.ts                     # API endpoints
│   ├── ui.ts                      # Colors, sizes, messages
│   └── index.ts
├── services/
│   ├── base-api.service.ts        # Base HTTP client
│   ├── product.service.ts         # Product API
│   ├── cart.service.ts            # Cart API
│   ├── order.service.ts           # Order API
│   └── index.ts
├── hooks/
│   ├── useFetch.ts                # Generic data fetching
│   ├── useProducts.ts             # Products with pagination
│   ├── useCart.ts                 # Cart management
│   ├── useUtils.ts                # Debounce, localStorage, etc.
│   └── index.ts
├── features/
│   ├── ShopPageFeature.tsx        # Shop page example
│   ├── CartPageFeature.tsx        # Cart page example
│   └── index.ts
├── types/
│   ├── api.ts                     # API types
│   ├── product.ts                 # Product types
│   ├── cart.ts                    # Cart types
│   ├── order.ts                   # Order types
│   ├── user.ts                    # User types
│   └── index.ts
└── lib/
    ├── api.ts                     # Axios instance
    └── auth.ts                    # Auth helpers
```

---

## 🔄 Data Flow Architecture

### **Simplified Flow:**

```
User clicks "Add to Cart"
        ↓
ProductCard.onAddToCart(productId)
        ↓
ShopPageFeature.handleAddToCart()
        ↓
useCart.addToCart(productId, 1)
        ↓
cartService.addToCart({ plantId, quantity })
        ↓
BaseApiService.post('/api/cart/add', payload)
        ↓
HTTP POST to backend
        ↓
Backend processes → returns { message, data: { cart } }
        ↓
useCart updates state → cart.items updated
        ↓
Component re-renders ✅
```

### **Complete Architecture Layers:**

```
┌─────────────────────────────────────────┐
│  Layer 1: React Components (UI)         │
│  ProductCard, ProductList, SearchBar    │
└──────────────────┬──────────────────────┘
                   │ calls (via props)
┌──────────────────▼──────────────────────┐
│  Layer 2: Feature Pages                 │
│  ShopPageFeature, CartPageFeature       │
└──────────────────┬──────────────────────┘
                   │ uses
┌──────────────────▼──────────────────────┐
│  Layer 3: Custom Hooks                  │
│  useProducts, useCart, useFetch         │
└──────────────────┬──────────────────────┘
                   │ calls
┌──────────────────▼──────────────────────┐
│  Layer 4: API Services                  │
│  ProductService, CartService            │
└──────────────────┬──────────────────────┘
                   │ HTTP requests
┌──────────────────▼──────────────────────┐
│  Layer 5: Backend API                   │
│  http://localhost:5000/api/*            │
└─────────────────────────────────────────┘
```

---

## 🏗️ Why This Architecture?

### **✅ Benefits:**

| Feature                    | Benefit                                                        |
| -------------------------- | -------------------------------------------------------------- |
| **Separation of Concerns** | UI components don't know about API details                     |
| **Reusability**            | ProductCard used in shop, home, featured sections              |
| **Testability**            | Each layer can be tested independently                         |
| **Performance**            | React.memo for components, caching in services                 |
| **Maintainability**        | Changes isolated to one layer                                  |
| **Scalability**            | Easy to add new features without touching existing code        |
| **Type Safety**            | Full TypeScript coverage with proper types                     |
| **No Props Drilling**      | Hooks manage state, no passing through intermediate components |

### **❌ Avoided Anti-Patterns:**

```javascript
// ❌ BAD: Props drilling
<ShopPage>
  <ProductList products={products} onAddToCart={handleAddToCart} isLoading={loading}>
    <ProductCard product={product} onAddToCart={onAddToCart} isLoading={isLoading} />
  </ProductList>
</ShopPage>

// ✅ GOOD: Hooks + Callbacks
<ShopPage>
  <ProductList products={products} onAddToCart={handleAddToCart} />
  // ProductCard doesn't need to pass props down
</ShopPage>
```

---

## 📝 Example: Building a Search Page

### **Step 1: Create Component**

```typescript
// pages/search/page.tsx
"use client";

import { useState } from "react";
import { useProducts, useDebounce } from "@/hooks";
import { ProductList, SearchBar } from "@/components/ui";

export default function SearchPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const { products, loading, error, pagination, goToPage } = useProducts({
    search: debouncedSearch,
    initialPage: 1,
    limit: 20
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Search Results</h1>

      <SearchBar
        onSearch={setSearch}
        placeholder="Search plants..."
      />

      <ProductList
        products={products}
        loading={loading}
        error={error}
        onAddToCart={handleAddToCart}
      />

      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={goToPage}
        />
      )}
    </div>
  );
}
```

### **Step 2: Explain the Flow:**

1. **User types in SearchBar**
   - Input → `setSearch(value)`
   - `useDebounce` waits 500ms to avoid spam

2. **Debounced value changes**
   - `useProducts` hook dependency updated
   - Hook calls `productService.getProducts()`
   - Sets `loading = true`

3. **Service fetches from backend**
   - Makes HTTP request: `GET /api/plants?search=rose&page=1&limit=20`
   - Backend returns: `{ message, data: { plants: [...] }, totalResults, totalPages }`

4. **Service returns normalized response**
   - Converts to: `{ items: [...], totalResults, totalPages, page, limit }`

5. **Hook updates state**
   - Sets `loading = false`
   - Sets `products = response.items`

6. **Component re-renders**
   - `ProductList` shows products
   - Shows pagination if multiple pages

7. **User clicks pagination**
   - `goToPage(2)` called
   - Hook fetches new page
   - Loop repeats

---

## 🔌 How to Add to Cart (Complete Example)

### **Component:**

```typescript
// components/ui/ProductCard.tsx
export const ProductCard = memo(function ProductCard({
  product,
  onAddToCart
}) {
  return (
    <div>
      <h3>{product.name}</h3>
      <button
        onClick={() => onAddToCart(product._id)}  // ← Simple callback
      >
        Add to Cart
      </button>
    </div>
  );
});
```

### **Feature Page:**

```typescript
// features/ShopPageFeature.tsx
export default function ShopPage() {
  const { addToCart: addToCartFn } = useCart();  // ← Get hook
  const [addingProductId, setAddingProductId] = useState(null);

  const handleAddToCart = async (productId) => {
    setAddingProductId(productId);
    try {
      const success = await addToCartFn(productId, 1);  // ← Call hook
      if (success) {
        console.log("Added to cart!");  // Show toast here
      }
    } finally {
      setAddingProductId(null);
    }
  };

  return (
    <ProductList
      products={products}
      onAddToCart={handleAddToCart}  // ← Pass handler
      addingProductId={addingProductId}
    />
  );
}
```

### **Hook:**

```typescript
// hooks/useCart.ts
export function useCart() {
  const [state, setState] = useState({ cart: null, loading: false });

  const addToCart = async (plantId, quantity) => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const cart = await cartService.addToCart({ plantId, quantity });
      setState((prev) => ({ ...prev, cart }));
      return true; // Success
    } catch (error) {
      setState((prev) => ({ ...prev, error }));
      return false; // Failure
    }
  };

  return { ...state, addToCart }; // ← Expose to components
}
```

### **Service:**

```typescript
// services/cart.service.ts
class CartService extends BaseApiService {
  async addToCart(payload) {
    const response = await this.post(
      "/api/cart/add",
      payload, // { plantId: "123", quantity: 1 }
    );
    return response.data; // Returns cart object
  }
}
```

### **API:**

```typescript
// services/base-api.service.ts
protected async post<T>(url: string, data?: any) {
  const response = await this.client.request({
    method: 'POST',
    url,
    data
  });
  return response.data;  // Server response
}
```

### **Result:**

- ✅ No props drilling
- ✅ No API calls in component
- ✅ Clean separation of concerns
- ✅ Easy to test each layer
- ✅ Easy to modify behavior

---

## 🎯 Key Hooks Guide

### **useProducts** - Fetch products list

```typescript
const {
  products, // Product[] - array of products
  loading, // boolean
  error, // ApiError | null
  pagination: {
    // pagination info
    page,
    totalPages,
    totalResults,
  },
  goToPage, // (page: number) => void
  nextPage, // () => void
  prevPage, // () => void
  refetch, // () => Promise<void>
} = useProducts({
  initialPage: 1,
  limit: 12,
  search: "rose",
  category: "Flower",
});
```

### **useCart** - Manage shopping cart

```typescript
const {
  cart, // Cart | null
  loading, // boolean
  error, // ApiError | null
  totalItems, // number
  totalPrice, // number
  getCart, // () => Promise<void>
  addToCart, // (plantId, quantity) => Promise<boolean>
  removeFromCart, // (plantId) => Promise<boolean>
  updateQuantity, // (plantId, quantity) => Promise<boolean>
  clearCart, // () => Promise<boolean>
} = useCart();
```

### **useFetch** - Generic data fetching

```typescript
const { data, loading, error, refetch } = useFetch(
  () => someService.fetchData(),
  [dependency],
  { skip: false, retries: 3, cacheTime: 60000 },
);
```

### **useDebounce** - Debounce values

```typescript
const [searchInput, setSearchInput] = useState("");
const debouncedSearch = useDebounce(searchInput, 500);
// Use debouncedSearch in effect/hook
```

---

## 🛠️ Component Quick Reference

### **ProductCard**

```typescript
<ProductCard
  product={product}
  onAddToCart={(id) => console.log(id)}
  isLoading={false}
/>
```

**Features:**

- ✅ Responsive image
- ✅ Stock status
- ✅ Discount badge
- ✅ Featured/Sale badges
- ✅ Price display
- ✅ Add to cart button

### **ProductList**

```typescript
<ProductList
  products={products}
  loading={loading}
  error={error}
  onAddToCart={(id) => {}}
  addingProductId={addingId}
  onRetry={() => refetch()}
/>
```

**Features:**

- ✅ Grid layout (responsive)
- ✅ Loading skeleton
- ✅ Error state
- ✅ Empty state
- ✅ Compose ProductCard

### **SearchBar**

```typescript
<SearchBar
  onSearch={(query) => setSearch(query)}
  placeholder="Search..."
  debounceDelay={500}
/>
```

### **FilterSidebar**

```typescript
<FilterSidebar
  categories={["Flower", "Herb"]}
  tags={["Indoor", "Outdoor"]}
  onFilterChange={(filters) => {}}
/>
```

### **Pagination**

```typescript
<Pagination
  currentPage={1}
  totalPages={10}
  onPageChange={(page) => {}}
  isLoading={false}
/>
```

### **CartItem**

```typescript
<CartItem
  item={cartItem}
  onUpdateQuantity={(plantId, qty) => {}}
  onRemove={(plantId) => {}}
  isLoading={false}
/>
```

---

## 📋 Step-by-Step Implementation Guide

### **Step 1: Import Components**

```typescript
import { ProductCard, ProductList } from "@/components/ui";
```

### **Step 2: Use Hooks**

```typescript
import { useProducts, useCart } from "@/hooks";

const { products, loading } = useProducts();
const { addToCart } = useCart();
```

### **Step 3: Create Handlers**

```typescript
const handleAddToCart = async (productId) => {
  const success = await addToCart(productId, 1);
  if (success) {
    // Show success toast
  }
};
```

### **Step 4: Render**

```typescript
return (
  <ProductList
    products={products}
    loading={loading}
    onAddToCart={handleAddToCart}
  />
);
```

---

## ✨ Best Practices

### **✅ DO:**

```typescript
// ✅ Use hooks for data fetching
const { products, loading } = useProducts();

// ✅ Keep components pure
function ProductCard({ product, onAddToCart }) {
  return <div>...</div>;
}

// ✅ Use barrel exports
import { ProductCard } from "@/components/ui";

// ✅ Use constants
import { API_ENDPOINTS, COLORS } from "@/constants";

// ✅ Memoize components
export const ProductCard = memo(function ProductCard(props) {
  return <div>...</div>;
});

// ✅ Use types
import type { Product } from "@/types";
```

### **❌ DON'T:**

```typescript
// ❌ Make API calls in components
function BadComponent() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/data').then(r => setData(r));  // NO!
  }, []);
}

// ❌ Drill props multiple levels
<ShopPage>
  <ProductList onAddToCart={handleAddToCart}>
    <ProductCard onAddToCart={onAddToCart} />
  </ProductList>
</ShopPage>

// ❌ Use magic strings
const url = "/api/plants";  // Use constants instead

// ❌ Mix UI and business logic
function BadComponent() {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  // All logic here - NO!
}
```

---

## 🚀 Next Steps

1. **Update existing pages** to use new architecture
2. **Create admin features** for product management
3. **Add state management** (Zustand) if needed
4. **Implement error boundaries** for error handling
5. **Add toast notifications** for user feedback
6. **Write unit tests** for hooks and services
7. **Setup E2E tests** with Playwright
8. **Performance optimization** - code splitting, lazy loading

---

## 📚 File Structure Generated

- **32 new files** created
- **6 type files** with full TypeScript coverage
- **5 service files** with normalized API layer
- **5 hook files** with reusable data logic
- **8 UI component files** that are production-ready
- **3 feature page examples** showing best practices

---

## 🔗 Quick Links

- Types: `@/types/*`
- Services: `@/services/*`
- Hooks: `@/hooks/*`
- Components: `@/components/ui/*`
- Constants: `@/constants/*`

---

**🌱 Happy Coding with PlantWorld!**
