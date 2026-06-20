import React, { useEffect, useState } from 'react';
import { Accordion, Alert, Badge, Button, Col, Container, Image, ListGroup, Row, Spinner } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { orderService } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { orderStatuses } from '../utils/orderStatus';
import { paymentMethodLabels, paymentStatusLabels } from '../utils/payment';

export default function UserOrders() {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    orderService.getMine()
      .then((data) => setOrders(data))
      .catch(() => setError('Không thể tải danh sách đơn hàng.'))
      .finally(() => setLoading(false));
  }, []);

  const downloadInvoice = (order) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('SHOPLITE - HOA DON MUA HANG', 105, 20, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`Ma don: #${order.id}`, 14, 34);
    doc.text(`Ngay dat: ${new Date(order.created_at).toLocaleString('vi-VN')}`, 14, 42);
    doc.text(`Nguoi nhan: ${order.customer_name || ''}`, 14, 50);
    doc.autoTable({
      startY: 60,
      head: [['#', 'San pham', 'SL', 'Don gia', 'Thanh tien']],
      body: order.items.map((item, index) => [index + 1, `${item.title}${item.size ? ` - Size ${item.size}` : ''}${item.color ? ` - ${item.color}` : ''}`, item.qty, formatCurrency(item.price), formatCurrency(item.price * item.qty)]),
      headStyles: { fillColor: [16, 94, 74] },
    });
    doc.setFontSize(13);
    doc.text(`Tong: ${formatCurrency(order.total)}`, 196, doc.lastAutoTable.finalY + 12, { align: 'right' });
    doc.save(`shoplite-don-${order.id}.pdf`);
  };

  return (
    <Container className="orders-page">
      <div className="page-title"><span>Tài khoản</span><h1>Đơn hàng của tôi</h1></div>
      {location.state?.newOrderId && <Alert variant="success"><i className="bi bi-check-circle me-2" />Đặt hàng thành công. Mã đơn của bạn là <strong>#{location.state.newOrderId}</strong>.</Alert>}
      {loading && <div className="page-loader"><Spinner animation="border" /><span>Đang tải đơn hàng...</span></div>}
      {error && <Alert variant="danger">{error}</Alert>}
      {!loading && !error && !orders.length && <div className="empty-state"><i className="bi bi-receipt" /><h2>Bạn chưa có đơn hàng</h2><p>Các đơn đã đặt sẽ xuất hiện tại đây.</p><Button as={Link} to="/products">Bắt đầu mua sắm</Button></div>}
      <Accordion defaultActiveKey={orders[0] ? String(orders[0].id) : undefined}>
        {orders.map((order) => {
          const status = orderStatuses[order.status] || { label: order.status, color: 'secondary' };
          return <Accordion.Item eventKey={String(order.id)} key={order.id} className="order-item">
            <Accordion.Header>
              <div className="order-heading"><div><strong>Đơn #{order.id}</strong><span>{new Date(order.created_at).toLocaleString('vi-VN')}</span></div><div><Badge bg={status.color}>{status.label}</Badge><strong>{formatCurrency(Number(order.total))}</strong></div></div>
            </Accordion.Header>
            <Accordion.Body>
              <Row className="g-4">
                <Col lg={8}>
                  <ListGroup variant="flush">
                    {order.items.map((item, index) => <ListGroup.Item key={`${order.id}-${item.product_id}-${item.size || ''}-${item.color || ''}-${index}`} className="order-product">
                      {item.thumbnail ? <Image src={item.thumbnail} alt={item.title} /> : <div className="summary-placeholder"><i className="bi bi-image" /></div>}
                      <div><strong>{item.title}</strong>{(item.size || item.color) && <span>{item.size && `Size ${item.size}`}{item.size && item.color && ' · '}{item.color}</span>}<span>{formatCurrency(Number(item.price))} x {item.qty}</span></div>
                      <b>{formatCurrency(Number(item.price) * item.qty)}</b>
                    </ListGroup.Item>)}
                  </ListGroup>
                </Col>
                <Col lg={4}>
                  <div className="delivery-info"><h3>Thông tin nhận hàng</h3><p><strong>{order.customer_name}</strong></p><p>{order.customer_phone}</p><p>{order.customer_address}</p><p>{paymentMethodLabels[order.payment_method] || order.payment_method}</p><p>{paymentStatusLabels[order.payment_status] || order.payment_status}</p></div>
                </Col>
              </Row>
              <div className="order-actions mt-3"><Button as={Link} to={`/orders/${order.id}`} size="sm">Xem chi tiết <i className="bi bi-arrow-right ms-2" /></Button><Button variant="outline-dark" size="sm" onClick={() => downloadInvoice(order)}><i className="bi bi-file-earmark-pdf me-2" />Tải hóa đơn</Button></div>
            </Accordion.Body>
          </Accordion.Item>;
        })}
      </Accordion>
    </Container>
  );
}
