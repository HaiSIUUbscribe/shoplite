import React, { useState } from 'react';
import { Alert, Button, Card, Container, Form, Spinner } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../services/api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setLoading(true);
    try {
      const data = await authService.resetPassword(token, password);
      setSuccess(data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể đặt lại mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return <main className="auth-page">
    <Container className="auth-narrow">
      <Card className="auth-card"><Card.Body>
        <div className="auth-icon"><i className="bi bi-shield-lock" /></div>
        <h1>Tạo mật khẩu mới</h1>
        <p className="auth-lead">Sử dụng ít nhất 8 ký tự và không dùng lại mật khẩu cũ.</p>
        {!token && <Alert variant="danger">Liên kết đặt lại mật khẩu không hợp lệ.</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}
        {success ? <Alert variant="success">{success}<div className="mt-3"><Button as={Link} to="/login">Đăng nhập</Button></div></Alert> : token && <Form onSubmit={submit}>
          <Form.Group className="mb-3" controlId="reset-password"><Form.Label>Mật khẩu mới</Form.Label><Form.Control type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required /></Form.Group>
          <Form.Group controlId="reset-confirm"><Form.Label>Xác nhận mật khẩu</Form.Label><Form.Control type="password" minLength={8} value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" required /></Form.Group>
          <Button type="submit" size="lg" className="w-100 mt-4" disabled={loading}>{loading ? <><Spinner animation="border" size="sm" className="me-2" />Đang xử lý...</> : 'Đặt lại mật khẩu'}</Button>
        </Form>}
      </Card.Body></Card>
    </Container>
  </main>;
}
