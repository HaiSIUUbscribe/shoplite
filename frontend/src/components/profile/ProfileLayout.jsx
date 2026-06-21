import React from 'react';
import { Container, Spinner } from 'react-bootstrap';
import { Outlet } from 'react-router-dom';
import useProfile from '../../hooks/useProfile';
import ProfileHeader from './ProfileHeader';
import ProfileSidebar from './ProfileSidebar';

/**
 * Layout shell cho toàn bộ khu vực tài khoản.
 * Hiển thị ProfileHeader (avatar + stats) và Sidebar điều hướng cố định.
 * Nội dung từng tab được render qua <Outlet />.
 */
export default function ProfileLayout() {
  const {
    profile, orderStats, loading,
    saveProfile, changePassword,
  } = useProfile();

  if (loading) {
    return (
      <div className="page-loader">
        <Spinner animation="border" /><span>Đang tải thông tin tài khoản...</span>
      </div>
    );
  }

  return (
    <Container className="profile-page">
      <ProfileHeader profile={profile} orderStats={orderStats} />

      <div className="profile-layout">
        <aside className="profile-sidebar-col">
          <ProfileSidebar profile={profile} />
        </aside>
        <main className="profile-content-col">
          {/* Pass shared state xuống các page con qua Outlet context */}
          <Outlet context={{ profile, orderStats, saveProfile, changePassword }} />
        </main>
      </div>
    </Container>
  );
}
