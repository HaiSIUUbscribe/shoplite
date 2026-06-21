import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';

export default function PaymentMethods({ paymentMethod, onChange }) {
  return (
    <>
      <h2>Phương thức thanh toán</h2>
      <div className="payment-options">
        <Form.Check 
          type="radio" 
          id="payment-cod" 
          name="paymentMethod" 
          value="cod" 
          checked={paymentMethod === 'cod'} 
          onChange={onChange} 
          label={<><i className="bi bi-cash-coin" /><span><strong>Thanh toán khi nhận hàng</strong><small>Thanh toán tiền mặt cho đơn vị vận chuyển</small></span></>} 
        />
        <Form.Check 
          type="radio" 
          id="payment-bank" 
          name="paymentMethod" 
          value="bank_transfer" 
          checked={paymentMethod === 'bank_transfer'} 
          onChange={onChange} 
          label={<><i className="bi bi-bank" /><span><strong>Chuyển khoản ngân hàng</strong><small>Shop sẽ liên hệ gửi thông tin chuyển khoản</small></span></>} 
        />
        <Form.Check 
          type="radio" 
          id="payment-vnpay" 
          name="paymentMethod" 
          value="vnpay" 
          checked={paymentMethod === 'vnpay'} 
          onChange={onChange} 
          label={<><i className="bi bi-qr-code-scan" /><span><strong>Thanh toán qua VNPay</strong><small>Thẻ ATM, tài khoản ngân hàng hoặc VNPay QR</small></span></>} 
        />
      </div>
    </>
  );
}

PaymentMethods.propTypes = {
  paymentMethod: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
