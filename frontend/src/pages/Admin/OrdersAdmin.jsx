import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Table, Spinner, Alert,Badge,Form,Button } from "react-bootstrap";
import { formatCurrency } from "../../utils/formatCurrency";

export default function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.get("https://shoplite-vwur.onrender.com/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      let data = res.data;

      if (filter) {
        data = data.filter((o) => o.status === filter);
      }

      setOrders(data);
    } catch (err) {
      console.error("Lỗi khi tải đơn hàng:", err);
      setError("Không thể tải danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `https://shoplite-vwur.onrender.com/api/orders/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders();
    } catch (err) {
      console.error("Lỗi khi cập nhật trạng thái:", err);
      alert("Cập nhật trạng thái thất bại!");
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: "warning",
      processing: "info",
      done: "success",
      cancelled: "danger",
    };
    return <Badge bg={map[status]}>{status}</Badge>;
  };

  return (
    <Container className="my-5">
      <h2 className="fw-bold mb-4 text-primary">
        <i className="bi bi-card-checklist me-2"></i> Quản lý đơn hàng
      </h2>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <Form.Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ width: "200px" }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Đang chờ</option>
          <option value="processing">Đang xử lý</option>
          <option value="done">Hoàn tất</option>
          <option value="cancelled">Đã hủy</option>
        </Form.Select>

        <Button variant="secondary" onClick={fetchOrders}>
          <i className="bi bi-arrow-clockwise me-1"></i> Làm mới
        </Button>
      </div>

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" />
          <p>Đang tải đơn hàng...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <Table bordered hover responsive className="align-middle shadow-sm">
          <thead className="table-primary">
            <tr>
              <th>#</th>
              <th>ID</th>
              <th>Người dùng</th>
              <th>Sản phẩm</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Ngày đặt</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, index) => (
              <tr key={o.id}>
                <td>{index + 1}</td>
                <td>#{o.id}</td>
                <td>{o.user_id}</td>
                <td>
                  {Array.isArray(o.items)
                    ? o.items.map((item, i) => (
                        <div key={i}>
                          {item.title || item.name} × {item.qty || item.quantity}
                        </div>
                      ))
                    : JSON.parse(o.items).map((item, i) => (
                        <div key={i}>
                          {item.title || item.name} × {item.qty || item.quantity}
                        </div>
                      ))}
                </td>
                <td className="text-danger fw-bold">
                  {formatCurrency(o.total)}
                </td>
                <td>{getStatusBadge(o.status)}</td>
                <td>
                  {new Date(o.created_at).toLocaleString("vi-VN", {
                    hour12: false,
                  })}
                </td>
                <td>
                  <Form.Select
                    size="sm"
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                  >
                    <option value="pending">pending</option>
                    <option value="processing">processing</option>
                    <option value="done">done</option>
                    <option value="cancelled">cancelled</option>
                  </Form.Select>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
}
