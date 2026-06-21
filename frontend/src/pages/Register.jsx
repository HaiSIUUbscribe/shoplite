import React, { useContext, useMemo, useState } from 'react';
import { Alert, Button, Card, Container, Form, InputGroup, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../context/AuthContext';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const initialFieldErrors = { name: '', email: '', password: '', confirmPassword: '' };
const googleLoginEnabled = Boolean(process.env.REACT_APP_GOOGLE_CLIENT_ID?.trim());

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '' };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score: 1, label: 'Yếu' };
  if (score <= 3) return { score: 2, label: 'Trung bình' };
  return { score: 3, label: 'Mạnh' };
}

export default function Register() {
  const { register, socialLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState(initialFieldErrors);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const clearFieldError = (field) => {
    if (fieldErrors[field]) setFieldErrors((current) => ({ ...current, [field]: '' }));
  };

  const validate = () => {
    const next = { ...initialFieldErrors };
    if (!name.trim()) next.name = 'Vui lòng nhập họ và tên.';
    if (!emailPattern.test(email.trim())) next.email = 'Email không hợp lệ.';
    if (password.length < 8) next.password = 'Mật khẩu cần ít nhất 8 ký tự.';
    if (confirmPassword !== password) next.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    setFieldErrors(next);
    return Object.values(next).every((message) => !message);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!validate()) return;

    setLoading(true);
    try {
      await register(name, email, password);
      setSuccess('Đăng ký thành công. Đang chuyển đến trang đăng nhập...');
      setTimeout(() => navigate('/login', { state: { email, password } }), 1500);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      await socialLogin(credentialResponse.credential, 'google');
      navigate('/');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Đăng nhập Google thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page register-page">
      <Container className="auth-narrow">
        <Card className="auth-card">
          <Card.Body>
            <div className="auth-icon"><i className="bi bi-person-plus" /></div>
            <h1>Tạo tài khoản</h1>
            <p className="auth-lead">Đăng ký để lưu giỏ hàng và quản lý đơn mua thuận tiện hơn.</p>

            {error && <Alert variant="danger" className="auth-alert"><i className="bi bi-exclamation-triangle-fill me-2" />{error}</Alert>}
            {success && <Alert variant="success" className="auth-alert"><i className="bi bi-check-circle-fill me-2" />{success}</Alert>}

            <Form onSubmit={handleSubmit} noValidate>
              <Form.Group className="mb-3" controlId="register-name">
                <Form.Label>Họ và tên</Form.Label>
                <InputGroup className={fieldErrors.name ? 'is-invalid-group' : ''}>
                  <InputGroup.Text><i className="bi bi-person" /></InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Nhập họ và tên"
                    value={name}
                    onChange={(event) => { setName(event.target.value); clearFieldError('name'); }}
                    autoComplete="name"
                    isInvalid={Boolean(fieldErrors.name)}
                    disabled={loading}
                  />
                </InputGroup>
                {fieldErrors.name && <div className="auth-field-error">{fieldErrors.name}</div>}
              </Form.Group>

              <Form.Group className="mb-3" controlId="register-email">
                <Form.Label>Email</Form.Label>
                <InputGroup className={fieldErrors.email ? 'is-invalid-group' : ''}>
                  <InputGroup.Text><i className="bi bi-envelope" /></InputGroup.Text>
                  <Form.Control
                    type="email"
                    placeholder="Nhập email"
                    value={email}
                    onChange={(event) => { setEmail(event.target.value); clearFieldError('email'); }}
                    autoComplete="email"
                    isInvalid={Boolean(fieldErrors.email)}
                    disabled={loading}
                  />
                </InputGroup>
                {fieldErrors.email && <div className="auth-field-error">{fieldErrors.email}</div>}
              </Form.Group>

              <Form.Group className="mb-2" controlId="register-password">
                <Form.Label>Mật khẩu</Form.Label>
                <InputGroup className={fieldErrors.password ? 'is-invalid-group' : ''}>
                  <InputGroup.Text><i className="bi bi-lock" /></InputGroup.Text>
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Tối thiểu 8 ký tự"
                    value={password}
                    onChange={(event) => { setPassword(event.target.value); clearFieldError('password'); }}
                    autoComplete="new-password"
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
                {password && !fieldErrors.password && (
                  <div className="password-strength">
                    <div className="password-strength-bars">
                      <span className={strength.score >= 1 ? `active level-${strength.score}` : ''} />
                      <span className={strength.score >= 2 ? `active level-${strength.score}` : ''} />
                      <span className={strength.score >= 3 ? `active level-${strength.score}` : ''} />
                    </div>
                    <span className={`password-strength-label level-${strength.score}`}>{strength.label}</span>
                  </div>
                )}
              </Form.Group>

              <Form.Group className="mb-4" controlId="register-confirm-password">
                <Form.Label>Xác nhận mật khẩu</Form.Label>
                <InputGroup className={fieldErrors.confirmPassword ? 'is-invalid-group' : ''}>
                  <InputGroup.Text><i className="bi bi-shield-lock" /></InputGroup.Text>
                  <Form.Control
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={(event) => { setConfirmPassword(event.target.value); clearFieldError('confirmPassword'); }}
                    autoComplete="new-password"
                    isInvalid={Boolean(fieldErrors.confirmPassword)}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="outline-secondary"
                    className="auth-toggle-visibility"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                  </Button>
                </InputGroup>
                {fieldErrors.confirmPassword && <div className="auth-field-error">{fieldErrors.confirmPassword}</div>}
              </Form.Group>

              <Button type="submit" size="lg" className="w-100 auth-submit" disabled={loading}>
                {loading ? <><Spinner animation="border" size="sm" className="me-2" />Đang tạo tài khoản...</> : <><i className="bi bi-person-check me-2" />Đăng ký</>}
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
              />
            </div></>}

            <div className="login-register-link"><span>Đã có tài khoản?</span><Link to="/login">Đăng nhập</Link></div>
          </Card.Body>
        </Card>
      </Container>
    </main>
  );
}
