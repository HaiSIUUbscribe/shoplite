import React from 'react';
import { Alert, Card } from 'react-bootstrap';
import { useOutletContext } from 'react-router-dom';
import ProfileForm from '../../components/profile/ProfileForm';

export default function ProfileInfo() {
  const { profile, saveProfile } = useOutletContext();

  return (
    <Card className="profile-panel border-0">
      <Card.Body>
        <h2 className="profile-panel-title">
          <i className="bi bi-person me-2" />Thông tin cá nhân
        </h2>
        {!profile
          ? <Alert variant="warning">Không tìm thấy thông tin tài khoản.</Alert>
          : <ProfileForm profile={profile} onSave={saveProfile} />
        }
      </Card.Body>
    </Card>
  );
}
