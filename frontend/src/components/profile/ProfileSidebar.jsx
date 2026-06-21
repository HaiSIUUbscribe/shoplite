import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { AuthContext } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/profile',               end: true, icon: 'bi-person',          label: 'Thông tin cá nhân' },
  { to: '/profile/addresses',                icon: 'bi-geo-alt',         label: 'Địa chỉ giao hàng' },
  { to: '/profile/orders',                   icon: 'bi-bag',             label: 'Đơn hàng của tôi' },
  { to: '/profile/wishlist',                 icon: 'bi-heart',           label: 'Sản phẩm yêu thích' },
  { to: '/profile/security',                 icon: 'bi-shield-lock',     label: 'Bảo mật & mật khẩu' },
  { to: '/profile/notifications',            icon: 'bi-bell',            label: 'Thông báo' },
];

const LOGOUT_ITEM = { icon: 'bi-box-arrow-right', label: 'Đăng xuất', danger: true };

export default function ProfileSidebar({ profile }) {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="profile-sidebar" aria-label="Điều hướng tài khoản">
      <ul className="profile-nav-list">
        {NAV_ITEMS.map(({ to, end, icon, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) => `profile-nav-item${isActive ? ' is-active' : ''}`}
            >
              <i className={`bi ${icon}`} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}

        <li className="profile-nav-divider" role="separator" />

        <li>
          <button
            type="button"
            className="profile-nav-item profile-nav-item--danger"
            onClick={handleLogout}
          >
            <i className={`bi ${LOGOUT_ITEM.icon}`} aria-hidden="true" />
            <span>{LOGOUT_ITEM.label}</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

ProfileSidebar.propTypes = {
  profile: PropTypes.object,
};
