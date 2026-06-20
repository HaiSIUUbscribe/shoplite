import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Image, InputGroup, ListGroup, Row, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { locationService, orderService, voucherService } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  provinceCode: '',
  districtCode: '',
  wardCode: '',
  streetAddress: '',
  paymentMethod: 'cod',
};

export default function Checkout() {
  const { cartItems, buyNowItem, clearCart, clearBuyNow } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isBuyNow = searchParams.get('mode') === 'buy-now';
  const checkoutItems = isBuyNow && buyNowItem ? [buyNowItem] : isBuyNow ? [] : cartItems;
  const subtotal = checkoutItems.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);

  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [requestError, setRequestError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [locationsError, setLocationsError] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherStatus, setVoucherStatus] = useState('idle');
  const [voucherMessage, setVoucherMessage] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const discountAmount = Number(appliedVoucher?.discountAmount || 0);
  const total = Math.max(0, subtotal - discountAmount);

  useEffect(() => {
    setForm((current) => ({ ...current, name: user?.name || '', email: user?.email || '' }));
    if (!user) return;
    try {
      const saved = JSON.parse(window.localStorage.getItem('shoplite_saved_voucher_v1') || 'null');
      if (saved?.userId === user.id && saved?.voucher?.code) {
        setVoucherCode(saved.voucher.code);
        setVoucherMessage('Voucher đã lưu từ trang sản phẩm. Nhấn Áp dụng để sử dụng.');
      }
    } catch {
      window.localStorage.removeItem('shoplite_saved_voucher_v1');
    }
  }, [user]);

  const loadLocations = () => {
    setLocationsLoading(true);
    setLocationsError('');
    locationService.getVietnamLocations()
      .then((data) => setLocations(Array.isArray(data) ? data : []))
      .catch(() => setLocationsError('Không thể tải dữ liệu địa chỉ. Vui lòng thử lại.'))
      .finally(() => setLocationsLoading(false));
  };

  useEffect(loadLocations, []);

  const selectedProvince = useMemo(
    () => locations.find((item) => String(item.code) === form.provinceCode),
    [locations, form.provinceCode]
  );
  const districts = selectedProvince?.districts || [];
  const selectedDistrict = districts.find((item) => String(item.code) === form.districtCode);
  const wards = selectedDistrict?.wards || [];
  const selectedWard = wards.find((item) => String(item.code) === form.wardCode);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: '' }));
    if (name === 'email' && appliedVoucher) {
      setAppliedVoucher(null);
      setVoucherStatus('idle');
      setVoucherMessage('Email thay đổi, vui lòng áp dụng lại voucher.');
    }
  };

  const updateVoucherCode = (event) => {
    setVoucherCode(event.target.value.toUpperCase());
    setAppliedVoucher(null);
    setVoucherStatus('idle');
    setVoucherMessage('');
  };

  const applyVoucher = async () => {
    const code = voucherCode.trim().toUpperCase();
    if (!/^[A-Z0-9-]{6,32}$/.test(code)) {
      setVoucherStatus('error');
      setVoucherMessage('Vui lòng nhập mã voucher hợp lệ.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setVoucherStatus('error');
      setVoucherMessage('Nhập email nhận hàng trước khi áp dụng voucher.');
      return;
    }

    setVoucherLoading(true);
    setVoucherMessage('');
    try {
      const data = await voucherService.validate(code, form.email, subtotal);
      setAppliedVoucher(data);
      setVoucherCode(data.code);
      setVoucherStatus('success');
      setVoucherMessage(`Đã giảm ${formatCurrency(data.discountAmount)}.`);
    } catch (error) {
      setAppliedVoucher(null);
      setVoucherStatus('error');
      setVoucherMessage(error.response?.data?.message || 'Không thể kiểm tra voucher. Vui lòng thử lại.');
      if (['VOUCHER_USED', 'VOUCHER_ALREADY_USED', 'VOUCHER_EXPIRED', 'VOUCHER_UNAVAILABLE'].includes(error.response?.data?.code)) {
        window.localStorage.removeItem('shoplite_saved_voucher_v1');
      }
    } finally {
      setVoucherLoading(false);
    }
  };

  const updateProvince = (event) => {
    setForm((current) => ({ ...current, provinceCode: event.target.value, districtCode: '', wardCode: '' }));
    setFieldErrors((current) => ({ ...current, provinceCode: '', districtCode: '', wardCode: '' }));
  };

  const updateDistrict = (event) => {
    setForm((current) => ({ ...current, districtCode: event.target.value, wardCode: '' }));
    setFieldErrors((current) => ({ ...current, districtCode: '', wardCode: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (form.name.trim().length < 2) errors.name = 'Họ tên phải có ít nhất 2 ký tự.';
    if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Email chưa đúng định dạng.';
    if (!/^[0-9+().\s-]{8,20}$/.test(form.phone)) errors.phone = 'Số điện thoại phải có từ 8 đến 20 ký tự hợp lệ.';
    if (!form.provinceCode) errors.provinceCode = 'Vui lòng chọn Tỉnh/Thành phố.';
    if (!form.districtCode) errors.districtCode = 'Vui lòng chọn Quận/Huyện.';
    if (!form.wardCode) errors.wardCode = 'Vui lòng chọn Phường/Xã.';
    if (form.streetAddress.trim().length < 5) errors.streetAddress = 'Vui lòng nhập số nhà và tên đường, tối thiểu 5 ký tự.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setRequestError('');
    if (!validateForm()) return;

    const customerAddress = [
      form.streetAddress.trim(),
      selectedWard?.name,
      selectedDistrict?.name,
      selectedProvince?.name,
    ].filter(Boolean).join(', ');

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
        customer_address: customerAddress,
        payment_method: form.paymentMethod,
        voucher_code: appliedVoucher?.code || undefined,
      });
      if (appliedVoucher) window.localStorage.removeItem('shoplite_saved_voucher_v1');
      if (response.paymentUrl) {
        window.sessionStorage.setItem('shoplite_pending_checkout_mode', isBuyNow ? 'buy-now' : 'cart');
        window.location.assign(response.paymentUrl);
        return;
      }
      if (isBuyNow) clearBuyNow();
      else clearCart();
      navigate(`/order-success/${response.orderId}`, { replace: true });
    } catch (error) {
      setRequestError(error.response?.data?.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!checkoutItems.length) {
    return <Container className="py-5"><div className="empty-state"><i className="bi bi-cart-x" /><h2>Không có sản phẩm để thanh toán</h2><p>Thêm sản phẩm vào giỏ trước khi tiếp tục.</p><Button as={Link} to="/products">Tiếp tục mua sắm</Button></div></Container>;
  }

  return <Container className="checkout-page">
    <div className="page-title"><span>Thanh toán bảo mật</span><h1>Thông tin đặt hàng</h1></div>
    <Form onSubmit={handleSubmit} noValidate>
      <Row className="g-4">
        <Col lg={7}>
          <Card className="checkout-panel border-0"><Card.Body>
            <h2>Thông tin giao hàng</h2>
            {requestError && <Alert variant="danger">{requestError}</Alert>}
            {locationsError && <Alert variant="warning" className="d-flex justify-content-between align-items-center">{locationsError}<Button type="button" size="sm" variant="outline-dark" onClick={loadLocations}>Thử lại</Button></Alert>}

            <Row>
              <Col md={6}><Form.Group className="mb-3" controlId="checkout-name"><Form.Label>Họ và tên</Form.Label><Form.Control name="name" value={form.name} onChange={updateField} autoComplete="name" isInvalid={Boolean(fieldErrors.name)} disabled={loading} /><Form.Control.Feedback type="invalid">{fieldErrors.name}</Form.Control.Feedback></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3" controlId="checkout-phone"><Form.Label>Số điện thoại</Form.Label><Form.Control name="phone" value={form.phone} onChange={updateField} autoComplete="tel" placeholder="09xx xxx xxx" isInvalid={Boolean(fieldErrors.phone)} disabled={loading} /><Form.Control.Feedback type="invalid">{fieldErrors.phone}</Form.Control.Feedback></Form.Group></Col>
            </Row>

            <Form.Group className="mb-3" controlId="checkout-email"><Form.Label>Email nhận xác nhận</Form.Label><Form.Control name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" isInvalid={Boolean(fieldErrors.email)} disabled={loading} /><Form.Control.Feedback type="invalid">{fieldErrors.email}</Form.Control.Feedback></Form.Group>

            <Row>
              <Col md={6}><Form.Group className="mb-3" controlId="checkout-province"><Form.Label>Tỉnh/Thành phố</Form.Label><Form.Select name="provinceCode" value={form.provinceCode} onChange={updateProvince} isInvalid={Boolean(fieldErrors.provinceCode)} disabled={loading || locationsLoading}><option value="">{locationsLoading ? 'Đang tải...' : 'Chọn Tỉnh/Thành phố'}</option>{locations.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</Form.Select><Form.Control.Feedback type="invalid">{fieldErrors.provinceCode}</Form.Control.Feedback></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3" controlId="checkout-district"><Form.Label>Quận/Huyện</Form.Label><Form.Select name="districtCode" value={form.districtCode} onChange={updateDistrict} isInvalid={Boolean(fieldErrors.districtCode)} disabled={loading || !form.provinceCode}><option value="">Chọn Quận/Huyện</option>{districts.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</Form.Select><Form.Control.Feedback type="invalid">{fieldErrors.districtCode}</Form.Control.Feedback></Form.Group></Col>
            </Row>

            <Form.Group className="mb-3" controlId="checkout-ward"><Form.Label>Phường/Xã</Form.Label><Form.Select name="wardCode" value={form.wardCode} onChange={updateField} isInvalid={Boolean(fieldErrors.wardCode)} disabled={loading || !form.districtCode}><option value="">Chọn Phường/Xã</option>{wards.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</Form.Select><Form.Control.Feedback type="invalid">{fieldErrors.wardCode}</Form.Control.Feedback></Form.Group>

            <Form.Group className="mb-4" controlId="checkout-street"><Form.Label>Địa chỉ cụ thể</Form.Label><Form.Control name="streetAddress" value={form.streetAddress} onChange={updateField} autoComplete="street-address" placeholder="Số nhà, tên đường" isInvalid={Boolean(fieldErrors.streetAddress)} disabled={loading} /><Form.Control.Feedback type="invalid">{fieldErrors.streetAddress}</Form.Control.Feedback></Form.Group>

            <h2>Phương thức thanh toán</h2>
            <div className="payment-options">
              <Form.Check type="radio" id="payment-cod" name="paymentMethod" value="cod" checked={form.paymentMethod === 'cod'} onChange={updateField} label={<><i className="bi bi-cash-coin" /><span><strong>Thanh toán khi nhận hàng</strong><small>Thanh toán tiền mặt cho đơn vị vận chuyển</small></span></>} />
              <Form.Check type="radio" id="payment-bank" name="paymentMethod" value="bank_transfer" checked={form.paymentMethod === 'bank_transfer'} onChange={updateField} label={<><i className="bi bi-bank" /><span><strong>Chuyển khoản ngân hàng</strong><small>Shop sẽ liên hệ gửi thông tin chuyển khoản</small></span></>} />
              <Form.Check type="radio" id="payment-vnpay" name="paymentMethod" value="vnpay" checked={form.paymentMethod === 'vnpay'} onChange={updateField} label={<><i className="bi bi-qr-code-scan" /><span><strong>Thanh toán qua VNPay</strong><small>Thẻ ATM, tài khoản ngân hàng hoặc VNPay QR</small></span></>} />
            </div>
          </Card.Body></Card>
        </Col>

        <Col lg={5}><Card className="checkout-panel order-summary border-0"><Card.Body>
          <h2>{isBuyNow ? 'Mua ngay' : 'Đơn hàng'} ({checkoutItems.length})</h2>
          <ListGroup variant="flush">{checkoutItems.map((item) => <ListGroup.Item key={item.item_key} className="summary-item">{item.thumbnail ? <Image src={item.thumbnail} alt={item.title} /> : <div className="summary-placeholder"><i className="bi bi-image" /></div>}<div><strong>{item.title}</strong>{(item.size || item.color) && <span>{item.size && `Size ${item.size}`}{item.size && item.color && ' · '}{item.color}</span>}<span>Số lượng: {item.qty}</span></div><b>{formatCurrency(Number(item.price) * item.qty)}</b></ListGroup.Item>)}</ListGroup>
          <div className="checkout-voucher">
            <Form.Label htmlFor="checkout-voucher-code"><i className="bi bi-ticket-perforated me-2" />Mã voucher</Form.Label>
            <InputGroup>
              <Form.Control
                id="checkout-voucher-code"
                value={voucherCode}
                onChange={updateVoucherCode}
                placeholder="VD: SL-ABC123"
                maxLength={32}
                disabled={loading || voucherLoading}
                aria-invalid={voucherStatus === 'error'}
              />
              <Button type="button" variant="outline-primary" onClick={applyVoucher} disabled={loading || voucherLoading || !voucherCode.trim()}>
                {voucherLoading ? <Spinner animation="border" size="sm" /> : 'Áp dụng'}
              </Button>
            </InputGroup>
            {voucherMessage && <div className={`voucher-message is-${voucherStatus}`} role="status"><i className={`bi ${voucherStatus === 'success' ? 'bi-check-circle-fill' : 'bi-info-circle'}`} />{voucherMessage}</div>}
          </div>
          <div className="summary-row"><span>Tạm tính</span><span>{formatCurrency(subtotal)}</span></div>
          <div className="summary-row"><span>Phí vận chuyển</span><span>Miễn phí</span></div>
          {discountAmount > 0 && <div className="summary-row summary-discount"><span>Voucher {appliedVoucher.code}</span><strong>-{formatCurrency(discountAmount)}</strong></div>}
          <div className="summary-total"><span>Tổng thanh toán</span><strong>{formatCurrency(total)}</strong></div>
          <Button type="submit" size="lg" className="w-100" disabled={loading || locationsLoading}>{loading ? <><Spinner size="sm" className="me-2" />Đang xác nhận...</> : 'Xác nhận đặt hàng'}</Button>
          <p className="secure-note"><i className="bi bi-lock" /> Tổng tiền được hệ thống kiểm tra lại trước khi tạo đơn.</p>
        </Card.Body></Card></Col>
      </Row>
    </Form>
  </Container>;
}
