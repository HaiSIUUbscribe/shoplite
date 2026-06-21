import React, { useContext, useEffect, useRef, useState } from 'react';
import { Alert, Button, Container, Spinner } from 'react-bootstrap';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import OrderDetailView from '../components/OrderDetailView';
import { orderService } from '../services/api';
import { estimatedDelivery } from '../utils/orderStatus';

export default function OrderSuccess() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { clearCart, clearBuyNow } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const cartCleared = useRef(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    setOrder(null);
    setError('');
    orderService.getById(id)
      .then(setOrder)
      .catch((requestError) => setError(
        requestError.response?.status === 404
          ? 'Bạn không có quyền xem đơn hàng này hoặc đơn hàng không tồn tại.'
          : 'Chưa thể tải thông tin đơn hàng.'
      ));
  }, [id, user?.id]);
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
  if (error) return <Container className="order-success-page"><Alert variant="warning"><i className="bi bi-shield-exclamation me-2" />{error}</Alert><Button as={Link} to="/orders" variant="outline-dark">Đơn hàng của tôi</Button></Container>;
  return <Container className="order-success-page"><div className="success-hero"><span><i className="bi bi-check-lg" /></span><div><p>Đặt hàng thành công</p><h1>Cảm ơn bạn đã mua sắm tại ShopLite</h1><p>Mã đơn <strong>#{order.id}</strong> · Dự kiến giao {estimatedDelivery(order.created_at)}</p></div><Button as={Link} to="/products">Tiếp tục mua sắm</Button></div><OrderDetailView order={order} /></Container>;
}
