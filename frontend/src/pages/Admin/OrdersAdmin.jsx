import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Container, Form, Spinner, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { orderService } from '../../services/api';
import { formatCurrency } from '../../utils/formatCurrency';
import { paymentMethodLabels, paymentStatusLabels } from '../../utils/payment';

const statuses = {
  pending: ['Chờ xác nhận', 'warning'], processing: ['Đang chuẩn bị', 'info'], shipping: ['Đang giao', 'primary'], done: ['Hoàn tất', 'success'], cancelled: ['Đã hủy', 'danger'],
};

export default function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const loadOrders = () => {
    setLoading(true); setError('');
    orderService.getAll().then((data) => setOrders(data)).catch(() => setError('Không thể tải danh sách đơn hàng.')).finally(() => setLoading(false));
  };
  useEffect(loadOrders, []);
  const visibleOrders = useMemo(() => filter ? orders.filter((order) => order.status === filter) : orders, [orders, filter]);

  const updateStatus = async (order, status) => {
    try {
      await orderService.updateStatus(order.id, status);
      toast.success(`Đã cập nhật đơn #${order.id}.`);
      loadOrders();
    } catch (requestError) { toast.error(requestError.response?.data?.message || 'Không thể cập nhật đơn hàng.'); }
  };

  return <Container className="admin-page">
    <div className="admin-heading"><div><span>Vận hành</span><h1>Quản lý đơn hàng</h1></div><Button variant="outline-dark" onClick={loadOrders}><i className="bi bi-arrow-clockwise me-2" />Làm mới</Button></div>
    <div className="admin-filters"><Form.Select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">Tất cả trạng thái</option>{Object.entries(statuses).map(([value, [label]]) => <option key={value} value={value}>{label}</option>)}</Form.Select><span>{visibleOrders.length} đơn hàng</span></div>
    {loading && <div className="page-loader"><Spinner animation="border" /><span>Đang tải đơn hàng...</span></div>}
    {error && <Alert variant="danger">{error}</Alert>}
    {!loading && !error && <div className="admin-table-wrap"><Table responsive hover className="align-middle mb-0">
      <thead><tr><th>Đơn hàng</th><th>Khách hàng</th><th>Sản phẩm</th><th>Tổng tiền</th><th>Trạng thái</th></tr></thead>
      <tbody>{visibleOrders.map((order) => { const [label, color] = statuses[order.status] || [order.status, 'secondary']; return <tr key={order.id}>
        <td><strong>#{order.id}</strong><small className="table-subtext">{new Date(order.created_at).toLocaleString('vi-VN')}</small></td>
        <td><strong>{order.customer_name || order.user_name}</strong><small className="table-subtext">{order.customer_phone}</small><small className="table-subtext">{order.customer_address}</small></td>
        <td>{order.items.map((item, index) => <small className="table-subtext" key={`${order.id}-${item.product_id}-${index}`}>{item.title}{item.size ? ` · Size ${item.size}` : ''}{item.color ? ` · ${item.color}` : ''} x {item.qty}</small>)}</td>
        <td><strong>{formatCurrency(Number(order.total))}</strong><small className="table-subtext">{paymentMethodLabels[order.payment_method] || order.payment_method}</small><small className="table-subtext">{paymentStatusLabels[order.payment_status] || order.payment_status}</small></td>
        <td><Badge bg={color} className="mb-2">{label}</Badge><Form.Select size="sm" value={order.status} disabled={['done', 'cancelled'].includes(order.status)} onChange={(event) => updateStatus(order, event.target.value)}>{Object.entries(statuses).map(([value, [text]]) => <option key={value} value={value}>{text}</option>)}</Form.Select></td>
      </tr>; })}</tbody>
    </Table>{!visibleOrders.length && <div className="empty-table">Không có đơn hàng phù hợp.</div>}</div>}
  </Container>;
}
