import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Form, Button, Container, Alert, Card, InputGroup, Spinner } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await login(email, password);
      setSuccess('Đăng nhập thành công! Đang chuyển hướng...');
      setTimeout(() => {
        navigate(location.state?.from || '/', { replace: true });
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Email hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-page d-flex align-items-center justify-content-center"
    >
      <Container style={{ maxWidth: '450px' }}>
        <Card className="auth-card border-0">
          <Card.Body className="p-4 p-sm-5">
            <h2 className="text-center fw-bold mb-4">Đăng Nhập</h2>

            {/* Hiển thị thông báo lỗi hoặc thành công */}
            {error && <Alert variant="danger" className="text-center fw-bold text-danger">{error}</Alert>}
            {success && <Alert variant="success" className="text-center fw-bold text-success">{success}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="email">
                <Form.Label>Email</Form.Label>
                <InputGroup>
                  <InputGroup.Text><i className="bi bi-envelope-fill"></i></InputGroup.Text>
                  <Form.Control
                    type="email"
                    placeholder="Nhập email của bạn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </InputGroup>
              </Form.Group>

              <Form.Group className="mb-4" controlId="password">
                <Form.Label>Mật khẩu</Form.Label>
                <InputGroup>
                  <InputGroup.Text><i className="bi bi-lock-fill"></i></InputGroup.Text>
                  <Form.Control
                    type="password"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </InputGroup>
              </Form.Group>

              <div className="text-end mb-4"><Link to="/forgot-password" className="small">Quên mật khẩu?</Link></div>

              <div className="d-grid">
                <Button variant="primary" type="submit" disabled={loading} size="lg">
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />
                      <span className="ms-2">Đang xử lý...</span>
                    </>
                  ) : (
                    'Đăng Nhập'
                  )}
                </Button>
              </div>
            </Form>

            <div className="text-center mt-4">
              <span className="text-muted">Chưa có tài khoản? </span>
              <Link to="/register">Đăng ký ngay</Link>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
