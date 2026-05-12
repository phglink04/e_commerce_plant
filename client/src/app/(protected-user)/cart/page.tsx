"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import AddressModal from "@/components/cart-checkout/AddressModal";
import AddressSelector from "@/components/cart-checkout/AddressSelector";
import CartItem from "@/components/cart-checkout/CartItem";
import OrderSummary from "@/components/cart-checkout/OrderSummary";
import { discountService } from "@/services/admin/discount.service";
import type {
  Address,
  CartItem as CartItemType,
  PaymentMethod,
  Plant,
} from "@/components/cart-checkout/types";

type ApiError = {
  response?: {
    data?: {
      message?: string | string[];
    };
  };
};

const CHECKOUT_SELECTION_KEY = "pw_checkout_selected_ids";
const SHIPPING_FEE = 30000;

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const apiError = error as ApiError;
  const message = apiError.response?.data?.message;

  if (Array.isArray(message) && message.length > 0) {
    return message.join(", ");
  }

  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
};

export default function CartPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [items, setItems] = useState<CartItemType[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [plantsMap, setPlantsMap] = useState<Record<string, Plant>>({});
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editAddressId, setEditAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Discount state
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    discountAmount: number;
    finalTotal: number;
    message: string;
  } | null>(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState("");

  const selectionInitializedRef = useRef(false);

  const parseStoredSelection = (): string[] | null => {
    if (typeof window === "undefined") {
      return null;
    }

    const raw = window.localStorage.getItem(CHECKOUT_SELECTION_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((id): id is string => typeof id === "string");
      }
    } catch {
      return null;
    }

    return null;
  };

  const selectedAddress = useMemo(
    () => addresses.find((item) => item.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  const loadAddresses = async () => {
    if (!token) {
      return;
    }

    try {
      const response = await api.get("/api/addresses/my", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const apiAddresses = (response.data?.data?.addresses ?? []) as Address[];
      setAddresses(apiAddresses);
      setSelectedAddressId((current) => {
        if (!apiAddresses.some((item) => item.id === current)) {
          return apiAddresses[0]?.id ?? null;
        }
        return current;
      });
    } catch {
      setAddresses([]);
      setSelectedAddressId(null);
    }
  };

  const syncSelectionFromStorage = () => {
    const stored = parseStoredSelection();
    if (stored === null) {
      return;
    }

    const validItemIds = new Set(items.map((item) => item.plantId));
    const validStored = stored.filter((id) => validItemIds.has(id));
    setSelectedIds(validStored);
  };

  const loadCart = async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const [cartRes, plantsRes] = await Promise.all([
        api.get("/api/users/cart", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get("/api/plants?limit=200&page=1"),
      ]);

      const cartItems = (cartRes.data?.data?.cart ?? []) as CartItemType[];
      const plants = (plantsRes.data?.data?.plants ?? []) as (Plant & { salePrice?: number; discountPercentage?: number })[];
      const nextMap: Record<string, Plant> = {};

      for (const plant of plants) {
        nextMap[plant._id] = plant;
      }

      // Sync cart item prices with current product salePrice
      const syncedItems: CartItemType[] = [];
      const priceUpdates: Promise<unknown>[] = [];

      for (const item of cartItems) {
        const plant = nextMap[item.plantId] as (Plant & { salePrice?: number; discountPercentage?: number }) | undefined;
        if (plant) {
          const currentPrice = plant.salePrice ?? plant.price;
          if (item.price !== currentPrice) {
            // Price changed (discount was updated) — sync locally and on server
            syncedItems.push({ ...item, price: currentPrice });
            priceUpdates.push(
              api.patch(
                "/api/users/updatecart",
                { plantId: item.plantId, quantity: item.quantity, price: currentPrice },
                { headers: { Authorization: `Bearer ${token}` } },
              ).catch(() => { /* non-critical */ }),
            );
          } else {
            syncedItems.push(item);
          }
        } else {
          syncedItems.push(item);
        }
      }

      // Fire price updates in the background (don't block UI)
      if (priceUpdates.length > 0) {
        void Promise.all(priceUpdates);
      }

      const cartItemIds = syncedItems.map((item) => item.plantId);

      setPlantsMap(nextMap);
      setItems(syncedItems);
      setSelectedIds((previous) => {
        if (!selectionInitializedRef.current) {
          selectionInitializedRef.current = true;
          const stored = parseStoredSelection();
          if (stored !== null) {
            const validStored = stored.filter((id) => cartItemIds.includes(id));
            return validStored;
          }
          return cartItemIds;
        }

        const validPrevious = previous.filter((id) => cartItemIds.includes(id));
        if (validPrevious.length > 0) {
          return validPrevious;
        }
        return cartItemIds;
      });
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Unable to load cart."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCart();
    void loadAddresses();
  }, [token]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      CHECKOUT_SELECTION_KEY,
      JSON.stringify(selectedIds),
    );
  }, [selectedIds]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const onFocus = () => {
      syncSelectionFromStorage();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncSelectionFromStorage();
      }
    };

    const onPageShow = () => {
      syncSelectionFromStorage();
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === CHECKOUT_SELECTION_KEY) {
        syncSelectionFromStorage();
      }
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [items]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(item.plantId)),
    [items, selectedIds],
  );

  const subtotal = useMemo(
    () =>
      selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [selectedItems],
  );

  const shippingFee = selectedItems.length > 0 ? SHIPPING_FEE : 0;
  const total = subtotal + shippingFee;

  // Discount handlers
  const handleApplyDiscount = async (code: string) => {
    setDiscountError("");
    setApplyingDiscount(true);
    try {
      const result = await discountService.applyDiscount({
        code,
        cartTotal: total,
      });
      setAppliedDiscount({
        code: result.code,
        discountAmount: result.discountAmount,
        finalTotal: result.finalTotal,
        message: result.message,
      });
      return {
        code: result.code,
        discountAmount: result.discountAmount,
        finalTotal: result.finalTotal,
        message: result.message,
      };
    } catch (err: any) {
      const msg = err?.message || "Invalid coupon code";
      setDiscountError(msg);
      return null;
    } finally {
      setApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountError("");
  };

  const toggleSelectAll = () => {
    setSelectedIds((previous) =>
      previous.length === items.length ? [] : items.map((item) => item.plantId),
    );
  };

  const updateQty = async (plantId: string, delta: number) => {
    if (!token) return;

    const current = items.find((item) => item.plantId === plantId);
    if (!current) return;

    const nextQty = current.quantity + delta;

    try {
      setUpdatingId(plantId);

      if (nextQty <= 0) {
        await api.delete(`/api/users/deleteitem/${plantId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await api.patch(
          "/api/users/updatecart",
          { plantId, quantity: nextQty },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      }

      await loadCart();
    } catch (updateError) {
      setError(getApiErrorMessage(updateError, "Unable to update cart."));
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (plantId: string) => {
    if (!token) return;

    try {
      setUpdatingId(plantId);
      await api.delete(`/api/users/deleteitem/${plantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadCart();
    } catch (removeError) {
      setError(getApiErrorMessage(removeError, "Unable to remove item."));
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleSelect = (plantId: string) => {
    setSelectedIds((prev) =>
      prev.includes(plantId)
        ? prev.filter((id) => id !== plantId)
        : [...prev, plantId],
    );
  };

  const openCreateAddressModal = () => {
    setEditAddressId(null);
    setAddressModalOpen(true);
  };

  const openEditAddressModal = (id: string) => {
    setEditAddressId(id);
    setAddressModalOpen(true);
  };

  const handleSaveAddress = async (payload: Omit<Address, "id">) => {
    if (!token) {
      setError("Please login first.");
      return;
    }

    setError("");

    if (editAddressId) {
      try {
        const response = await api.patch(
          `/api/addresses/${editAddressId}`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const updatedAddress = response.data?.data?.address as
          | Address
          | undefined;

        if (updatedAddress) {
          setAddresses((current) =>
            current.map((item) =>
              item.id === updatedAddress.id ? updatedAddress : item,
            ),
          );
          setSelectedAddressId(updatedAddress.id);
        }
        setAddressModalOpen(false);
        setEditAddressId(null);
      } catch (saveError) {
        setError(getApiErrorMessage(saveError, "Unable to update address."));
      }
      return;
    }

    try {
      const response = await api.post("/api/addresses", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const createdAddress = response.data?.data?.address as
        | Address
        | undefined;

      if (createdAddress) {
        setAddresses((current) => [...current, createdAddress]);
        setSelectedAddressId(createdAddress.id);
      }
      setAddressModalOpen(false);
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Unable to create address."));
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!token) {
      setError("Please login first.");
      return;
    }

    try {
      await api.delete(`/api/addresses/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAddresses((current) =>
        current.filter((item) => item.id !== addressId),
      );
      setSelectedAddressId((current) => {
        if (current === addressId) {
          const remaining = addresses.filter((item) => item.id !== addressId);
          return remaining[0]?.id ?? null;
        }
        return current;
      });
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Unable to delete address."));
    }
  };

  const clearSelectedItemsFromCart = async (plantIds: string[]) => {
    if (!token || plantIds.length === 0) {
      return;
    }

    await Promise.all(
      plantIds.map((plantId) =>
        api.delete(`/api/users/deleteitem/${plantId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ),
    );
  };

  const createOrder = async (): Promise<string> => {
    if (!token) {
      throw new Error("Please login first.");
    }

    if (!selectedAddress) {
      throw new Error("Please select a shipping address.");
    }

    if (!selectedAddressId) {
      throw new Error("Please select a shipping address.");
    }

    if (selectedItems.length === 0) {
      throw new Error("Please select at least one item.");
    }

    const orderItems = selectedItems.map((item) => ({
      plantId: item.plantId,
      name: plantsMap[item.plantId]?.name ?? item.plantId,
      quantity: item.quantity,
      price: item.price,
    }));

    const shippingAddress = `${selectedAddress.fullName}, ${selectedAddress.phone}, ${selectedAddress.addressLine}, ${selectedAddress.ward}, ${selectedAddress.district}, ${selectedAddress.city}`;

    const orderPayload: Record<string, unknown> = {
      items: orderItems,
      shippingAddress,
      addressId: selectedAddressId,
      shippingFee,
      paymentMethod,
    };

    // Attach discount info if a coupon is applied
    if (appliedDiscount) {
      orderPayload.discountCode = appliedDiscount.code;
      orderPayload.discountAmount = appliedDiscount.discountAmount;
    }

    const orderRes = await api.post(
      "/api/orders",
      orderPayload,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const orderId = orderRes.data?.data?.order?.id as string | undefined;
    if (!orderId) {
      throw new Error("Order id not found.");
    }

    return orderId;
  };

  const requestQrPayment = async (orderId: string): Promise<{
    orderId: string;
    transactionCode: string;
    amount: number;
    qrDataURL: string;
    bankInfo?: {
      accountNo: string;
      accountName: string;
      bankName: string;
    };
  }> => {
    const postResponse = await api.post(
      "/api/payment/generate-qr",
      { orderId },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const qrDataURL = postResponse.data?.qrDataURL as string | undefined;
    const transactionCode = postResponse.data?.transactionCode as
      | string
      | undefined;
    const amount = Number(postResponse.data?.amount ?? 0);
    const bankInfo = postResponse.data?.bankInfo as
      | { accountNo: string; accountName: string; bankName: string }
      | undefined;

    if (!qrDataURL || !transactionCode || Number.isNaN(amount) || amount <= 0) {
      throw new Error("Invalid QR payment response.");
    }

    return {
      orderId,
      transactionCode,
      amount,
      qrDataURL,
      bankInfo,
    };
  };



  const checkout = async () => {
    if (!token) {
      setError("Please login first.");
      return;
    }

    setError("");
    setSuccess("");
    setProcessingOrder(true);

    const selectedPlantIds = selectedItems.map((item) => item.plantId);

    // Calculate the actual payable amount (after discount)
    const actualPayable = appliedDiscount
      ? Math.max(0, total - appliedDiscount.discountAmount)
      : total;

    try {
      const orderId = await createOrder();

      // If paying by cash OR the discount covers the full amount, skip QR
      if (paymentMethod === "cash" || actualPayable <= 0) {
        await clearSelectedItemsFromCart(selectedPlantIds);
        await loadCart();
        router.push(`/checkout/success?orderId=${orderId}`);
        return;
      }

      // QR payment: generate QR, save to sessionStorage, redirect to pending page
      const nextSession = await requestQrPayment(orderId);

      // Save QR data to sessionStorage for the pending page
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          `checkout_pending_${orderId}`,
          JSON.stringify({
            qrDataURL: nextSession.qrDataURL,
            transactionCode: nextSession.transactionCode,
            amount: nextSession.amount,
            bankInfo: nextSession.bankInfo,
          }),
        );
      }

      router.push(`/checkout/pending?orderId=${orderId}`);
    } catch (checkoutError) {
      setError(getApiErrorMessage(checkoutError, "Unable to checkout."));
    } finally {
      setProcessingOrder(false);
    }
  };

  const isCartEmpty = items.length === 0;
  const isCheckoutDisabled =
    loading ||
    processingOrder ||
    isCartEmpty ||
    selectedItems.length === 0 ||
    !selectedAddressId;

  const editingAddress = editAddressId
    ? (addresses.find((item) => item.id === editAddressId) ?? null)
    : null;



  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white px-4 py-6 md:px-6 lg:px-10">
      <section className="mx-auto max-w-7xl">
        <header className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Cart & Checkout
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review plants, choose shipping address, and complete payment in one
            flow.
          </p>
        </header>

        {error ? (
          <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-4">
            <AddressSelector
              addresses={addresses}
              selectedAddressId={selectedAddressId}
              onSelect={setSelectedAddressId}
              onAdd={openCreateAddressModal}
              onEdit={openEditAddressModal}
              onDelete={(id) => {
                void handleDeleteAddress(id);
              }}
            />

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-slate-900">
                  Cart Items
                </h2>

                <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={
                      items.length > 0 && selectedIds.length === items.length
                    }
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Select all
                </label>
              </div>

              {loading ? (
                <p className="text-sm text-slate-500">Loading cart...</p>
              ) : null}

              {isCartEmpty ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
                  Your cart is empty.
                </p>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <CartItem
                      key={item.plantId}
                      item={item}
                      plant={plantsMap[item.plantId]}
                      selected={selectedIds.includes(item.plantId)}
                      disabled={updatingId === item.plantId || processingOrder}
                      onToggle={toggleSelect}
                      onIncrease={(id) => {
                        void updateQty(id, 1);
                      }}
                      onDecrease={(id) => {
                        void updateQty(id, -1);
                      }}
                      onRemove={(id) => {
                        void removeItem(id);
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          </section>

          <OrderSummary
            selectedCount={selectedItems.length}
            subtotal={subtotal}
            shippingFee={shippingFee}
            total={total}
            paymentMethod={paymentMethod}
            checkoutDisabled={isCheckoutDisabled}
            processing={processingOrder}
            onPaymentMethodChange={setPaymentMethod}
            onCheckout={() => {
              void checkout();
            }}
            appliedDiscount={appliedDiscount}
            onApplyDiscount={handleApplyDiscount}
            onRemoveDiscount={handleRemoveDiscount}
            applyingDiscount={applyingDiscount}
            discountError={discountError}
          />
        </section>
      </section>

      <AddressModal
        open={addressModalOpen}
        title={editAddressId ? "Edit Address" : "Add New Address"}
        initialAddress={editingAddress}
        onClose={() => {
          setAddressModalOpen(false);
          setEditAddressId(null);
        }}
        onSave={handleSaveAddress}
      />


    </main>
  );
}
