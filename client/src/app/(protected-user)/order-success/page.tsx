import Link from "next/link";

export default function OrderSuccessPage() {
  return (
    <main className="container pw-account-page">
      <section className="pw-order-success">
        <h1>Đơn hàng đăng ký thành công</h1>
        <p>Đơn hàng đã được xác nhận. Chúng tôi sẽ thông báo bạn khi hàng vận chuyển.</p>

        <div className="pw-cart-actions">
          <Link href="/profile/orders" className="pw-btn">
            Xem đơn hàng của tôi
          </Link>
          <Link href="/shop" className="pw-btn ghost">
            Tiếp tục mua sắm
          </Link>
        </div>
      </section>
    </main>
  );
}
