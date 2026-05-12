import Link from "next/link";

export default function OrderSuccessPage() {
  return (
    <main className="container pw-account-page">
      <section className="pw-order-success">
        <h1>Order Placed Successfully</h1>
        <p>Your order is confirmed. We will notify you when it is shipped.</p>

        <div className="pw-cart-actions">
          <Link href="/my-orders" className="pw-btn">
            View My Orders
          </Link>
          <Link href="/shop" className="pw-btn ghost">
            Continue Shopping
          </Link>
        </div>
      </section>
    </main>
  );
}
