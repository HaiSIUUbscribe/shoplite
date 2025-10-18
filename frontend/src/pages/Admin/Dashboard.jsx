import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Row, Col, Card, Spinner, Alert } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";
import { formatCurrency } from "../../utils/formatCurrency";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from "recharts";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [chartData, setChartData] = useState([]); // Dữ liệu biểu đồ
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.get("http://localhost:3600/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStats(res.data.stats || res.data);

      // Giả lập dữ liệu biểu đồ (backend có thể trả dữ liệu thực)
      setChartData(res.data.monthlyStats || [
        { month: "1", revenue: 12000000, orders: 15 },
        { month: "2", revenue: 18000000, orders: 22 },
        { month: "3", revenue: 14500000, orders: 17 },
        { month: "4", revenue: 23000000, orders: 28 },
        { month: "5", revenue: 19000000, orders: 21 },
        { month: "6", revenue: 25000000, orders: 30 },
      ]);
    } catch (err) {
      console.error("Lỗi khi tải thống kê:", err);
      setError("Không thể tải dữ liệu Dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card className="shadow-sm border-0 h-100">
      <Card.Body className="d-flex align-items-center">
        <div
          className={`rounded-circle d-flex justify-content-center align-items-center me-3`}
          style={{
            width: "60px",
            height: "60px",
            backgroundColor: `${color}20`,
            color,
            fontSize: "1.8rem",
          }}
        >
          <i className={`bi ${icon}`}></i>
        </div>
        <div>
          <h6 className="text-muted mb-1">{title}</h6>
          <h4 className="fw-bold mb-0">
            {title === "Doanh thu" ? formatCurrency(value) : value}
          </h4>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <Container className="my-5">
      <h2 className="fw-bold mb-4 text-primary">
        <i className="bi bi-speedometer2 me-2"></i> Trang quản trị
      </h2>

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" />
          <p className="mt-3">Đang tải dữ liệu...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <>
          {/* Thống kê nhanh */}
          <Row className="g-4 mb-5">
            <Col md={4} sm={6}>
              <StatCard
                title="Sản phẩm"
                value={stats.totalProducts}
                icon="bi-box-seam"
                color="#0d6efd"
              />
            </Col>
            <Col md={4} sm={6}>
              <StatCard
                title="Đơn hàng"
                value={stats.totalOrders}
                icon="bi-cart-check"
                color="#198754"
              />
            </Col>
            <Col md={4} sm={6}>
              <StatCard
                title="Doanh thu"
                value={stats.totalRevenue}
                icon="bi-cash-coin"
                color="#dc3545"
              />
            </Col>
          </Row>

          {/* Biểu đồ doanh thu và đơn hàng */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
              <h5 className="fw-semibold mb-4">
                <i className="bi bi-bar-chart-line text-primary me-2"></i>
                Biểu đồ doanh thu theo tháng
              </h5>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `${v / 1000000}tr`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#0d6efd" name="Doanh thu" />
                  <Bar dataKey="orders" fill="#198754" name="Đơn hàng" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>

          {/* Biểu đồ đường: xu hướng đơn hàng */}
          <Card className="shadow-sm border-0">
            <Card.Body>
              <h5 className="fw-semibold mb-4">
                <i className="bi bi-graph-up-arrow text-success me-2"></i>
                Xu hướng đơn hàng theo thời gian
              </h5>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="orders" stroke="#198754" strokeWidth={3} name="Số đơn hàng" />
                  <Line type="monotone" dataKey="revenue" stroke="#0d6efd" strokeWidth={3} name="Doanh thu" />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </>
      )}
    </Container>
  );
}
