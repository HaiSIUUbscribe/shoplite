import React, { useState } from 'react';
import { Alert, Button, Card, Container, Form, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { authService } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      setResult(await authService.forgotPassword(email));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể gửi yêu cầu đặt lại mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return <main className="auth-page">
    <Container className="auth-narrow">
      <Card className="auth-card"><Card.Body>
        <Link to="/login" className="auth-back"><i className="bi bi-arrow-left" /> Đăng nhập</Link>
        <div className="auth-icon"><i className="bi bi-key" /></div>
        <h1>Quên mật khẩu?</h1>
        <p className="auth-lead">Nhập email tài khoản để nhận liên kết đặt lại mật khẩu có hiệu lực trong 30 phút.</p>
        {error && <Alert variant="danger">{error}</Alert>}
        {result ? <Alert variant="success">{result.message}{result.resetUrl && <div className="mt-2"><a href={result.resetUrl}>Mở liên kết đặt lại mật khẩu trên máy local</a></div>}</Alert> : <Form onSubmit={submit}>
          <Form.Group controlId="forgot-email"><Form.Label>Email</Form.Label><Form.Control type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@example.com" autoComplete="email" required autoFocus /></Form.Group>
          <Button type="submit" size="lg" className="w-100 mt-4" disabled={loading}>{loading ? <><Spinner animation="border" size="sm" className="me-2" />Đang gửi...</> : 'Gửi liên kết đặt lại'}</Button>
        </Form>}
      </Card.Body></Card>
    </Container>
  </main>;
}
