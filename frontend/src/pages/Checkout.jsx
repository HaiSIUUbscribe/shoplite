import React, { useContext, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Image, ListGroup, Row, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { orderService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { formatCurrency } from '../utils/formatCurrency';

export default function Checkout() {
  const { cartItems, buyNowItem, clearCart, clearBuyNow } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isBuyNow = searchParams.get('mode') === 'buy-now';
  const checkoutItems = isBuyNow && buyNowItem ? [buyNowItem] : isBuyNow ? [] : cartItems;
  const subtotal = checkoutItems.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', paymentMethod: 'cod' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm((current) => ({ ...current, name: user?.name || '', email: user?.email || '' }));
  }, [user]);

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.name.trim().length < 2 || !/\S+@\S+\.\S+/.test(form.email) || !/^[0-9+().\s-]{8,20}$/.test(form.phone) || form.address.trim().length < 10) {
      setError('Vui lòng kiểm tra lại họ tên, email, số điện thoại và địa chỉ nhận hàng.');
      return;
    }

    setLoading(true);
    try {
      const response = await orderService.create({
        items: checkoutItems.map((item) => ({
          product_id: item.product_id,
          qty: item.qty,
          size: item.size || undefined,
          color: item.color || undefined,
        })),
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        customer_address: form.address,
        payment_method: form.paymentMethod,
      });
      if (response.paymentUrl) {
        window.sessionStorage.setItem('shoplite_pending_checkout_mode', isBuyNow ? 'buy-now' : 'cart');
        window.location.assign(response.paymentUrl);
        return;
      }
      if (isBuyNow) clearBuyNow();
      else clearCart();
      navigate(`/order-success/${response.orderId}`, { replace: true });
    } catch (requestError) {
      navigate('/order-failed', { state: { message: requestError.response?.data?.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.' } });
    } finally {
      setLoading(false);
    }
  };

  if (!checkoutItems.length) {
    return <Container className="py-5"><div className="empty-state"><i className="bi bi-cart-x" /><h2>Không có sản phẩm để thanh toán</h2><p>Thêm sản phẩm vào giỏ trước khi tiếp tục.</p><Button as={Link} to="/products">Tiếp tục mua sắm</Button></div></Container>;
  }

  return (
    <Container className="checkout-page">
      <div className="page-title"><span>Thanh toán bảo mật</span><h1>Thông tin đặt hàng</h1></div>
      <Form onSubmit={handleSubmit}>
        <Row className="g-4">
          <Col lg={7}>
            <Card className="checkout-panel border-0">
              <Card.Body>
                <h2>Thông tin giao hàng</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                <Row>
                  <Col md={6}><Form.Group className="mb-3"><Form.Label>Họ và tên</Form.Label><Form.Control name="name" value={form.name} onChange={updateField} autoComplete="name" disabled={loading} required /></Form.Group></Col>
                  <Col md={6}><Form.Group className="mb-3"><Form.Label>Số điện thoại</Form.Label><Form.Control name="phone" value={form.phone} onChange={updateField} autoComplete="tel" placeholder="09xx xxx xxx" disabled={loading} required /></Form.Group></Col>
                </Row>
                <Form.Group className="mb-3"><Form.Label>Email nhận xác nhận</Form.Label><Form.Control name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" disabled={loading} required /></Form.Group>
                <Form.Group className="mb-4"><Form.Label>Địa chỉ nhận hàng</Form.Label><Form.Control name="address" as="textarea" rows={3} value={form.address} onChange={updateField} autoComplete="street-address" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" disabled={loading} required /></Form.Group>

                <h2>Phương thức thanh toán</h2>
                <div className="payment-options">
                  <Form.Check type="radio" id="payment-cod" name="paymentMethod" value="cod" checked={form.paymentMethod === 'cod'} onChange={updateField} label={<><i className="bi bi-cash-coin" /><span><strong>Thanh toán khi nhận hàng</strong><small>Thanh toán tiền mặt cho đơn vị vận chuyển</small></span></>} />
                  <Form.Check type="radio" id="payment-bank" name="paymentMethod" value="bank_transfer" checked={form.paymentMethod === 'bank_transfer'} onChange={updateField} label={<><i className="bi bi-bank" /><span><strong>Chuyển khoản ngân hàng</strong><small>Shop sẽ liên hệ gửi thông tin chuyển khoản</small></span></>} />
                  <Form.Check type="radio" id="payment-vnpay" name="paymentMethod" value="vnpay" checked={form.paymentMethod === 'vnpay'} onChange={updateField} label={<><i className="bi bi-qr-code-scan" /><span><strong>Thanh toán qua VNPay</strong><small>Thẻ ATM, tài khoản ngân hàng hoặc VNPay QR</small></span></>} />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={5}>
            <Card className="checkout-panel order-summary border-0">
              <Card.Body>
                <h2>{isBuyNow ? 'Mua ngay' : 'Đơn hàng'} ({checkoutItems.length})</h2>
                <ListGroup variant="flush">
                  {checkoutItems.map((item) => <ListGroup.Item key={item.item_key} className="summary-item">
                    {item.thumbnail ? <Image src={item.thumbnail} alt={item.title} /> : <div className="summary-placeholder"><i className="bi bi-image" /></div>}
                    <div><strong>{item.title}</strong>{(item.size || item.color) && <span>{item.size && `Size ${item.size}`}{item.size && item.color && ' · '}{item.color}</span>}<span>Số lượng: {item.qty}</span></div>
                    <b>{formatCurrency(Number(item.price) * item.qty)}</b>
                  </ListGroup.Item>)}
                </ListGroup>
                <div className="summary-row"><span>Tạm tính</span><span>{formatCurrency(subtotal)}</span></div>
                <div className="summary-row"><span>Phí vận chuyển</span><span>Miễn phí</span></div>
                <div className="summary-total"><span>Tổng thanh toán</span><strong>{formatCurrency(subtotal)}</strong></div>
                <Button type="submit" size="lg" className="w-100" disabled={loading}>
                  {loading ? <><Spinner size="sm" className="me-2" />Đang xác nhận...</> : 'Xác nhận đặt hàng'}
                </Button>
                <p className="secure-note"><i className="bi bi-lock" /> Tổng tiền được hệ thống kiểm tra lại trước khi tạo đơn.</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>
    </Container>
  );
}
