import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Form, Image, InputGroup, ListGroup, Spinner } from 'react-bootstrap';
import { formatCurrency } from '../../utils/formatCurrency';

export default function CheckoutSummary({
  isBuyNow,
  checkoutItems,
  voucherCode,
  updateVoucherCode,
  applyVoucher,
  voucherLoading,
  voucherStatus,
  voucherMessage,
  appliedVoucher,
  subtotal,
  discountAmount,
  total,
  loading,
  locationsLoading,
  hasFieldErrors,
}) {
  return (
    <>
      <h2>{isBuyNow ? 'Mua ngay' : 'Đơn hàng'} ({checkoutItems.length})</h2>
      <ListGroup variant="flush">
        {checkoutItems.map((item) => (
          <ListGroup.Item key={item.item_key} className="summary-item">
            {item.thumbnail ? <Image src={item.thumbnail} alt={item.title} /> : <div className="summary-placeholder"><i className="bi bi-image" /></div>}
            <div>
              <strong>{item.title}</strong>
              {(item.size || item.color) && <span>{item.size && `Size ${item.size}`}{item.size && item.color && ' · '}{item.color}</span>}
              <span>Số lượng: {item.qty}</span>
            </div>
            <b>{formatCurrency(Number(item.price) * item.qty)}</b>
          </ListGroup.Item>
        ))}
      </ListGroup>

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
        {voucherMessage && (
          <div className={`voucher-message is-${voucherStatus}`} role="status">
            <i className={`bi ${voucherStatus === 'success' ? 'bi-check-circle-fill' : 'bi-info-circle'}`} />
            {voucherMessage}
          </div>
        )}
      </div>

      <div className="summary-row"><span>Tạm tính</span><span>{formatCurrency(subtotal)}</span></div>
      <div className="summary-row"><span>Phí vận chuyển</span><span>Miễn phí</span></div>
      {discountAmount > 0 && (
        <div className="summary-row summary-discount">
          <span>Voucher {appliedVoucher?.code}</span>
          <strong>-{formatCurrency(discountAmount)}</strong>
        </div>
      )}
      <div className="summary-total"><span>Tổng thanh toán</span><strong>{formatCurrency(total)}</strong></div>
      
      {hasFieldErrors && (
        <Alert variant="warning" className="py-2 mb-3">
          Vui lòng kiểm tra các trường thông tin giao hàng còn thiếu.
        </Alert>
      )}
      <Button type="submit" size="lg" className="w-100" disabled={loading || locationsLoading}>
        {loading || locationsLoading ? (
          <><Spinner size="sm" className="me-2" />{locationsLoading ? 'Đang tải địa chỉ...' : 'Đang xác nhận...'}</>
        ) : 'Xác nhận đặt hàng'}
      </Button>
      <p className="secure-note"><i className="bi bi-lock" /> Tổng tiền được hệ thống kiểm tra lại trước khi tạo đơn.</p>
    </>
  );
}

CheckoutSummary.propTypes = {
  isBuyNow: PropTypes.bool.isRequired,
  checkoutItems: PropTypes.array.isRequired,
  voucherCode: PropTypes.string.isRequired,
  updateVoucherCode: PropTypes.func.isRequired,
  applyVoucher: PropTypes.func.isRequired,
  voucherLoading: PropTypes.bool.isRequired,
  voucherStatus: PropTypes.string.isRequired,
  voucherMessage: PropTypes.string.isRequired,
  appliedVoucher: PropTypes.object,
  subtotal: PropTypes.number.isRequired,
  discountAmount: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  loading: PropTypes.bool.isRequired,
  locationsLoading: PropTypes.bool.isRequired,
  hasFieldErrors: PropTypes.bool.isRequired,
};
