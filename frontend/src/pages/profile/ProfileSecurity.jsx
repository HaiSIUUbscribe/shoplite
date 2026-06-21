import React from 'react';
import { Card } from 'react-bootstrap';
import { useOutletContext } from 'react-router-dom';
import ChangePasswordForm from '../../components/profile/ChangePasswordForm';

function SecurityStatusCard({ profile }) {
  const isLocalAccount = profile?.provider === 'local' || !profile?.provider;
  return (
    <div className="security-overview">
      <div className="security-item">
        <div className="security-item-icon security-item-icon--ok">
          <i className="bi bi-lock-fill" />
        </div>
        <div>
          <strong>Mật khẩu</strong>
          <span>{isLocalAccount ? 'Đã thiết lập' : 'Tài khoản mạng xã hội'}</span>
        </div>
        <span className={`security-status-badge ${isLocalAccount ? 'ok' : 'warn'}`}>
          {isLocalAccount ? 'Bảo mật' : 'Chưa đặt'}
        </span>
      </div>

      <div className="security-item">
        <div className="security-item-icon security-item-icon--warn">
          <i className="bi bi-phone" />
        </div>
        <div>
          <strong>Xác thực 2 bước (2FA)</strong>
          <span>Bảo vệ tài khoản tốt hơn qua SMS</span>
        </div>
        <span className="security-status-badge warn">Chưa bật</span>
      </div>

      <div className="security-item">
        <div className="security-item-icon security-item-icon--ok">
          <i className="bi bi-envelope-check" />
        </div>
        <div>
          <strong>Email đã xác minh</strong>
          <span>{profile?.email}</span>
        </div>
        <span className="security-status-badge ok">Xác minh</span>
      </div>
    </div>
  );
}

export default function ProfileSecurity() {
  const { profile, changePassword } = useOutletContext();

  return (
    <div className="d-flex flex-column gap-4">
      <Card className="profile-panel border-0">
        <Card.Body>
          <h2 className="profile-panel-title">
            <i className="bi bi-shield-check me-2" />Tổng quan bảo mật
          </h2>
          <SecurityStatusCard profile={profile} />
        </Card.Body>
      </Card>

      <Card className="profile-panel border-0">
        <Card.Body>
          <h2 className="profile-panel-title">
            <i className="bi bi-key me-2" />Đổi mật khẩu
          </h2>
          <p className="text-muted mb-4" style={{ fontSize: '.88rem' }}>
            Sử dụng ít nhất 8 ký tự bao gồm chữ hoa, chữ thường và số.
          </p>
          <ChangePasswordForm onSubmit={changePassword} />
        </Card.Body>
      </Card>
    </div>
  );
}
