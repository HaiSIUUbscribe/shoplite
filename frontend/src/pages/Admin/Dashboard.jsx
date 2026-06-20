import React, { useEffect, useState } from 'react';
import { Alert, Card, Col, Container, Row, Spinner } from 'react-bootstrap';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { adminService } from '../../services/api';
import { formatCurrency } from '../../utils/formatCurrency';

const cards = [
  ['Sản phẩm', 'totalProducts', 'bi-box-seam', 'blue'],
  ['Tồn kho', 'totalStock', 'bi-boxes', 'teal'],
  ['Đơn chờ xử lý', 'pendingOrders', 'bi-hourglass-split', 'amber'],
  ['Khách hàng', 'totalUsers', 'bi-people', 'violet'],
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminService.getDashboard()
      .then((data) => setStats(data))
      .catch(() => setError('Không thể tải dữ liệu tổng quan.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><Spinner animation="border" /><span>Đang tải tổng quan...</span></div>;

  return <Container className="admin-page">
    <div className="admin-heading"><div><span>Tổng quan cửa hàng</span><h1>Dashboard</h1></div></div>
    {error && <Alert variant="danger">{error}</Alert>}
    {stats && <>
      <Row className="g-3 mb-4">
        {cards.map(([label, key, icon, tone]) => <Col xl={3} sm={6} key={key}><div className={`stat-card ${tone}`}><i className={`bi ${icon}`} /><div><span>{label}</span><strong>{Number(stats[key] || 0).toLocaleString('vi-VN')}</strong></div></div></Col>)}
      </Row>
      <div className="revenue-band"><div><span>Doanh thu ghi nhận</span><strong>{formatCurrency(Number(stats.totalRevenue || 0))}</strong><small>Không bao gồm đơn đã hủy</small></div><div><span>Tổng đơn hàng</span><strong>{Number(stats.totalOrders || 0).toLocaleString('vi-VN')}</strong><small>Tất cả trạng thái</small></div></div>
      <Card className="chart-panel border-0">
        <Card.Body><div className="chart-heading"><h2>Doanh thu 12 tháng gần nhất</h2><span>VND</span></div>
          {stats.monthlyStats?.length ? <ResponsiveContainer width="100%" height={340}><BarChart data={stats.monthlyStats} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}><CartesianGrid vertical={false} stroke="#e8ece9" /><XAxis dataKey="month" tickLine={false} axisLine={false} /><YAxis tickFormatter={(value) => `${Math.round(value / 1000000)}tr`} tickLine={false} axisLine={false} /><Tooltip formatter={(value, name) => name === 'revenue' ? formatCurrency(value) : value} /><Bar dataKey="revenue" name="Doanh thu" fill="#105e4a" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : <div className="empty-chart">Chưa có dữ liệu doanh thu.</div>}
        </Card.Body>
      </Card>
    </>}
  </Container>;
}
