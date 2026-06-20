import React, { useContext, useEffect, useState } from 'react';
import { Alert, Button, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { contactService } from '../services/api';

const initialErrors = { name: '', email: '', phone: '', subject: '', message: '' };

const channels = [
  { icon: 'bi-envelope', title: 'Email', value: 'support@shoplite.vn', href: 'mailto:support@shoplite.vn' },
  { icon: 'bi-telephone', title: 'Hotline', value: '1900 1234 (8:00 - 21:00)', href: 'tel:19001234' },
  { icon: 'bi-chat-dots', title: 'Biểu mẫu hỗ trợ', value: 'Gửi yêu cầu trực tiếp tại trang này' },
  { icon: 'bi-clock', title: 'Thời gian phản hồi', value: 'Trong vòng 24 giờ làm việc' },
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^(\+84|0)\d{9,10}$/;

export default function Contact() {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState(initialErrors);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      name: current.name || user.name || '',
      email: current.email || user.email || '',
    }));
  }, [user]);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: '' }));
  };

  const validate = () => {
    const next = { ...initialErrors };
    if (!form.name.trim()) next.name = 'Vui lòng nhập họ tên.';
    if (!emailPattern.test(form.email.trim())) next.email = 'Email không hợp lệ.';
    if (form.phone.trim() && !phonePattern.test(form.phone.trim())) next.phone = 'Số điện thoại không hợp lệ.';
    if (!form.subject.trim()) next.subject = 'Vui lòng nhập chủ đề.';
    if (form.message.trim().length < 10) next.message = 'Nội dung cần ít nhất 10 ký tự.';
    setErrors(next);
    return Object.values(next).every((message) => !message);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!validate()) return;

    setLoading(true);
    try {
      const data = await contactService.send(form);
      setSuccess(data.message || 'Yêu cầu của bạn đã được gửi thành công.');
      setForm((current) => ({ ...current, subject: '', message: '' }));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể gửi yêu cầu hỗ trợ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="contact-page">
      <div className="contact-hero">
        <Container>
          <div className="contact-hero-inner">
            <span className="contact-hero-eyebrow"><i className="bi bi-headset" /> ShopLite luôn lắng nghe</span>
            <h1>Chúng tôi có thể giúp gì cho bạn?</h1>
            <p>Trao đổi với đội ngũ hỗ trợ về đơn hàng, sản phẩm hoặc trải nghiệm mua sắm.</p>
          </div>
        </Container>
      </div>

      <Container>
        <Row className="g-4 g-lg-5 contact-layout">
          <Col lg={5}>
            <div className="contact-channels">
              {channels.map((channel) => {
                const content = (
                  <>
                    <span className="contact-channel-icon"><i className={`bi ${channel.icon}`} /></span>
                    <div>
                      <strong>{channel.title}</strong>
                      <span>{channel.value}</span>
                    </div>
                  </>
                );
                return channel.href ? (
                  <a key={channel.title} href={channel.href} className="contact-channel">{content}</a>
                ) : (
                  <div key={channel.title} className="contact-channel">{content}</div>
                );
              })}
            </div>

            <div className="contact-note">
              <i className="bi bi-info-circle" />
              <p>Với vấn đề về đơn hàng, hãy ghi mã đơn trong chủ đề để được hỗ trợ nhanh hơn.</p>
            </div>
          </Col>

          <Col lg={7}>
            <Form onSubmit={submit} className="contact-form" noValidate>
              <h2>Gửi yêu cầu hỗ trợ</h2>

              {success && <Alert variant="success" className="contact-alert"><i className="bi bi-check-circle-fill me-2" />{success}</Alert>}
              {error && <Alert variant="warning" className="contact-alert"><i className="bi bi-exclamation-triangle-fill me-2" />{error}</Alert>}

              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Họ tên</Form.Label>
                    <Form.Control name="name" value={form.name} onChange={update} isInvalid={Boolean(errors.name)} required />
                    <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Email</Form.Label>
                    <Form.Control name="email" type="email" value={form.email} onChange={update} isInvalid={Boolean(errors.email)} required />
                    <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mt-3">
                <Form.Label>Số điện thoại <span className="contact-optional">(không bắt buộc)</span></Form.Label>
                <Form.Control name="phone" value={form.phone} onChange={update} placeholder="VD: 0901234567" isInvalid={Boolean(errors.phone)} />
                <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mt-3">
                <Form.Label>Chủ đề</Form.Label>
                <Form.Control name="subject" value={form.subject} onChange={update} placeholder="Ví dụ: Hỗ trợ đơn hàng #123" isInvalid={Boolean(errors.subject)} required />
                <Form.Control.Feedback type="invalid">{errors.subject}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mt-3">
                <Form.Label>Nội dung</Form.Label>
                <Form.Control name="message" as="textarea" rows={5} value={form.message} onChange={update} isInvalid={Boolean(errors.message)} required />
                <Form.Control.Feedback type="invalid">{errors.message}</Form.Control.Feedback>
                <div className="contact-message-hint">{form.message.trim().length}/10 ký tự tối thiểu</div>
              </Form.Group>

              <Button type="submit" size="lg" className="contact-submit" disabled={loading}>
                {loading ? (
                  <><Spinner size="sm" className="me-2" />Đang gửi...</>
                ) : (
                  <><i className="bi bi-send me-2" />Gửi yêu cầu</>
                )}
              </Button>
            </Form>
          </Col>
        </Row>
      </Container>
    </main>
  );
}