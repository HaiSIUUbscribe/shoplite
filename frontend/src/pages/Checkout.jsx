import React, { useContext, useState, useEffect } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext'; // Import AuthContext để lấy thông tin user
import axiosClient from '../api/axiosClient';
import { Container, Form, Button, Alert, Row, Col, Card, ListGroup, Image, Spinner } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { formatCurrency } from '../utils/formatCurrency'; // Giả sử bạn có hàm này

export default function Checkout() {
  const { cartItems, subtotal, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext); // Lấy thông tin user đã đăng nhập
  const navigate = useNavigate();

  // State cho form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // State cho UI
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Tự động điền thông tin nếu user đã đăng nhập
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      if (!name || !email || !phone || !address) {
        setError('Vui lòng điền đầy đủ tất cả thông tin giao hàng.');
        return;
      }
      if (!/\S+@\S+\.\S+/.test(email)) {
          setError('Định dạng email không hợp lệ. Vui lòng kiểm tra lại.');
          return; 
      }
      setLoading(true); 
  
      try {
        const orderData = {
          items: cartItems.map(item => ({
            product_id: item.product_id,
            title: item.title,
            price: item.price,
            qty: item.qty,
          })),
          total: subtotal,
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          customer_address: address
        };
        
        await axiosClient.post('/orders', orderData);
        
        clearCart();
        setSuccess('Đặt hàng thành công! Cảm ơn bạn đã mua sắm.');
        setTimeout(() => navigate('/'), 3000); 
  
      } catch (err) {
        console.error('Checkout error', err);
        setError(err.response?.data?.message || 'Đã có lỗi xảy ra, vui lòng thử lại.');
        setLoading(false);
      } 
    };

  // --- Xử lý các trạng thái đặc biệt ---

  if (cartItems.length === 0 && !success) {
    return (
      <Container className="text-center my-5">
        <div className="p-5 bg-light rounded-3">
            <i className="bi bi-cart-x" style={{ fontSize: '4rem', color: '#6c757d' }}></i>
            <h2 className="mt-3">Không có sản phẩm nào để thanh toán</h2>
            <p className="lead text-muted">
              Vui lòng thêm sản phẩm vào giỏ hàng trước.
            </p>
            <Button as={Link} to="/" variant="primary" size="lg">
              Quay về trang chủ
            </Button>
        </div>
      </Container>
    );
  }

  if (success) {
    return (
        <Container className="text-center my-5">
            <div className="p-5 bg-light rounded-3">
                <i className="bi bi-check-circle-fill" style={{ fontSize: '4rem', color: '#198754' }}></i>
                <h2 className="mt-3">Đặt Hàng Thành Công!</h2>
                <p className="lead text-muted">{success}</p>
                <p>Chúng tôi sẽ liên hệ với bạn để xác nhận đơn hàng sớm nhất.</p>
                <Button as={Link} to="/" variant="primary" size="lg">
                    Tiếp tục mua sắm
                </Button>
            </div>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <h2 className="mb-4 fw-bold text-center">Thanh Toán</h2>
      <Row>
        {/* Cột thông tin khách hàng */}
        <Col lg={7}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body className="p-4">
              <h4 className="mb-3">Thông tin giao hàng</h4>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="name">
                  <Form.Label>Họ và tên</Form.Label>
                  <Form.Control placeholder="Nguyễn Văn A" value={name} onChange={e => setName(e.target.value)} required disabled={loading} />
                </Form.Group>
                <Row>
                  <Col md={6}>
                     <Form.Group className="mb-3" controlId="email">
                        <Form.Label>Email</Form.Label>
                        <Form.Control type="email" placeholder="example@email.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="phone">
                        <Form.Label>Số điện thoại</Form.Label>
                        <Form.Control placeholder="09xxxxxxxx" value={phone} onChange={e => setPhone(e.target.value)} required disabled={loading} />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3" controlId="address">
                  <Form.Label>Địa chỉ nhận hàng</Form.Label>
                  <Form.Control as="textarea" rows={3} placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố" value={address} onChange={e => setAddress(e.target.value)} required disabled={loading} />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Cột tóm tắt đơn hàng */}
        <Col lg={5}>
          <Card className="shadow-sm border-0 sticky-top" style={{ top: '2rem' }}>
            <Card.Body className="p-4">
              <h4 className="mb-3">Đơn hàng của bạn</h4>
              <ListGroup variant="flush">
                {cartItems.map(item => (
                  <ListGroup.Item key={item.product_id} className="d-flex justify-content-between align-items-center px-0">
                    <div className="d-flex align-items-center">
                        <Image src={item.thumbnail} rounded style={{width: '60px'}}/>
                        <div className="ms-3">
                            <p className="mb-0 fw-bold">{item.title}</p>
                            <small className="text-muted">SL: {item.qty}</small>
                        </div>
                    </div>
                    <span>{formatCurrency(item.price * item.qty)}</span>
                  </ListGroup.Item>
                ))}
                <ListGroup.Item className="d-flex justify-content-between align-items-center px-0 fw-bold h5 mt-3">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(subtotal)}</span>
                </ListGroup.Item>
              </ListGroup>
              <div className="d-grid mt-4">
                <Button variant="primary" size="lg" onClick={handleSubmit} disabled={loading}>
                   {loading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" />
                      <span className="ms-2">Đang xử lý...</span>
                    </>
                  ) : `Đặt Hàng (${formatCurrency(subtotal)})`}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}