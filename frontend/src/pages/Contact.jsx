import React, { useContext, useEffect, useState } from 'react';
import { Alert, Button, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { contactService } from '../services/api';

export default function Contact() {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { if (user) setForm((current) => ({ ...current, name: current.name || user.name || '', email: current.email || user.email || '' })); }, [user]);
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError(''); setSuccess('');
    try { const data = await contactService.send(form); setSuccess(data.message); setForm((current) => ({ ...current, subject: '', message: '' })); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Không thể gửi yêu cầu hỗ trợ.'); }
    finally { setLoading(false); }
  };
  return <main className="contact-page"><Container><div className="contact-heading"><span>ShopLite luôn lắng nghe</span><h1>Chúng tôi có thể giúp gì cho bạn?</h1><p>Trao đổi với đội ngũ hỗ trợ về đơn hàng, sản phẩm hoặc trải nghiệm mua sắm.</p></div><Row className="g-5"><Col lg={5}><div className="contact-channels"><a href="mailto:support@shoplite.vn"><i className="bi bi-envelope" /><div><strong>Email</strong><span>support@shoplite.vn</span></div></a><div><i className="bi bi-chat-dots" /><div><strong>Biểu mẫu hỗ trợ</strong><span>Gửi yêu cầu trực tiếp tại trang này</span></div></div><div><i className="bi bi-clock" /><div><strong>Thời gian phản hồi</strong><span>Trong vòng 24 giờ làm việc</span></div></div></div><div className="contact-note"><i className="bi bi-info-circle" /><p>Với vấn đề về đơn hàng, hãy ghi mã đơn trong chủ đề để được hỗ trợ nhanh hơn.</p></div></Col><Col lg={7}><Form onSubmit={submit} className="contact-form"><h2>Gửi yêu cầu hỗ trợ</h2>{success && <Alert variant="success">{success}</Alert>}{error && <Alert variant="warning">{error}</Alert>}<Row><Col md={6}><Form.Group><Form.Label>Họ tên</Form.Label><Form.Control name="name" value={form.name} onChange={update} required /></Form.Group></Col><Col md={6}><Form.Group><Form.Label>Email</Form.Label><Form.Control name="email" type="email" value={form.email} onChange={update} required /></Form.Group></Col></Row><Form.Group><Form.Label>Số điện thoại</Form.Label><Form.Control name="phone" value={form.phone} onChange={update} /></Form.Group><Form.Group><Form.Label>Chủ đề</Form.Label><Form.Control name="subject" value={form.subject} onChange={update} placeholder="Ví dụ: Hỗ trợ đơn hàng #123" required /></Form.Group><Form.Group><Form.Label>Nội dung</Form.Label><Form.Control name="message" as="textarea" rows={5} value={form.message} onChange={update} required /></Form.Group><Button type="submit" size="lg" disabled={loading}>{loading ? <><Spinner size="sm" className="me-2" />Đang gửi...</> : <><i className="bi bi-send me-2" />Gửi yêu cầu</>}</Button></Form></Col></Row></Container></main>;
}
