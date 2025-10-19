import React, { useEffect, useState } from "react";
import {Container,Card,Spinner,Alert,Accordion,ListGroup,Row,Col,Image,Badge,Button } from "react-bootstrap";
import axios from "axios";
import { formatCurrency } from "../utils/formatCurrency";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const UserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("https://shoplite-vwur.onrender.com/api/orders/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const parsedOrders = res.data.map((order) => ({
          ...order,
          items:
            typeof order.items === "string"
              ? JSON.parse(order.items)
              : order.items || [],
        }));
        setOrders(parsedOrders);
      } catch (err) {
        console.error("Lỗi khi lấy đơn hàng:", err);
        setError("Không thể tải danh sách đơn hàng.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "processing":
        return "info";
      case "done":
        return "success";
      case "cancelled":
        return "danger";
      default:
        return "secondary";
    }
  };

  //Xuất PDF
  const handleDownloadPDF = (order) => {
    const doc = new jsPDF();

    // Tiêu đề
    doc.setFontSize(18);
    doc.text("HOA DON MUA HANG", 105, 20, { align: "center" });

    // Thông tin đơn hàng
    doc.setFontSize(12);
    doc.text(`MA don hang: #${order.id}`, 14, 35);
    doc.text(
      `Ngay dat: ${new Date(order.created_at).toLocaleString("vi-VN")}`,
      14,
      42
    );
    doc.text(`Trang thai: ${order.status.toUpperCase()}`, 14, 49);

    // Bảng sản phẩm
    const tableBody = order.items.map((item, index) => [
      index + 1,
      item.title || item.name || "Không rõ",
      item.qty || item.quantity || 1,
      formatCurrency(item.price),
      formatCurrency(item.price * (item.qty || item.quantity || 1)),
    ]);

    doc.autoTable({
      startY: 60,
      head: [["#", "Ten san pham", "SL", "Don gia", "Thanh tien"]],
      body: tableBody,
      theme: "striped",
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { halign: "center", fontSize: 11 },
      columnStyles: {
        1: { halign: "left", cellWidth: 70 },
      },
    });

    // Tổng cộng
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.text(`Total: ${formatCurrency(order.total)}`, 150, finalY, {
      align: "right",
    });

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      "Thank you for buy in ShopLite!",
      105,
      285,
      { align: "center" }
    );

    // Xuất file
    doc.save(`don-hang-${order.id}.pdf`);
  };

  // Render nội dung
  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Đang tải đơn hàng...</p>
        </div>
      );
    }

    if (error) {
      return <Alert variant="danger">{error}</Alert>;
    }

    if (orders.length === 0) {
      return (
        <div className="text-center my-5">
          <i className="bi bi-box-seam" style={{ fontSize: "3rem", color: "#6c757d" }}></i>
          <h4 className="mt-3">Bạn chưa có đơn hàng nào</h4>
          <p className="text-muted">
            Tất cả đơn hàng bạn đã đặt sẽ xuất hiện ở đây.
          </p>
        </div>
      );
    }

    return (
      <Accordion defaultActiveKey="0" alwaysOpen>
        {orders.map((order, index) => (
          <Accordion.Item
            eventKey={String(index)}
            key={order.id}
            className="mb-3 border rounded shadow-sm"
          >
            <Accordion.Header>
              <Row className="w-100 align-items-center">
                <Col md={3} xs={6}>
                  <strong className="text-primary">Mã ĐH: #{order.id}</strong>
                </Col>
                <Col md={4} className="d-none d-md-block">
                  Ngày đặt:{" "}
                  {new Date(order.created_at).toLocaleDateString("vi-VN")}
                </Col>
                <Col md={3} xs={4} className="text-md-center">
                  Tổng:{" "}
                  <strong className="text-danger">
                    {formatCurrency(order.total)}
                  </strong>
                </Col>
                <Col md={2} xs={2} className="text-end">
                  <Badge
                    pill
                    bg={getStatusBadgeVariant(order.status)}
                    className="text-capitalize"
                  >
                    {order.status}
                  </Badge>
                </Col>
              </Row>
            </Accordion.Header>

            <Accordion.Body>
              <h5 className="mb-3 fw-semibold text-secondary">
                Chi tiết sản phẩm:
              </h5>
              <ListGroup variant="flush">
                {order.items.map((item, i) => (
                  <ListGroup.Item
                    key={i}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div className="d-flex align-items-center">
                      <Image
                        src={item.thumbnail}
                        alt={item.title}
                        rounded
                        style={{
                          width: "60px",
                          height: "60px",
                          objectFit: "cover",
                        }}
                      />
                      <div className="ms-3">
                        <p className="fw-bold mb-0">{item.title || item.name}</p>
                        <small className="text-muted">
                          Đơn giá: {formatCurrency(item.price)}
                        </small>
                      </div>
                    </div>
                    <div>
                      <p className="mb-0">
                        Số lượng: <strong>{item.qty || item.quantity}</strong>
                      </p>
                      <p className="mb-0 fw-bold text-end">
                        {formatCurrency(
                          item.price * (item.qty || item.quantity)
                        )}
                      </p>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>

              <div className="text-end mt-4">
                <Button
                  variant="outline-primary"
                  onClick={() => handleDownloadPDF(order)}
                >
                  <i className="bi bi-file-earmark-pdf me-2"></i> Xuất hóa đơn PDF
                </Button>
              </div>
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
    );
  };

  return (
    <Container className="my-5">
      <Card className="p-4 shadow border-0">
        <Card.Title as="h2" className="mb-4 text-primary fw-bold">
          <i className="bi bi-receipt-cutoff me-2"></i> Đơn Hàng Của Tôi
        </Card.Title>
        {renderContent()}
      </Card>
    </Container>
  );
};

export default UserOrders;
