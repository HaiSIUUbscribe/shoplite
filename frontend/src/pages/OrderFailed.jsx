import React from 'react';
import { Button, Container } from 'react-bootstrap';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

export default function OrderFailed() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const message = location.state?.message || searchParams.get('message') || 'Có lỗi xảy ra trong quá trình xử lý. Giỏ hàng của bạn vẫn được giữ nguyên.';
  const orderId = searchParams.get('orderId');
  const retryPath = window.sessionStorage.getItem('shoplite_pending_checkout_mode') === 'buy-now' ? '/checkout?mode=buy-now' : '/checkout';
  return <Container className="order-result-page"><div className="result-symbol failed"><i className="bi bi-x-lg" /></div><span>Thanh toán chưa hoàn tất</span><h1>Giao dịch không thành công</h1><p>{message}</p>{orderId && <p>Đơn <strong>#{orderId}</strong> đã được huỷ và tồn kho đã được hoàn lại.</p>}<div><Button as={Link} to={retryPath}>Thử lại</Button><Button as={Link} to="/cart" variant="outline-dark">Xem giỏ hàng</Button></div></Container>;
}
