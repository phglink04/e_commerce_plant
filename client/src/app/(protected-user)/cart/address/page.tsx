"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

type CartItem = {
  plantId: string;
  quantity: number;
  price: number;
};

type Plant = {
  _id: string;
  name: string;
  imageCover: string;
};

type PaymentMethod = "cash" | "qr";

type ApiError = {
  response?: {
    data?: {
      message?: string | string[];
    };
  };
};

type PaymentSession = {
  orderId: string;
  transactionCode: string;
  amount: number;
  qrDataURL: string;
  bankInfo?: {
    accountNo: string;
    accountName: string;
    bankName: string;
  };
};

const SHIPPING_FEE = 30000;
const CHECKOUT_SELECTION_KEY = "pw_checkout_selected_ids";

const initialAddress = {
  fullName: "",
  phone: "",
  addressLine: "",
  city: "",
  postalCode: "",
  note: "",
};

const normalizeImageSrc = (src?: string): string => {
  if (!src) {
    return "/frontend/Profile.jpg";
  }

  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:")
  ) {
    return src;
  }

  return src.startsWith("/") ? src : `/${src}`;
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const apiError = error as ApiError;
  const message = apiError.response?.data?.message;

  if (Array.isArray(message)) {
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

const parseSelectedIds = (value: string | null | undefined): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
};

export default function AddressPage() {
  const PAYMENT_POLL_INTERVAL_MS = 7000;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();

  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [plantsMap, setPlantsMap] = useState<Record<string, Plant>>({});
  const [address, setAddress] = useState(initialAddress);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingCart, setLoadingCart] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [pollingPayment, setPollingPayment] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(
    null,
  );

  const checkingRef = useRef(false);
  const selectionInitializedRef = useRef(false);

  const selectedItems = items.filter((item) =>
    selectedIds.includes(item.plantId),
  );
  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shippingFee = selectedItems.length > 0 ? SHIPPING_FEE : 0;
  const totalPrice = subtotal + shippingFee;

  const getInitialSelection = (): string[] => {
    const fromQuery = parseSelectedIds(searchParams.get("selected"));
    if (fromQuery.length > 0) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          CHECKOUT_SELECTION_KEY,
          JSON.stringify(fromQuery),
        );
      }
      return fromQuery;
    }

    if (typeof window === "undefined") {
      return [];
    }

    const raw = window.localStorage.getItem(CHECKOUT_SELECTION_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((id): id is string => typeof id === "string");
      }
    } catch {
      return [];
    }

    return [];
  };

  const loadCart = async () => {
    if (!token) return;

    setLoadingCart(true);

    try {
      const [cartRes, plantsRes] = await Promise.all([
        api.get("/api/users/cart", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get("/api/plants?page=1&limit=200"),
      ]);

      const cartItems = (cartRes.data?.data?.cart ?? []) as CartItem[];
      const plants = (plantsRes.data?.data?.plants ?? []) as Plant[];
      const nextMap: Record<string, Plant> = {};

      for (const plant of plants) {
        nextMap[plant._id] = plant;
      }

      const cartItemIds = cartItems.map((item) => item.plantId);

      setPlantsMap(nextMap);
      setItems(cartItems);
      setSelectedIds((previous) => {
        if (!selectionInitializedRef.current) {
          selectionInitializedRef.current = true;
          const initial = getInitialSelection();
          const validInitial = initial.filter((id) => cartItemIds.includes(id));
          if (validInitial.length > 0) {
            return validInitial;
          }
          return cartItemIds;
        }

        const validPrevious = previous.filter((id) => cartItemIds.includes(id));
        if (validPrevious.length > 0) {
          return validPrevious;
        }

        return cartItemIds;
      });
    } catch {
      setError("Unable to load checkout cart.");
    } finally {
      setLoadingCart(false);
    }
  };

  useEffect(() => {
    void loadCart();
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
    } catch {
      setError("Unable to update cart item.");
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
    } catch {
      setError("Unable to remove item.");
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

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.length === items.length ? [] : items.map((item) => item.plantId),
    );
  };

  const createOrder = async (): Promise<string> => {
    if (!token) {
      throw new Error("Please login first.");
    }

    if (
      !address.fullName.trim() ||
      !address.phone.trim() ||
      !address.addressLine.trim() ||
      !address.city.trim() ||
      !address.postalCode.trim()
    ) {
      throw new Error("Please fill all required address fields first.");
    }

    if (selectedItems.length === 0) {
      throw new Error("Please select at least one cart item.");
    }

    const orderItems = selectedItems.map((item) => ({
      plantId: item.plantId,
      name: plantsMap[item.plantId]?.name || item.plantId,
      quantity: item.quantity,
      price: item.price,
    }));

    const shippingAddress = `${address.fullName}, ${address.phone}, ${address.addressLine}, ${address.city}, ${address.postalCode}${address.note ? ` (${address.note})` : ""}`;

    const orderRes = await api.post(
      "/api/orders",
      {
        items: orderItems,
        shippingAddress,
        shippingFee,
        paymentMethod,
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    const orderId = orderRes.data?.data?.order?.id as string | undefined;
    if (!orderId) {
      throw new Error("Order id not found");
    }

    setPendingOrderId(orderId);
    return orderId;
  };

  const placeOrder = async () => {
    setError("");
    setSuccess("");
    setProcessingOrder(true);

    try {
      if (paymentMethod === "cash") {
        await createOrder();

        await api.delete("/api/users/clear-cart", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setPendingOrderId(null);
        setPaymentSession(null);
        router.push("/order-success");
        return;
      }

      let orderId = pendingOrderId;
      if (!orderId) {
        orderId = await createOrder();
      }

      const paymentRes = await api.post(
        "/api/payment/generate-qr",
        { orderId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const qrDataURL = paymentRes.data?.qrDataURL as string | undefined;
      const transactionCode = paymentRes.data?.transactionCode as
        | string
        | undefined;
      const amount = paymentRes.data?.amount as number | undefined;
      const bankInfo = paymentRes.data?.bankInfo as
        | { accountNo: string; accountName: string; bankName: string }
        | undefined;

      if (!qrDataURL || !transactionCode || !amount) {
        throw new Error("Invalid payment response");
      }

      setPaymentSession({
        orderId,
        transactionCode,
        amount,
        qrDataURL,
        bankInfo,
      });
      setSuccess("QR generated. Please transfer and confirm payment.");
    } catch (error) {
      setError(getApiErrorMessage(error, "Unable to place order."));
    } finally {
      setProcessingOrder(false);
    }
  };

  const confirmPayment = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!token || !paymentSession) {
        return;
      }

      if (checkingRef.current) {
        return;
      }

      checkingRef.current = true;

      if (!silent) {
        setError("");
        setSuccess("");
        setCheckingPayment(true);
      }

      try {
        const checkRes = await api.post(
          "/api/payment/check-payment",
          {
            orderId: paymentSession.orderId,
            transactionCode: paymentSession.transactionCode,
            amount: paymentSession.amount,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (!checkRes.data?.paid) {
          if (!silent) {
            setError("Payment not found yet. Please transfer and try again.");
          }
          return;
        }

        setSuccess("Payment confirmed successfully. Redirecting...");

        try {
          await api.delete("/api/users/clear-cart", {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch {
          setError(
            "Payment confirmed but cart cleanup failed. You can clear cart manually later.",
          );
        }

        setPendingOrderId(null);
        setPaymentSession(null);
        router.push("/order-success");
      } catch (error) {
        if (!silent) {
          setError(getApiErrorMessage(error, "Unable to verify payment."));
        }
      } finally {
        checkingRef.current = false;
        if (!silent) {
          setCheckingPayment(false);
        }
      }
    },
    [paymentSession, router, token],
  );

  useEffect(() => {
    if (!token || !paymentSession) {
      setPollingPayment(false);
      return;
    }

    setPollingPayment(true);

    const intervalId = window.setInterval(() => {
      void confirmPayment({ silent: true });
    }, PAYMENT_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      setPollingPayment(false);
    };
  }, [confirmPayment, paymentSession, token]);

  return (
    <main className="container pw-account-page">
      <h1>Checkout</h1>
      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="success">{success}</p> : null}

      <section className="pw-checkout-layout">
        <section className="pw-cart-panel">
          <div className="pw-panel-head">
            <h2>Cart Items</h2>
            <label className="pw-select-all">
              <input
                type="checkbox"
                checked={
                  items.length > 0 && selectedIds.length === items.length
                }
                onChange={toggleSelectAll}
              />
              Select all
            </label>
          </div>

          {loadingCart ? <p>Loading checkout items...</p> : null}

          <section className="pw-cart-list">
            {items.map((item) => {
              const itemName = plantsMap[item.plantId]?.name || "Plant";
              const itemImage = normalizeImageSrc(
                plantsMap[item.plantId]?.imageCover,
              );
              const itemSubtotal = item.quantity * item.price;

              return (
                <article
                  key={item.plantId}
                  className="pw-cart-item pw-cart-item-modern"
                >
                  <label className="pw-cart-check">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.plantId)}
                      onChange={() => toggleSelect(item.plantId)}
                      aria-label={`Select ${itemName}`}
                    />
                  </label>

                  <Image
                    src={itemImage}
                    alt={itemName}
                    width={110}
                    height={110}
                    className="pw-cart-thumb"
                  />

                  <div className="pw-cart-item-content">
                    <h3>{itemName}</h3>
                    <p className="pw-cart-price">{item.price} VND</p>
                    <p className="pw-cart-subtotal">
                      Subtotal: {itemSubtotal} VND
                    </p>

                    <div className="pw-cart-item-actions">
                      <div className="pw-qty-controls">
                        <button
                          type="button"
                          onClick={() => void updateQty(item.plantId, -1)}
                          disabled={updatingId === item.plantId}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => void updateQty(item.plantId, 1)}
                          disabled={updatingId === item.plantId}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="pw-remove-btn"
                        onClick={() => void removeItem(item.plantId)}
                        disabled={updatingId === item.plantId}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </section>

        <aside className="pw-summary-panel pw-checkout-panel">
          <h2>Shipping Address</h2>

          <form
            className="pw-address-form"
            onSubmit={(event) => event.preventDefault()}
          >
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              value={address.fullName}
              onChange={(e) =>
                setAddress((prev) => ({ ...prev, fullName: e.target.value }))
              }
              required
            />

            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              value={address.phone}
              onChange={(e) =>
                setAddress((prev) => ({ ...prev, phone: e.target.value }))
              }
              required
            />

            <label htmlFor="addressLine">Address</label>
            <input
              id="addressLine"
              value={address.addressLine}
              onChange={(e) =>
                setAddress((prev) => ({ ...prev, addressLine: e.target.value }))
              }
              required
            />

            <label htmlFor="city">City</label>
            <input
              id="city"
              value={address.city}
              onChange={(e) =>
                setAddress((prev) => ({ ...prev, city: e.target.value }))
              }
              required
            />

            <label htmlFor="postalCode">Postal Code</label>
            <input
              id="postalCode"
              value={address.postalCode}
              onChange={(e) =>
                setAddress((prev) => ({ ...prev, postalCode: e.target.value }))
              }
              required
            />

            <label htmlFor="note">Note</label>
            <textarea
              id="note"
              rows={3}
              value={address.note}
              onChange={(e) =>
                setAddress((prev) => ({ ...prev, note: e.target.value }))
              }
            />
          </form>

          <h2>Payment Method</h2>
          <div className="pw-payment-methods">
            <label>
              <input
                type="radio"
                name="payment-method"
                checked={paymentMethod === "cash"}
                onChange={() => setPaymentMethod("cash")}
              />
              CASH
            </label>
            <label>
              <input
                type="radio"
                name="payment-method"
                checked={paymentMethod === "qr"}
                onChange={() => setPaymentMethod("qr")}
              />
              QR TRANSFER
            </label>
          </div>

          <h2>Order Summary</h2>
          <div className="pw-summary-line">
            <span>Subtotal</span>
            <strong>{subtotal} VND</strong>
          </div>
          <div className="pw-summary-line">
            <span>Shipping Fee</span>
            <strong>{shippingFee} VND</strong>
          </div>
          <div className="pw-summary-line total">
            <span>Total</span>
            <strong>{totalPrice} VND</strong>
          </div>

          <div className="pw-cart-actions">
            <button
              type="button"
              className="pw-btn"
              onClick={() => void placeOrder()}
              disabled={
                processingOrder ||
                selectedItems.length === 0 ||
                items.length === 0
              }
            >
              {processingOrder
                ? "Processing..."
                : paymentMethod === "cash"
                  ? "Place Order"
                  : "Generate QR"}
            </button>

            {paymentMethod === "qr" && paymentSession ? (
              <button
                type="button"
                className="pw-btn ghost"
                onClick={() => void confirmPayment({ silent: false })}
                disabled={checkingPayment}
              >
                {checkingPayment ? "Checking Payment..." : "I Have Paid"}
              </button>
            ) : null}
          </div>

          {paymentMethod === "qr" && paymentSession ? (
            <section className="pw-payment-box">
              <h3>Scan QR to Pay</h3>
              {paymentSession.bankInfo && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '12px 16px', marginBottom: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Thông tin chuyển khoản</p>
                  <p style={{ fontSize: 13, margin: '2px 0' }}><span style={{ color: '#64748b' }}>Ngân hàng:</span> <strong>{paymentSession.bankInfo.bankName}</strong></p>
                  <p style={{ fontSize: 13, margin: '2px 0' }}><span style={{ color: '#64748b' }}>Số TK:</span> <strong style={{ color: '#1d4ed8', letterSpacing: '0.1em' }}>{paymentSession.bankInfo.accountNo}</strong></p>
                  <p style={{ fontSize: 13, margin: '2px 0' }}><span style={{ color: '#64748b' }}>Chủ TK:</span> <strong>{paymentSession.bankInfo.accountName}</strong></p>
                </div>
              )}
              <p>
                Số tiền: <strong>{paymentSession.amount.toLocaleString('vi-VN')} VND</strong>
              </p>
              <p>
                Nội dung CK:{" "}
                <strong>{paymentSession.transactionCode}</strong>
              </p>
              <Image
                src={paymentSession.qrDataURL}
                alt="Payment QR"
                width={260}
                height={260}
                className="pw-qr-image"
              />
              <ol className="pw-payment-instructions">
                <li>Mở app ngân hàng và quét mã QR.</li>
                <li>Chuyển đúng số tiền ở trên.</li>
                <li>Giữ nguyên nội dung chuyển khoản.</li>
                <li>Bấm "I Have Paid" để xác nhận.</li>
              </ol>
              {pollingPayment ? (
                <p className="pw-payment-polling-note">
                  Auto-checking payment every 7 seconds...
                </p>
              ) : null}
            </section>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
