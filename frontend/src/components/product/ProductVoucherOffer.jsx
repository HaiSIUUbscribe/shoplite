import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Spinner } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { voucherService } from '../../services/api';

export default function ProductVoucherOffer({ productId }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('Nhận mã qua email, giảm tối đa 100.000đ');

  useEffect(() => {
    if (!user) return;
    try {
      const saved = JSON.parse(window.localStorage.getItem('shoplite_saved_voucher_v1') || 'null');
      if (saved?.userId === user.id && saved?.voucher?.code) {
        setStatus('saved');
        setMessage(`Đã lưu mã ${saved.voucher.code} để dùng khi thanh toán`);
      }
    } catch {
      window.localStorage.removeItem('shoplite_saved_voucher_v1');
    }
  }, [user]);

  const claim = async () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    if (status === 'saved') return;
    setSaving(true);
    setStatus('idle');
    try {
      const data = await voucherService.claim();
      window.localStorage.setItem('shoplite_saved_voucher_v1', JSON.stringify({ userId: user.id, voucher: data.voucher }));
      setStatus('saved');
      setMessage(`Đã lưu mã ${data.voucher.code} để dùng khi thanh toán`);
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Không thể lưu voucher. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return <div className="detail-voucher-offer" data-product-id={productId}>
    <i className="bi bi-ticket-perforated" aria-hidden="true" />
    <div><strong>Voucher thành viên mới giảm 10%</strong><span className={status === 'error' ? 'is-error' : ''}>{message}</span></div>
    <Button type="button" variant="link" onClick={claim} disabled={saving || status === 'saved'}>{saving ? <Spinner animation="border" size="sm" /> : status === 'saved' ? 'Đã lưu' : 'Nhận mã'}</Button>
  </div>;
}

ProductVoucherOffer.propTypes = { productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired };
