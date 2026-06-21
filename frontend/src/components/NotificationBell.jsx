import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import useNotifications from '../hooks/useNotifications';

const TYPE_ICONS = {
  account_registered: 'bi-person-check',
  order_created:    'bi-bag-check',
  order_status:     'bi-box-seam',
  order_cancel_requested: 'bi-bag-x',
  return_requested: 'bi-arrow-counterclockwise',
  payment_success:  'bi-check-circle',
  payment_failed:   'bi-x-circle',
  payment_refunded: 'bi-arrow-return-left',
  password_changed: 'bi-shield-lock',
  stock_low:        'bi-exclamation-triangle',
  stock_out:        'bi-emoji-frown',
};

const TYPE_COLORS = {
  account_registered: 'notif-icon--success',
  order_created:    'notif-icon--brand',
  order_status:     'notif-icon--brand',
  payment_success:  'notif-icon--success',
  payment_failed:   'notif-icon--danger',
  payment_refunded: 'notif-icon--success',
  order_cancel_requested: 'notif-icon--warn',
  return_requested: 'notif-icon--warn',
  password_changed: 'notif-icon--warn',
  stock_low:        'notif-icon--warn',
  stock_out:        'notif-icon--danger',
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

function NotificationItem({ item, onRead, onRemove }) {
  const icon = TYPE_ICONS[item.type] || 'bi-bell';
  const colorClass = TYPE_COLORS[item.type] || 'notif-icon--brand';

  const handleClick = () => {
    if (!item.is_read) onRead(item.id);
  };

  return (
    <div
      className={`notif-item${item.is_read ? '' : ' notif-item--unread'}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <span className={`notif-icon ${colorClass}`}>
        <i className={`bi ${icon}`} />
      </span>
      <div className="notif-body">
        <p className="notif-title">{item.title}</p>
        <p className="notif-message">{item.message}</p>
        <span className="notif-time">{timeAgo(item.created_at)}</span>
      </div>
      <button
        type="button"
        className="notif-remove-btn"
        title="Xoá"
        onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
        aria-label="Xoá thông báo"
      >
        <i className="bi bi-x" />
      </button>
    </div>
  );
}

export default function NotificationBell() {
  const { items, unread, loading, open, setOpen, markRead, markAllRead, remove } = useNotifications();
  const ref = useRef(null);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [setOpen]);

  return (
    <div className="notif-bell-wrapper" ref={ref}>
      <button
        type="button"
        className={`notif-bell-btn header-icon-button${open ? ' is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={`Thông báo${unread ? ` (${unread} chưa đọc)` : ''}`}
      >
        <i className="bi bi-bell" />
        {unread > 0 && (
          <span className="notif-badge">{unread > 99 ? '99+' : unread}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown" role="dialog" aria-label="Danh sách thông báo">
          <div className="notif-header">
            <strong>Thông báo</strong>
            {unread > 0 && (
              <button type="button" className="notif-mark-all" onClick={markAllRead}>
                Đọc tất cả
              </button>
            )}
          </div>

          <div className="notif-list">
            {loading ? (
              <div className="notif-empty"><i className="bi bi-arrow-repeat spin" />Đang tải...</div>
            ) : items.length === 0 ? (
              <div className="notif-empty">
                <i className="bi bi-bell-slash" />
                <span>Không có thông báo nào</span>
              </div>
            ) : (
              items.map((item) => (
                <NotificationItem key={item.id} item={item} onRead={markRead} onRemove={remove} />
              ))
            )}
          </div>

          <div className="notif-footer">
            <NavLink to="/profile/notifications" onClick={() => setOpen(false)}>
              Xem tất cả & cài đặt
            </NavLink>
          </div>
        </div>
      )}
    </div>
  );
}

NotificationItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.number,
    type: PropTypes.string,
    title: PropTypes.string,
    message: PropTypes.string,
    is_read: PropTypes.number,
    created_at: PropTypes.string,
  }).isRequired,
  onRead: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};
