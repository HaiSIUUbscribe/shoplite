import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function Footer() {
  return <footer className="site-footer">
    <Container>
      <Row className="g-4">
        <Col lg={5}><Link to="/" className="footer-brand"><i className="bi bi-bag-check-fill" /> ShopLite</Link><p>Mua sắm rõ ràng, thuận tiện và được theo dõi xuyên suốt từ lúc đặt đến khi nhận hàng.</p></Col>
        <Col sm={6} lg={3}><h2>Mua sắm</h2><Link to="/products">Tất cả sản phẩm</Link><Link to="/cart">Giỏ hàng</Link><Link to="/orders">Tra cứu đơn hàng</Link></Col>
        <Col sm={6} lg={4}><h2>Hỗ trợ khách hàng</h2><Link to="/contact"><i className="bi bi-chat-dots" /> Trung tâm hỗ trợ</Link><a href="mailto:support@shoplite.vn"><i className="bi bi-envelope" /> support@shoplite.vn</a><span><i className="bi bi-clock" /> 08:00 - 21:00, Thứ 2 - Chủ nhật</span></Col>
      </Row>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} ShopLite</span><span>Giá hiển thị đã bao gồm thuế theo quy định.</span></div>
    </Container>
  </footer>;
}
