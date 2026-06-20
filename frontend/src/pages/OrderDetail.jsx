import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Container, Spinner } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import OrderDetailView from '../components/OrderDetailView';
import { orderService } from '../services/api';
import { orderStatuses } from '../utils/orderStatus';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { orderService.getById(id).then(setOrder).catch((requestError) => setError(requestError.response?.data?.message || 'Không thể tải đơn hàng.')).finally(() => setLoading(false)); }, [id]);
  if (loading) return <div className="page-loader"><Spinner animation="border" /><span>Đang tải đơn hàng...</span></div>;
  if (error) return <Container className="py-5"><Alert variant="danger">{error}</Alert><Button as={Link} to="/orders" variant="outline-dark">Quay lại đơn hàng</Button></Container>;
  const status = orderStatuses[order.status] || orderStatuses.pending;
  return <Container className="order-detail-page"><div className="order-detail-header"><div><Link to="/orders"><i className="bi bi-arrow-left" /> Đơn hàng của tôi</Link><h1>Đơn hàng #{order.id}</h1><span>Đặt lúc {new Date(order.created_at).toLocaleString('vi-VN')}</span></div><Badge bg={status.color}>{status.label}</Badge></div><OrderDetailView order={order} /></Container>;
}
