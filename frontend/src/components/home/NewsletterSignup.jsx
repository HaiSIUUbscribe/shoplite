import React, { useEffect, useRef, useState } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import { newsletterService } from '../../services/api';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const resetTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  const updateEmail = (event) => {
    setEmail(event.target.value);
    setStatus('idle');
    setMessage('');
  };

  const submit = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailPattern.test(normalizedEmail)) {
      setStatus('error');
      setMessage('Email không hợp lệ.');
      return;
    }
    setLoading(true);
    setStatus('idle');
    setMessage('');
    try {
      const data = await newsletterService.subscribe(normalizedEmail);
      const nextStatus = data.status === 'duplicate' ? 'duplicate' : 'success';
      setStatus(nextStatus);
      setMessage(data.message || (nextStatus === 'success' ? 'Mã voucher đã được gửi qua email.' : 'Email này đã đăng ký trước đó.'));
      if (nextStatus === 'success') resetTimer.current = window.setTimeout(() => { setEmail(''); setStatus('idle'); setMessage(''); }, 4000);
    } catch (requestError) {
      setStatus('error');
      if (requestError.code === 'ECONNABORTED') {
        setMessage('Máy chủ email phản hồi quá chậm. Vui lòng thử lại sau.');
      } else {
        setMessage(requestError.response?.data?.message || 'Không thể kết nối máy chủ để đăng ký.');
      }
    } finally {
      setLoading(false);
    }
  };

  return <section className="newsletter-section" id="newsletter">
    <Container><div className="newsletter-inner">
      <div className="newsletter-copy"><span>Voucher dành cho thành viên mới</span><h2>Nhận mã giảm 10% qua email</h2><p>Giảm tối đa 100.000đ cho đơn từ 500.000đ. Mỗi email chỉ nhận một mã và mã có hiệu lực trong 30 ngày.</p></div>
      {status === 'success' ? <div className="newsletter-success" role="status" aria-live="polite"><i className="bi bi-check-circle-fill" /><span>{message}</span></div> : <div>
        <form className="newsletter-form" onSubmit={submit} noValidate><div className="newsletter-input-wrap"><i className="bi bi-envelope" /><input type="email" value={email} onChange={updateEmail} placeholder="Email của bạn" aria-label="Địa chỉ email" aria-invalid={status === 'error'} maxLength={190} disabled={loading} /></div><button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <><Spinner animation="border" size="sm" className="me-2" />Đang gửi...</> : 'Đăng ký'}</button></form>
        {message && <div className={`newsletter-message is-${status}`} role="status" aria-live="polite"><i className={`bi ${status === 'duplicate' ? 'bi-info-circle' : 'bi-exclamation-circle'}`} /><span>{message}</span></div>}
      </div>}
    </div></Container>
  </section>;
}
