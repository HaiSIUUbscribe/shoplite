import React, { useEffect, useState } from "react";
import { Container, Row, Col, Carousel, Spinner, Button, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("https://dummyjson.com/products")
      .then((res) => {
        if (!res.ok) {
          throw new Error('Không thể kết nối đến máy chủ.');
        }
        return res.json();
      })
      .then((data) => {
        setProducts(data.products.slice(0, 12));
      })
      .catch((err) => {
        console.error("Lỗi khi tải sản phẩm:", err);
        setError("Không thể tải được sản phẩm. Vui lòng thử lại sau.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);
  
  const renderProductList = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 lead">Đang tải sản phẩm...</p>
        </div>
      );
    }

    if (error) {
      return <div className="text-center py-5 alert alert-danger">{error}</div>;
    }

    return (
      <Row className="g-4">
        {products.map((product) => (
          <Col md={3} sm={6} xs={12} key={product.id}>
            <ProductCard product={product} />
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <>

      {/* === Section: Carousel Banner === */}
      <Carousel fade interval={4000}>
        <Carousel.Item>
          <img
            className="d-block w-100"
            src="https://media.routine.vn/3800x0/prod/media/desktop-banner-web-fall-25-01-png-n7s2.webp"
            alt="Thời trang mùa thu"
            style={{ height: "450px", objectFit: "cover" }}
          />
          <Carousel.Caption className="bg-dark bg-opacity-50 rounded p-3">
            <h3>Chào mừng đến với ShopLite</h3>
            <p>Khám phá hàng ngàn sản phẩm chất lượng cao.</p>
          </Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item>
          <img
            className="d-block w-100"
            src="https://jysk.vn/media/catalog/category/MKT/Banner/1352x536__KVSN10T_PK_VIE.png"
            alt="Ưu đãi mỗi ngày"
            style={{ height: "450px", objectFit: "cover" }}
          />
          <Carousel.Caption className="bg-dark bg-opacity-50 rounded p-3">
            <h3>Giá Tốt Mỗi Ngày</h3>
            <p>Ưu đãi đặc biệt dành riêng cho bạn.</p>
          </Carousel.Caption>
        </Carousel.Item>
      </Carousel>

      {/* === Section: Features (Điểm nổi bật của dịch vụ) === */}
      <Container className="my-5">
        <Row className="text-center g-4">
            <Col md={4}>
                <Card className="border-0 bg-transparent">
                    <Card.Body>
                        <i className="bi bi-truck h1 text-primary"></i>
                        <h4 className="fw-bold mt-2">Giao Hàng Nhanh</h4>
                        <p className="text-muted">Miễn phí vận chuyển cho tất cả đơn hàng trên 500.000đ.</p>
                    </Card.Body>
                </Card>
            </Col>
            <Col md={4}>
                <Card className="border-0 bg-transparent">
                    <Card.Body>
                        <i className="bi bi-headset h1 text-primary"></i>
                        <h4 className="fw-bold mt-2">Hỗ Trợ 24/7</h4>
                        <p className="text-muted">Luôn sẵn sàng giải đáp mọi thắc mắc của bạn.</p>
                    </Card.Body>
                </Card>
            </Col>
            <Col md={4}>
                <Card className="border-0 bg-transparent">
                    <Card.Body>
                        <i className="bi bi-shield-check h1 text-primary"></i>
                        <h4 className="fw-bold mt-2">Thanh Toán An Toàn</h4>
                        <p className="text-muted">Bảo mật tuyệt đối thông tin thanh toán của bạn.</p>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
      </Container>
      
      {/* === Section: Products === */}
      <div className="bg-light py-5">
        <Container>
            <h2 className="text-center fw-bold mb-5 display-5">Sản Phẩm Nổi Bật</h2>
            {renderProductList()}
            <div className="text-center mt-5">
                <Button as={Link} to="/products" variant="primary" size="lg">
                  Xem tất cả sản phẩm <i className="bi bi-arrow-right"></i>
                </Button>
            </div>
        </Container>
      </div>

    </>
  );
};

export default Home;