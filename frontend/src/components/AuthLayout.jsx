import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const pageLabels = {
  '/login': 'Đăng nhập',
  '/register': 'Đăng ký',
  '/forgot-password': 'Khôi phục tài khoản',
  '/reset-password': 'Tạo mật khẩu mới',
};

export default function AuthLayout() {
  const { pathname } = useLocation();
  const pageLabel = pageLabels[pathname] || 'Tài khoản';

  return <div className="auth-shell">
    <header className="auth-header">
      <div className="auth-header-inner">
        <div className="auth-header-branding">
          <Link to="/" className="auth-brand" aria-label="Về trang chủ ShopLite">
            <i className="bi bi-bag-check-fill" aria-hidden="true" />
            <span>ShopLite</span>
          </Link>
          <span className="auth-page-label">{pageLabel}</span>
        </div>
        <Link to="/contact" className="auth-help-link">
          <i className="bi bi-headset" aria-hidden="true" />
          <span>Bạn cần hỗ trợ?</span>
        </Link>
      </div>
    </header>

    <main className="auth-workspace">
      <section className="auth-brand-panel" aria-label="Giới thiệu ShopLite">
        <div className="auth-brand-content">
          <div className="auth-brand-mark" aria-hidden="true">
            <i className="bi bi-bag-check-fill" />
          </div>
          <p className="auth-brand-kicker">SHOPLITE</p>
          <h1>Mua sắm gọn nhẹ, nhận hàng an tâm.</h1>
          <p className="auth-brand-copy">Sản phẩm rõ ràng, thanh toán bảo mật và theo dõi đơn hàng thuận tiện trong một tài khoản.</p>
          <div className="auth-benefits">
            <span><i className="bi bi-shield-check" /> Bảo mật thông tin</span>
            <span><i className="bi bi-box-seam" /> Theo dõi đơn hàng</span>
            <span><i className="bi bi-chat-dots" /> Hỗ trợ nhanh chóng</span>
          </div>
        </div>
      </section>

      <section className="auth-form-panel" aria-label={pageLabel}>
        <Outlet />
      </section>
    </main>
  </div>;
}
