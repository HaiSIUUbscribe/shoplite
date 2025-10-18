import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Container, Alert, Card, InputGroup, Spinner } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function Register() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Mật khẩu không khớp. Vui lòng thử lại.');
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
      setSuccess('🎉 Đăng ký thành công! Đang chuyển đến trang đăng nhập...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-light d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Container style={{ maxWidth: '450px' }}>
        <Card className="shadow-lg border-0 rounded-4">
          <Card.Body className="p-4 p-sm-5">
            <h2 className="text-center fw-bold mb-4">Tạo Tài Khoản</h2>

            {error && <Alert variant="danger" className="text-center">{error}</Alert>}
            {success && (
              <Alert 
                variant="success" 
                className="text-center fw-bold" 
                style={{ color: '#198754', backgroundColor: '#e8f5e9', border: '1px solid #c1e1c1' }}
              >
                {success}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="name">
                <Form.Label>Tên của bạn</Form.Label>
                <InputGroup>
                  <InputGroup.Text><i className="bi bi-person-fill"></i></InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Nhập họ và tên"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </InputGroup>
              </Form.Group>

              <Form.Group className="mb-3" controlId="email">
                <Form.Label>Email</Form.Label>
                <InputGroup>
                  <InputGroup.Text><i className="bi bi-envelope-fill"></i></InputGroup.Text>
                  <Form.Control
                    type="email"
                    placeholder="Nhập email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </InputGroup>
              </Form.Group>

              <Form.Group className="mb-3" controlId="password">
                <Form.Label>Mật khẩu</Form.Label>
                <InputGroup>
                  <InputGroup.Text><i className="bi bi-lock-fill"></i></InputGroup.Text>
                  <Form.Control
                    type="password"
                    placeholder="Tạo mật khẩu"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </InputGroup>
              </Form.Group>

              <Form.Group className="mb-4" controlId="confirmPassword">
                <Form.Label>Xác nhận mật khẩu</Form.Label>
                <InputGroup>
                  <InputGroup.Text><i className="bi bi-lock-fill"></i></InputGroup.Text>
                  <Form.Control
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </InputGroup>
              </Form.Group>

              <div className="d-grid">
                <Button variant="primary" type="submit" disabled={loading} size="lg">
                  {loading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      <span className="ms-2">Đang tạo tài khoản...</span>
                    </>
                  ) : (
                    'Đăng Ký'
                  )}
                </Button>
              </div>
            </Form>

            <div className="text-center mt-4">
              <span className="text-muted">Đã có tài khoản? </span>
              <Link to="/login">Đăng nhập</Link>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
