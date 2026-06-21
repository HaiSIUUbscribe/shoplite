import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Button, Form } from 'react-bootstrap';

const PLACEHOLDER = 'Chưa cập nhật';

function formatDate(value) {
  if (!value) return null;
  // date_of_birth từ DB dạng "YYYY-MM-DD" hoặc timestamp
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatJoinDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function InfoRow({ label, value }) {
  return (
    <div className="profile-info-row">
      <span className="profile-info-label">{label}</span>
      <span className={`profile-info-value${!value ? ' is-empty' : ''}`}>
        {value || PLACEHOLDER}
      </span>
    </div>
  );
}

export default function ProfileForm({ profile, onSave }) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', date_of_birth: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        date_of_birth: profile.date_of_birth
          ? String(profile.date_of_birth).slice(0, 10)
          : '',
      });
    }
  }, [profile]);

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const success = await onSave(form);
    setSubmitting(false);
    if (success) setEditMode(false);
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        date_of_birth: profile.date_of_birth ? String(profile.date_of_birth).slice(0, 10) : '',
      });
    }
    setEditMode(false);
  };

  if (!editMode) {
    return (
      <div>
        <div className="profile-info-grid">
          <InfoRow label="Họ và tên" value={profile?.name} />
          <InfoRow label="Email" value={profile?.email} />
          <InfoRow label="Số điện thoại" value={profile?.phone} />
          <InfoRow label="Ngày sinh" value={formatDate(profile?.date_of_birth)} />
          <InfoRow label="Ngày tham gia" value={formatJoinDate(profile?.created_at)} />
          <div className="profile-info-row">
            <span className="profile-info-label">Vai trò</span>
            <Badge bg={profile?.role === 'admin' ? 'warning' : 'secondary'} className="text-capitalize">
              {profile?.role}
            </Badge>
          </div>
        </div>
        <div className="d-flex justify-content-end mt-4">
          <Button variant="primary" onClick={() => setEditMode(true)}>
            <i className="bi bi-pencil-square me-1" />Chỉnh sửa
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form onSubmit={handleSubmit}>
      <div className="row g-3">
        <div className="col-md-6">
          <Form.Group controlId="pf-name">
            <Form.Label>Họ và tên</Form.Label>
            <Form.Control type="text" value={form.name} onChange={handleChange('name')} required />
          </Form.Group>
        </div>
        <div className="col-md-6">
          <Form.Group controlId="pf-email">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" value={form.email} onChange={handleChange('email')} required />
          </Form.Group>
        </div>
        <div className="col-md-6">
          <Form.Group controlId="pf-phone">
            <Form.Label>Số điện thoại</Form.Label>
            <Form.Control type="tel" value={form.phone} onChange={handleChange('phone')} placeholder="09xx xxx xxx" />
          </Form.Group>
        </div>
        <div className="col-md-6">
          <Form.Group controlId="pf-dob">
            <Form.Label>Ngày sinh</Form.Label>
            <Form.Control type="date" value={form.date_of_birth} onChange={handleChange('date_of_birth')} />
          </Form.Group>
        </div>
      </div>
      <div className="d-flex justify-content-end gap-2 mt-4">
        <Button variant="outline-secondary" onClick={handleCancel}>Hủy</Button>
        <Button variant="success" type="submit" disabled={submitting}>
          <i className="bi bi-save me-1" />{submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>
    </Form>
  );
}

ProfileForm.propTypes = {
  profile: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    date_of_birth: PropTypes.string,
    role: PropTypes.string,
    created_at: PropTypes.string,
  }),
  onSave: PropTypes.func.isRequired,
};

InfoRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
};
