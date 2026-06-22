import React, { useContext, useEffect, useRef, useState } from 'react';
import { Accordion, Alert, Button, Col, Container, Form, Modal, Row, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { contactService } from '../services/api';

const initialErrors = { name: '', email: '', phone: '', subject: '', orderId: '', message: '', attachments: '' };

const topicOptions = [
  { value: 'order', label: 'Đơn hàng', icon: 'bi-receipt' },
  { value: 'payment', label: 'Thanh toán', icon: 'bi-credit-card' },
  { value: 'returns', label: 'Đổi trả', icon: 'bi-arrow-repeat' },
  { value: 'product', label: 'Sản phẩm', icon: 'bi-box-seam' },
  { value: 'account', label: 'Tài khoản', icon: 'bi-person' },
  { value: 'other', label: 'Khác', icon: 'bi-three-dots' },
];

const allowedAttachmentTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxAttachmentSize = 5 * 1024 * 1024;

const channels = [
  { icon: 'bi-envelope', title: 'Email', value: 'support@shoplite.vn', href: 'mailto:support@shoplite.vn' },
  { icon: 'bi-telephone', title: 'Hotline', value: '1900 1234 (8:00 - 21:00)', href: 'tel:19001234' },
  { icon: 'bi-messenger', title: 'Facebook Messenger', value: 'Phản hồi nhanh nhất', href: 'https://m.me/shoplite.vn', external: true, badge: 'Mới' },
  { icon: 'bi-geo-alt', title: 'Văn phòng ShopLite', value: '123 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh' },
];

const workingHours = [
  ['Thứ 2 - Thứ 6', '08:00 - 21:00'],
  ['Thứ 7', '09:00 - 18:00'],
  ['Chủ nhật', '10:00 - 16:00'],
];

const faqs = [
  ['Thời gian giao hàng mất bao lâu?', 'Đơn hàng thường được giao trong 2-4 ngày làm việc, tùy khu vực nhận hàng.'],
  ['Tôi theo dõi đơn hàng ở đâu?', 'Đăng nhập và mở mục Đơn hàng của tôi để xem trạng thái xử lý, giao hàng và chi tiết từng đơn.'],
  ['ShopLite hỗ trợ đổi trả như thế nào?', 'Bạn có thể yêu cầu đổi trả trong vòng 7 ngày từ khi nhận hàng nếu sản phẩm lỗi hoặc không đúng mô tả.'],
  ['Tôi có thể thanh toán bằng cách nào?', 'ShopLite hỗ trợ thanh toán khi nhận hàng, chuyển khoản ngân hàng và VNPay.'],
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^(\+84|0)\d{9,10}$/;

export default function Contact() {
  const { user, authReady } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    subject: '',
    orderId: '',
    message: '',
  });
  const attachmentInputRef = useRef(null);
  const [attachments, setAttachments] = useState([]);
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

  useEffect(() => {
    if (!success) return undefined;
    const timer = window.setTimeout(() => setSuccess(''), 3000);
    return () => window.clearTimeout(timer);
  }, [success]);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: '' }));
  };

  const selectTopic = (subject) => {
    setForm((current) => ({ ...current, subject }));
    setErrors((current) => ({ ...current, subject: '' }));
  };

  const addAttachments = (fileList) => {
    const incoming = Array.from(fileList || []);
    const merged = [...attachments, ...incoming].filter((file, index, files) => (
      files.findIndex((candidate) => (
        candidate.name === file.name
        && candidate.size === file.size
        && candidate.lastModified === file.lastModified
      )) === index
    ));
    if (merged.length > 3) {
      setErrors((current) => ({ ...current, attachments: 'Chỉ được đính kèm tối đa 3 ảnh.' }));
      if (attachmentInputRef.current) attachmentInputRef.current.value = '';
      return;
    }
    if (merged.some((file) => !allowedAttachmentTypes.includes(file.type))) {
      setErrors((current) => ({ ...current, attachments: 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.' }));
      if (attachmentInputRef.current) attachmentInputRef.current.value = '';
      return;
    }
    if (merged.some((file) => file.size > maxAttachmentSize)) {
      setErrors((current) => ({ ...current, attachments: 'Mỗi ảnh không được vượt quá 5 MB.' }));
      if (attachmentInputRef.current) attachmentInputRef.current.value = '';
      return;
    }
    setAttachments(merged);
    setErrors((current) => ({ ...current, attachments: '' }));
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments((current) => current.filter((file, fileIndex) => fileIndex !== index));
    setErrors((current) => ({ ...current, attachments: '' }));
  };

  const validate = () => {
    const next = { ...initialErrors };
    if (!form.name.trim()) next.name = 'Vui lòng nhập họ tên.';
    if (!emailPattern.test(form.email.trim())) next.email = 'Email không hợp lệ.';
    if (form.phone.trim() && !phonePattern.test(form.phone.trim())) next.phone = 'Số điện thoại không hợp lệ.';
    if (!topicOptions.some((option) => option.value === form.subject)) next.subject = 'Vui lòng chọn chủ đề hỗ trợ.';
    if (form.orderId.trim() && !/^\d+$/.test(form.orderId.trim())) next.orderId = 'Mã đơn hàng chỉ gồm chữ số.';
    if (form.message.trim().length < 10) next.message = 'Nội dung cần ít nhất 10 ký tự.';
    setErrors(next);
    return Object.values(next).every((message) => !message);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!user) {
      setError('Vui lòng đăng nhập để gửi yêu cầu hỗ trợ.');
      return;
    }
    if (!validate()) return;

    setLoading(true);
    try {
      const data = await contactService.send(form, attachments);
      setSuccess(data.message || 'Yêu cầu của bạn đã được gửi thành công.');
      setForm((current) => ({ ...current, subject: '', orderId: '', message: '' }));
      setAttachments([]);
      if (attachmentInputRef.current) attachmentInputRef.current.value = '';
    } catch (requestError) {
      if (requestError.code === 'ECONNABORTED') {
        setError('Máy chủ email phản hồi quá chậm. Vui lòng thử lại sau.');
      } else {
        setError(requestError.response?.data?.message || 'Không thể kết nối máy chủ hỗ trợ. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="contact-page">
      <div className="contact-hero">
        <Container>
          <div className="contact-hero-inner">
            <button
              type="button"
              className="contact-hero-chat"
              title="Mở biểu mẫu hỗ trợ"
              aria-label="Mở biểu mẫu hỗ trợ"
              onClick={() => document.getElementById('contact-support-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <i className="bi bi-chat-dots-fill" />
            </button>
            <div className="contact-hero-copy">
              <span className="contact-hero-eyebrow">Hỗ trợ khách hàng</span>
              <h1>Chúng tôi có thể giúp gì cho bạn?</h1>
              <p>Trao đổi với đội ngũ hỗ trợ về đơn hàng, sản phẩm hoặc trải nghiệm mua sắm.</p>
              <div className="contact-hero-status" aria-label="Thông tin hỗ trợ">
                <span><i className="bi bi-clock" />Phản hồi trong 24h</span>
                <span><i className="bi bi-check-lg" />Hỗ trợ 7 ngày/tuần</span>
                <span><i className="bi bi-circle-fill" />Đang trực tuyến</span>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        <Row className="g-4 g-lg-5 contact-layout">
          <Col lg={5}>
            <div className="contact-sidebar">
              <section className="contact-side-card" aria-labelledby="contact-channels-title">
                <h2 id="contact-channels-title">Kênh liên hệ</h2>
                <div className="contact-channels">
                  {channels.map((channel) => {
                    const content = (
                      <>
                        <span className="contact-channel-icon"><i className={`bi ${channel.icon}`} /></span>
                        <div>
                          <strong>{channel.title}{channel.badge && <small className="contact-new-badge">{channel.badge}</small>}</strong>
                          <span>{channel.value}</span>
                        </div>
                        {channel.href && <i className="bi bi-chevron-right contact-channel-arrow" />}
                      </>
                    );
                    return channel.href ? (
                      <a
                        key={channel.title}
                        href={channel.href}
                        className="contact-channel"
                        target={channel.external ? '_blank' : undefined}
                        rel={channel.external ? 'noreferrer' : undefined}
                      >{content}</a>
                    ) : (
                      <div key={channel.title} className="contact-channel">{content}</div>
                    );
                  })}
                </div>

                <div className="contact-map">
                  <iframe
                    title="Bản đồ vị trí văn phòng ShopLite"
                    src="https://www.google.com/maps?q=123%20Nguyen%20Van%20Linh%2C%20Quan%207%2C%20Ho%20Chi%20Minh&output=embed"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </section>

              <section className="contact-side-card" aria-labelledby="working-hours-title">
                <h2 id="working-hours-title">Giờ làm việc</h2>
                <div className="working-hours-table">
                  {workingHours.map(([day, hours]) => <div key={day}><span>{day}</span><strong>{hours}</strong></div>)}
                </div>
                <p className="working-hours-note"><i className="bi bi-info-circle" />Ngoài giờ, hãy để lại tin nhắn để được phản hồi vào ca tiếp theo.</p>
              </section>

              <section className="contact-side-card contact-faq" aria-labelledby="contact-faq-title">
                <h2 id="contact-faq-title">Câu hỏi thường gặp</h2>
                <Accordion flush>
                  {faqs.map(([question, answer], index) => (
                    <Accordion.Item eventKey={String(index)} key={question}>
                      <Accordion.Header>{question}</Accordion.Header>
                      <Accordion.Body>{answer}</Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </section>
            </div>

            <div className="contact-note">
              <i className="bi bi-info-circle" />
              <p>Với khiếu nại về đơn hàng, hãy cung cấp mã đơn và ảnh thực tế để được xử lý nhanh hơn.</p>
            </div>
          </Col>

          <Col lg={7}>
            {!authReady ? (
              <section id="contact-support-form" className="contact-form contact-auth-gate" aria-live="polite">
                <Spinner animation="border" size="sm" role="status" />
                <p>Đang kiểm tra phiên đăng nhập...</p>
              </section>
            ) : !user ? (
              <section id="contact-support-form" className="contact-form contact-auth-gate">
                <div className="contact-auth-icon"><i className="bi bi-shield-lock" /></div>
                <h2>Đăng nhập để gửi yêu cầu</h2>
                <p>Thông tin tài khoản giúp ShopLite xác minh yêu cầu và hỗ trợ đơn hàng của bạn an toàn hơn.</p>
                <div className="contact-auth-actions">
                  <Button as={Link} to="/login" state={{ from: '/contact' }}>
                    <i className="bi bi-box-arrow-in-right me-2" />Đăng nhập
                  </Button>
                  <Link to="/register" state={{ from: '/contact' }}>Tạo tài khoản</Link>
                </div>
              </section>
            ) : (
              <Form id="contact-support-form" onSubmit={submit} className="contact-form" noValidate>
              <h2>Gửi yêu cầu hỗ trợ</h2>

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
                <Form.Label>Chủ đề yêu cầu</Form.Label>
                <div className="contact-topic-grid" role="group" aria-label="Chọn chủ đề hỗ trợ">
                  {topicOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={form.subject === option.value ? 'active' : ''}
                      aria-pressed={form.subject === option.value}
                      onClick={() => selectTopic(option.value)}
                      disabled={loading}
                    >
                      <i className={`bi ${option.icon}`} />{option.label}
                    </button>
                  ))}
                </div>
                {errors.subject && <div className="contact-field-error" role="alert">{errors.subject}</div>}
              </Form.Group>

              <Row className="g-3 mt-0">
                <Col md={6}>
                  <Form.Group className="mt-3">
                    <Form.Label>Mã đơn hàng <span className="contact-optional">(nếu có)</span></Form.Label>
                    <Form.Control
                      name="orderId"
                      inputMode="numeric"
                      value={form.orderId}
                      onChange={update}
                      placeholder="VD: 10234"
                      maxLength={20}
                      isInvalid={Boolean(errors.orderId)}
                      disabled={loading}
                    />
                    <Form.Control.Feedback type="invalid">{errors.orderId}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mt-3">
                    <Form.Label>Số điện thoại <span className="contact-optional">(không bắt buộc)</span></Form.Label>
                    <Form.Control name="phone" value={form.phone} onChange={update} placeholder="VD: 0901234567" isInvalid={Boolean(errors.phone)} disabled={loading} />
                    <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mt-3">
                <Form.Label>Nội dung</Form.Label>
                <Form.Control name="message" as="textarea" rows={5} value={form.message} onChange={update} isInvalid={Boolean(errors.message)} disabled={loading} required />
                <Form.Control.Feedback type="invalid">{errors.message}</Form.Control.Feedback>
                <div className="contact-message-hint">{form.message.trim().length}/10 ký tự tối thiểu</div>
              </Form.Group>

              <Form.Group className="mt-3">
                <Form.Label>Ảnh đính kèm <span className="contact-optional">(không bắt buộc)</span></Form.Label>
                <div
                  className={`contact-upload-zone ${errors.attachments ? 'is-invalid' : ''}`}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    addAttachments(event.dataTransfer.files);
                  }}
                >
                  <input
                    ref={attachmentInputRef}
                    id="contact-attachments"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(event) => addAttachments(event.target.files)}
                    disabled={loading}
                  />
                  <label htmlFor="contact-attachments">
                    <i className="bi bi-cloud-arrow-up" />
                    <strong>Kéo thả hoặc chọn ảnh</strong>
                    <span>JPG, PNG, WebP · tối đa 3 ảnh · 5 MB/ảnh</span>
                  </label>
                </div>
                {errors.attachments && <div className="contact-field-error" role="alert">{errors.attachments}</div>}
                {attachments.length > 0 && (
                  <div className="contact-attachment-list">
                    {attachments.map((file, index) => (
                      <div key={`${file.name}-${file.lastModified}`}>
                        <i className="bi bi-file-earmark-image" />
                        <span title={file.name}>{file.name}<small>{(file.size / 1024 / 1024).toFixed(1)} MB</small></span>
                        <button type="button" onClick={() => removeAttachment(index)} title="Xóa ảnh" aria-label={`Xóa ảnh ${file.name}`} disabled={loading}>
                          <i className="bi bi-x-lg" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Form.Group>

              <Button type="submit" size="lg" className="contact-submit" disabled={loading}>
                {loading ? (
                  <><Spinner size="sm" className="me-2" />Đang gửi...</>
                ) : (
                  <><i className="bi bi-send me-2" />Gửi yêu cầu</>
                )}
              </Button>
              </Form>
            )}
          </Col>
        </Row>
      </Container>

      <Modal
        show={Boolean(success)}
        onHide={() => setSuccess('')}
        centered
        backdrop="static"
        className="contact-success-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Gửi yêu cầu thành công</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <span className="contact-success-icon" aria-hidden="true">
            <i className="bi bi-check-lg" />
          </span>
          <h2>Cảm ơn bạn đã liên hệ ShopLite</h2>
          <p>{success}</p>
          <small>Thông báo sẽ tự động đóng sau vài giây.</small>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" onClick={() => setSuccess('')}>Đóng</Button>
        </Modal.Footer>
      </Modal>
    </main>
  );
}
