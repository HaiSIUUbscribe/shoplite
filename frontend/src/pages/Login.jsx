import React, { useContext, useState } from 'react';
import { Alert, Button, Card, Container, Form, InputGroup, Spinner } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../context/AuthContext';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const googleLoginEnabled = Boolean(process.env.REACT_APP_GOOGLE_CLIENT_ID?.trim());

export default function Login() {
  const { login, socialLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState(location.state?.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next = { email: '', password: '' };
    if (!emailPattern.test(email.trim())) next.email = 'Email không hợp lệ.';
    if (!password) next.password = 'Vui lòng nhập mật khẩu.';
    setFieldErrors(next);
    return !next.email && !next.password;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email, password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Email hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      await socialLogin(credentialResponse.credential, 'google');
      navigate(location.state?.from || '/', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Đăng nhập Google thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page login-page">
      <Container className="auth-narrow">
        <Card className="auth-card">
          <Card.Body>
            <div className="auth-icon"><i className="bi bi-person" /></div>
            <h1>Đăng nhập</h1>
            <p className="auth-lead">Đăng nhập để thanh toán và theo dõi đơn hàng của bạn.</p>

            {error && <Alert variant="danger" className="auth-alert"><i className="bi bi-exclamation-triangle-fill me-2" />{error}</Alert>}

            <Form onSubmit={handleSubmit} noValidate>
              <Form.Group className="mb-3" controlId="login-email">
                <Form.Label>Email</Form.Label>
                <InputGroup className={fieldErrors.email ? 'is-invalid-group' : ''}>
                  <InputGroup.Text><i className="bi bi-envelope" /></InputGroup.Text>
                  <Form.Control
                    type="email"
                    placeholder="Nhập email của bạn"
                    value={email}
                    onChange={(event) => { setEmail(event.target.value); if (fieldErrors.email) setFieldErrors((current) => ({ ...current, email: '' })); }}
                    autoComplete="email"
                    autoFocus
                    isInvalid={Boolean(fieldErrors.email)}
                    disabled={loading}
                  />
                </InputGroup>
                {fieldErrors.email && <div className="auth-field-error">{fieldErrors.email}</div>}
              </Form.Group>

              <Form.Group className="mb-2" controlId="login-password">
                <Form.Label>Mật khẩu</Form.Label>
                <InputGroup className={fieldErrors.password ? 'is-invalid-group' : ''}>
                  <InputGroup.Text><i className="bi bi-lock" /></InputGroup.Text>
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(event) => { setPassword(event.target.value); if (fieldErrors.password) setFieldErrors((current) => ({ ...current, password: '' })); }}
                    autoComplete="current-password"
                    isInvalid={Boolean(fieldErrors.password)}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="outline-secondary"
                    className="auth-toggle-visibility"
                    onClick={() => setShowPassword((value) => !value)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                  </Button>
                </InputGroup>
                {fieldErrors.password && <div className="auth-field-error">{fieldErrors.password}</div>}
              </Form.Group>

              <div className="text-end mb-4"><Link to="/forgot-password" className="small">Quên mật khẩu?</Link></div>

              <Button type="submit" size="lg" className="w-100 auth-submit" disabled={loading}>
                {loading ? <><Spinner animation="border" size="sm" className="me-2" />Đang xử lý...</> : <><i className="bi bi-box-arrow-in-right me-2" />Đăng nhập</>}
              </Button>
            </Form>

            {googleLoginEnabled && <><div className="d-flex align-items-center my-3">
              <hr className="flex-grow-1" />
              <span className="mx-2 text-muted small">hoặc</span>
              <hr className="flex-grow-1" />
            </div>

            <div className="d-flex justify-content-center mb-4">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Đăng nhập Google thất bại.')}
                useOneTap
              />
            </div></>}

            <div className="login-register-link"><span>Chưa có tài khoản?</span><Link to="/register">Đăng ký ngay</Link></div>
          </Card.Body>
        </Card>
      </Container>
    </main>
  );
}
