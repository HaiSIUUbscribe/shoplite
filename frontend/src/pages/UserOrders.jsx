import React, { useMemo, useState } from 'react';
import { Accordion, Alert, Button, Container, Spinner } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import ReviewModal from '../components/ReviewModal';
import useUserOrders from '../hooks/useUserOrders';
import OrderCard from '../components/orders/OrderCard';
import { formatCurrency } from '../utils/formatCurrency';

export default function UserOrders() {
  const location = useLocation();
  const { orders, reviewedIds, loading, error, markAsReviewed } = useUserOrders();
  const [reviewTarget, setReviewTarget] = useState(null);
  const overview = useMemo(() => ({
    total: orders.length,
    inProgress: orders.filter((order) => ['pending', 'processing', 'shipping'].includes(order.status)).length,
    spent: orders
      .filter((order) => order.status === 'done' || order.payment_status === 'paid')
      .reduce((sum, order) => sum + Number(order.total || 0), 0),
  }), [orders]);

  return (
    <Container className="orders-page">
      <div className="orders-page-header">
        <div className="page-title">
          <span>Tài khoản</span>
          <h1>Đơn hàng của tôi</h1>
          <p>Theo dõi quá trình giao hàng và xem lại những sản phẩm bạn đã mua.</p>
        </div>
        <Button as={Link} to="/products" variant="outline-primary" className="orders-shop-more">
          <i className="bi bi-bag-plus" />Mua thêm
        </Button>
      </div>

      {!loading && !error && orders.length > 0 && (
        <section className="orders-overview" aria-label="Tóm tắt đơn hàng">
          <div><span>Tổng đơn hàng</span><strong>{overview.total}</strong></div>
          <div><span>Đang xử lý</span><strong>{overview.inProgress}</strong></div>
          <div><span>Tổng chi tiêu</span><strong>{formatCurrency(overview.spent)}</strong></div>
        </section>
      )}

      {location.state?.newOrderId && (
        <Alert variant="success">
          <i className="bi bi-check-circle me-2" />
          Đặt hàng thành công. Mã đơn của bạn là <strong>#{location.state.newOrderId}</strong>.
        </Alert>
      )}

      {loading && (
        <div className="page-loader">
          <Spinner animation="border" /><span>Đang tải đơn hàng...</span>
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && !orders.length && (
        <div className="empty-state orders-empty-state">
          <i className="bi bi-receipt" />
          <h2>Bạn chưa có đơn hàng</h2>
          <p>Khám phá sản phẩm phù hợp và đơn hàng đầu tiên của bạn sẽ xuất hiện tại đây.</p>
          <Button as={Link} to="/products"><i className="bi bi-bag me-2" />Bắt đầu mua sắm</Button>
        </div>
      )}

      <Accordion className="orders-list">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            reviewedIds={reviewedIds}
            onReview={setReviewTarget}
          />
        ))}
      </Accordion>

      <ReviewModal
        show={!!reviewTarget}
        product={reviewTarget}
        onHide={() => setReviewTarget(null)}
        onSuccess={markAsReviewed}
      />
    </Container>
  );
}
