import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { Container, Row, Col, Button, Image, Card, ListGroup } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { formatCurrency } from '../utils/formatCurrency';
export default function Cart() {
  const { cartItems, updateQty, removeItem, subtotal } = useContext(CartContext);
  const navigate = useNavigate();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  // Xử lý trường hợp giỏ hàng trống
  if (cartItems.length === 0) {
    return (
      <Container className="text-center my-5">
        <div className="p-5 bg-light rounded-3">
            <i className="bi bi-cart-x" style={{ fontSize: '4rem', color: '#6c757d' }}></i>
            <h2 className="mt-3">Giỏ hàng của bạn đang trống</h2>
            <p className="lead text-muted">
              Hãy khám phá các sản phẩm tuyệt vời của chúng tôi!
            </p>
            <Button as={Link} to="/" variant="primary" size="lg">
              Tiếp tục mua sắm
            </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <h2 className="mb-4 fw-bold">Giỏ Hàng Của Bạn</h2>
      <Row>
        {/* Cột danh sách sản phẩm */}
        <Col lg={8}>
          <ListGroup variant="flush">
            {cartItems.map(item => (
              <ListGroup.Item key={item.item_key} className="px-0 py-3">
                <Row className="align-items-center">
                  {/* Hình ảnh và Tên sản phẩm */}
                  <Col md={5} className="d-flex align-items-center mb-2 mb-md-0">
                    <Image 
                      src={item.thumbnail} 
                      alt={item.title} 
                      rounded 
                      style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                    />
                    <div className="ms-3">
                      <h6 className="mb-0">{item.title}</h6>
                      {(item.size || item.color) && <small className="cart-variant">{item.size && `Size: ${item.size}`}{item.size && item.color && ' · '}{item.color && `Màu: ${item.color}`}</small>}
                      <small className="text-muted">{formatCurrency(item.price)}</small>
                    </div>
                  </Col>

                  {/* Cập nhật số lượng */}
                  <Col md={3} xs={6} className="d-flex justify-content-md-center align-items-center">
                     <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        onClick={() => updateQty(item.item_key, item.qty - 1)}
                        disabled={item.qty <= 1}
                      >
                       -
                     </Button>
                     <span className="mx-3 fw-bold">{item.qty}</span>
                     <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        onClick={() => updateQty(item.item_key, item.qty + 1)}
                      >
                       +
                     </Button>
                  </Col>

                  {/* Tổng tiền và nút Xóa */}
                  <Col md={4} xs={6} className="text-end">
                    <span className="fw-bold me-3">{formatCurrency(item.price * item.qty)}</span>
                    <Button variant="outline-danger" size="sm" onClick={() => removeItem(item.item_key)}>
                      <i className="bi bi-trash"></i>
                    </Button>
                  </Col>
                </Row>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>

        {/* Cột tóm tắt đơn hàng */}
        <Col lg={4}>
          <Card className="shadow-sm border-0 sticky-top" style={{ top: '2rem' }}>
            <Card.Body>
              <Card.Title as="h4" className="fw-bold">Tóm Tắt Đơn Hàng</Card.Title>
              <hr />
              <div className="d-flex justify-content-between mb-3">
                <span>Tạm tính</span>
                <span className="fw-bold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span>Phí vận chuyển</span>
                <span>Miễn phí</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between fw-bold h5">
                <span>Tổng cộng</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="d-grid mt-4">
                <Button variant="primary" size="lg" onClick={handleCheckout}>
                  Tiến hành thanh toán
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
