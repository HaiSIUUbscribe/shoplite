import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';

export default function ChangePasswordForm({ onSubmit }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setSubmitting(true);
    const success = await onSubmit(form);
    setSubmitting(false);
    if (success) setForm({ current: '', next: '', confirm: '' });
  };

  return (
    <div className="mt-4 pt-4 border-top">
      <h3 className="fw-bold mb-1">
        <i className="bi bi-shield-lock me-2" />Bảo mật tài khoản
      </h3>
      <p className="text-muted">Đổi mật khẩu định kỳ để bảo vệ tài khoản và lịch sử đơn hàng.</p>

      {message.text && <Alert variant={message.type}>{message.text}</Alert>}

      <Form onSubmit={handleSubmit} className="password-form">
        <Form.Group>
          <Form.Label>Mật khẩu hiện tại</Form.Label>
          <Form.Control type="password" value={form.current} onChange={handleChange('current')} required />
        </Form.Group>
        <Form.Group>
          <Form.Label>Mật khẩu mới</Form.Label>
          <Form.Control type="password" minLength={8} value={form.next} onChange={handleChange('next')} required />
        </Form.Group>
        <Form.Group>
          <Form.Label>Xác nhận mật khẩu mới</Form.Label>
          <Form.Control type="password" minLength={8} value={form.confirm} onChange={handleChange('confirm')} required />
        </Form.Group>
        <Button type="submit" disabled={submitting}>
          {submitting ? <Spinner size="sm" /> : 'Đổi mật khẩu'}
        </Button>
      </Form>
    </div>
  );
}

ChangePasswordForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};
