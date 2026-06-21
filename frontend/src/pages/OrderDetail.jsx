import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Container, Spinner } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import OrderDetailView from '../components/OrderDetailView';
import { orderService } from '../services/api';
import { formatOrderDate, orderStatusIcons, orderStatuses } from '../utils/orderStatus';
import { AuthContext } from '../context/AuthContext';

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = React.useContext(AuthContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    setOrder(null);
    setError('');
    setLoading(true);
    orderService.getById(id)
      .then(setOrder)
      .catch((requestError) => setError(requestError.response?.data?.message || 'Không thể tải đơn hàng.'))
      .finally(() => setLoading(false));
  }, [id, user?.id]);
  if (loading) return <div className="page-loader"><Spinner animation="border" /><span>Đang tải đơn hàng...</span></div>;
  if (error) return <Container className="py-5"><Alert variant="danger">{error}</Alert><Button as={Link} to="/orders" variant="outline-dark">Quay lại đơn hàng</Button></Container>;
  const status = orderStatuses[order.status] || orderStatuses.pending;
  return <Container className="order-detail-page"><div className="order-detail-header"><div><Link to="/orders"><i className="bi bi-arrow-left" /> Đơn hàng của tôi</Link><h1>Đơn hàng #{order.id}</h1><span>{formatOrderDate(order.created_at)}</span></div><Badge bg={status.color} className="order-status-badge"><i className={`bi ${orderStatusIcons[order.status] || 'bi-info-circle'}`} />{status.label}</Badge></div><OrderDetailView order={order} /></Container>;
}
