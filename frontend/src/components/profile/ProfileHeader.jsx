import React from 'react';
import PropTypes from 'prop-types';
import { formatCurrency } from '../../utils/formatCurrency';

const ROLE_LABELS = {
  admin: { label: 'Admin', bg: '#d99614', color: '#2a1c00' },
  client: { label: 'Client', bg: 'rgba(255,255,255,0.18)', color: '#fff' },
};

function getInitials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((word) => word[0].toUpperCase()).join('');
}

function AvatarInitials({ name }) {
  return (
    <div className="profile-avatar" aria-hidden="true">
      {getInitials(name) || '?'}
    </div>
  );
}

function RoleBadge({ role }) {
  const config = ROLE_LABELS[role] || { label: role, bg: 'rgba(255,255,255,0.18)', color: '#fff' };
  return (
    <span className="profile-role-badge" style={{ background: config.bg, color: config.color }}>
      {config.label}
    </span>
  );
}

function ProfileMeta({ email, createdAt }) {
  const joinDate = createdAt
    ? new Date(createdAt).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="profile-meta">
      {joinDate && (
        <span><i className="bi bi-calendar3" />Thành viên từ {joinDate}</span>
      )}
      {email && (
        <span><i className="bi bi-envelope" />{email}</span>
      )}
    </div>
  );
}

function StatItem({ value, label, highlight }) {
  return (
    <div className={`profile-stat${highlight ? ' profile-stat--highlight' : ''}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

/**
 * Header tài khoản: avatar initials, tên, role badge, email + ngày tham gia,
 * và stats bar 3 chỉ số ngay dưới.
 */
export default function ProfileHeader({ profile, orderStats }) {
  const { name = '', email = '', role = 'client', created_at } = profile || {};

  return (
    <div className="profile-header">
      <div className="profile-header-top">
        <AvatarInitials name={name} />
        <div className="profile-header-info">
          <div className="profile-header-name">
            <h1>{name || 'Tài khoản'}</h1>
            <RoleBadge role={role} />
          </div>
          <ProfileMeta email={email} createdAt={created_at} />
        </div>
      </div>

      <div className="profile-stats">
        <StatItem value={orderStats.total} label="Tổng đơn hàng" />
        <StatItem value={formatCurrency(orderStats.spending)} label="Tổng chi tiêu" />
        <StatItem value={orderStats.processing} label="Đang xử lý" highlight />
      </div>
    </div>
  );
}

ProfileHeader.propTypes = {
  profile: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    role: PropTypes.string,
    created_at: PropTypes.string,
  }),
  orderStats: PropTypes.shape({
    total: PropTypes.number.isRequired,
    spending: PropTypes.number.isRequired,
    processing: PropTypes.number.isRequired,
  }).isRequired,
};

AvatarInitials.propTypes = { name: PropTypes.string.isRequired };
RoleBadge.propTypes = { role: PropTypes.string.isRequired };
ProfileMeta.propTypes = { email: PropTypes.string, createdAt: PropTypes.string };
StatItem.propTypes = { value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired, label: PropTypes.string.isRequired, highlight: PropTypes.bool };
