import React, { useContext, useEffect, useRef, useState } from 'react';
import { Alert, Button, Container, Spinner } from 'react-bootstrap';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import OrderDetailView from '../components/OrderDetailView';
import { orderService } from '../services/api';
import { estimatedDelivery } from '../utils/orderStatus';

export default function OrderSuccess() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { clearCart, clearBuyNow } = useContext(CartContext);
  const cartCleared = useRef(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { orderService.getById(id).then(setOrder).catch(() => setError('Đơn đã được tạo nhưng chưa thể tải thông tin chi tiết.')); }, [id]);
  useEffect(() => {
    if (searchParams.get('payment') === 'vnpay' && !cartCleared.current) {
      cartCleared.current = true;
      const checkoutMode = window.sessionStorage.getItem('shoplite_pending_checkout_mode');
      if (checkoutMode === 'buy-now') clearBuyNow();
      else clearCart();
      window.sessionStorage.removeItem('shoplite_pending_checkout_mode');
    }
  }, [clearBuyNow, clearCart, searchParams]);
  if (!order && !error) return <div className="page-loader"><Spinner animation="border" /><span>Đang xác nhận đơn hàng...</span></div>;
  return <Container className="order-success-page"><div className="success-hero"><span><i className="bi bi-check-lg" /></span><div><p>Đặt hàng thành công</p><h1>Cảm ơn bạn đã mua sắm tại ShopLite</h1><p>Mã đơn <strong>#{id}</strong>{order && <> · Dự kiến giao {estimatedDelivery(order.created_at)}</>}</p></div><Button as={Link} to="/products">Tiếp tục mua sắm</Button></div>{error ? <Alert variant="warning">{error} <Link to={`/orders/${id}`}>Xem lại đơn hàng</Link></Alert> : <OrderDetailView order={order} />}</Container>;
}
