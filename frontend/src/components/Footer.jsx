import React from "react";
import { Container, Row, Col } from "react-bootstrap";

const Footer = () => {
  return (
    <footer className="bg-dark text-light mt-5 py-4">
      <Container>
        <Row>
          <Col md={4}>
            <h5 className="fw-bold">ShopLite</h5>
            <p>Địa chỉ mua sắm đáng tin cậy, mang đến trải nghiệm tuyệt vời cho bạn.</p>
          </Col>
          <Col md={4}>
            <h6 className="fw-semibold">Liên hệ</h6>
            <ul className="list-unstyled">
              <li><i className="bi bi-geo-alt"></i> 123 Đường ABC, TP. HCM</li>
              <li><i className="bi bi-telephone"></i> 0123 456 789</li>
              <li><i className="bi bi-envelope"></i> support@shoplite.vn</li>
            </ul>
          </Col>
          <Col md={4}>
            <h6 className="fw-semibold">Theo dõi chúng tôi</h6>
            <div className="d-flex gap-3">
              <i className="bi bi-facebook fs-4"></i>
              <i className="bi bi-instagram fs-4"></i>
              <i className="bi bi-twitter fs-4"></i>
              <i className="bi bi-youtube fs-4"></i>
            </div>
          </Col>
        </Row>
        <hr className="border-light" />
        <p className="text-center mb-0">&copy; {new Date().getFullYear()} ShopLite. All rights reserved.</p>
      </Container>
    </footer>
  );
};

export default Footer;
