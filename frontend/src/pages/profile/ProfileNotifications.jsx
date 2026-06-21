import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Badge, Card, Form, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import { notificationService } from '../../services/api';

const TYPE_META = {
  account_registered: { label: 'Đăng ký tài khoản', icon: 'bi-person-check', color: 'success' },
  password_changed: { label: 'Thay đổi bảo mật', icon: 'bi-shield-lock', color: 'warning' },
  order_created: { label: 'Đơn hàng mới', icon: 'bi-bag-check', color: 'success' },
  order_status: { label: 'Tiến trình đơn hàng', icon: 'bi-box-seam', color: 'primary' },
  order_cancel_requested: { label: 'Yêu cầu huỷ đơn', icon: 'bi-bag-x', color: 'warning' },
  return_requested: { label: 'Yêu cầu đổi trả', icon: 'bi-arrow-counterclockwise', color: 'warning' },
  payment_success: { label: 'Thanh toán thành công', icon: 'bi-check-circle', color: 'success' },
  payment_failed: { label: 'Thanh toán thất bại', icon: 'bi-x-circle', color: 'danger' },
  payment_refunded: { label: 'Hoàn tiền', icon: 'bi-arrow-return-left', color: 'info' },
  stock_low: { label: 'Tồn kho thấp', icon: 'bi-exclamation-triangle', color: 'warning' },
  stock_out: { label: 'Hết hàng', icon: 'bi-box-seam', color: 'danger' },
};

const DEFAULT_SETTINGS = {
  stock_low_threshold: 10,
  payment_failure_threshold: 5,
  payment_failure_window_minutes: 10,
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function buildPreferences(types, rows) {
  const result = Object.fromEntries(types.map((type) => [type, { enabled: true, email_enabled: true }]));
  rows.forEach((row) => {
    if (result[row.type]) {
      result[row.type] = {
        enabled: Boolean(row.enabled),
        email_enabled: Boolean(row.email_enabled),
      };
    }
  });
  return result;
}

export default function ProfileNotifications() {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';
  const [items, setItems] = useState([]);
  const [types, setTypes] = useState([]);
  const [prefs, setPrefs] = useState({});
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const requests = [notificationService.list(), notificationService.getPreferences()];
      if (isAdmin) requests.push(notificationService.getSettings());
      const [notificationData, preferenceData, operationsSettings] = await Promise.all(requests);
      setItems(notificationData.items);
      setTypes(preferenceData.types);
      setPrefs(buildPreferences(preferenceData.types, preferenceData.preferences));
      if (operationsSettings) setSettings(operationsSettings);
    } catch {
      toast.error('Không thể tải cài đặt thông báo.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  const unreadCount = useMemo(() => items.filter((item) => !item.is_read).length, [items]);

  const handleMarkRead = async (id) => {
    await notificationService.markRead(id);
    setItems((current) => current.map((item) => item.id === id ? { ...item, is_read: 1 } : item));
  };

  const handleMarkAll = async () => {
    await notificationService.markAllRead();
    setItems((current) => current.map((item) => ({ ...item, is_read: 1 })));
  };

  const handleRemove = async (id) => {
    await notificationService.deleteOne(id);
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const togglePreference = (type, channel) => {
    setPrefs((current) => ({
      ...current,
      [type]: { ...current[type], [channel]: !current[type][channel] },
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const preferences = types.map((type) => ({ type, ...prefs[type] }));
      const requests = [notificationService.setPreferences(preferences)];
      if (isAdmin) requests.push(notificationService.setSettings(settings));
      await Promise.all(requests);
      toast.success('Đã lưu cài đặt thông báo.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể lưu cài đặt thông báo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border" size="sm" /></div>;

  return (
    <div className="d-flex flex-column gap-4">
      <Card className="profile-panel border-0">
        <Card.Body>
          <div className="d-flex align-items-center justify-content-between mb-4">
            <h2 className="profile-panel-title mb-0">
              <i className="bi bi-bell me-2" />Thông báo
              {unreadCount > 0 && <Badge bg="danger" className="ms-2 notif-count-badge">{unreadCount}</Badge>}
            </h2>
            {unreadCount > 0 && <button type="button" className="address-action-btn" onClick={handleMarkAll}>Đọc tất cả</button>}
          </div>

          {items.length === 0 ? (
            <div className="empty-state py-3"><i className="bi bi-bell-slash" /><h3>Chưa có thông báo</h3><p>Các cập nhật quan trọng sẽ xuất hiện tại đây.</p></div>
          ) : (
            <div className="notif-page-list">
              {items.map((item) => {
                const meta = TYPE_META[item.type] || { label: 'Thông báo', color: 'secondary' };
                return (
                  <div key={item.id} className={`notif-page-item${item.is_read ? '' : ' notif-page-item--unread'}`}>
                    <Badge bg={meta.color} className="notif-page-badge">{meta.label}</Badge>
                    <div className="notif-page-body"><strong>{item.title}</strong><p>{item.message}</p><span>{timeAgo(item.created_at)}</span></div>
                    <div className="notif-page-actions">
                      {!item.is_read && <button type="button" className="address-action-btn" onClick={() => handleMarkRead(item.id)}>Đã đọc</button>}
                      <button type="button" className="address-action-btn address-action-btn--danger" onClick={() => handleRemove(item.id)} title="Xoá thông báo"><i className="bi bi-trash" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card.Body>
      </Card>

      <Card className="profile-panel border-0">
        <Card.Body>
          <h2 className="profile-panel-title"><i className="bi bi-sliders me-2" />Kênh nhận thông báo</h2>
          <p className="text-muted notif-settings-description">Bật hoặc tắt thông báo trong ứng dụng và email cho từng nhóm sự kiện.</p>
          <div className="notif-pref-head"><span>Loại thông báo</span><span>Ứng dụng</span><span>Email</span></div>
          <div className="notif-pref-list">
            {types.map((type) => {
              const meta = TYPE_META[type] || { label: type, icon: 'bi-bell' };
              return (
                <div key={type} className="notif-pref-item">
                  <div className="notif-pref-label"><i className={`bi ${meta.icon}`} /><span>{meta.label}</span></div>
                  <Form.Check type="switch" id={`pref-app-${type}`} checked={prefs[type]?.enabled !== false} onChange={() => togglePreference(type, 'enabled')} aria-label={`${meta.label} trong ứng dụng`} />
                  <Form.Check type="switch" id={`pref-email-${type}`} checked={prefs[type]?.email_enabled !== false} onChange={() => togglePreference(type, 'email_enabled')} aria-label={`${meta.label} qua email`} />
                </div>
              );
            })}
          </div>
        </Card.Body>
      </Card>

      {isAdmin && (
        <Card className="profile-panel border-0">
          <Card.Body>
            <h2 className="profile-panel-title"><i className="bi bi-gear me-2" />Ngưỡng cảnh báo vận hành</h2>
            <div className="notif-operations-grid">
              <Form.Group><Form.Label>Cảnh báo khi tồn kho dưới</Form.Label><Form.Control type="number" min="1" max="100000" value={settings.stock_low_threshold} onChange={(event) => setSettings((current) => ({ ...current, stock_low_threshold: Number(event.target.value) }))} /></Form.Group>
              <Form.Group><Form.Label>Số lỗi thanh toán</Form.Label><Form.Control type="number" min="2" max="100" value={settings.payment_failure_threshold} onChange={(event) => setSettings((current) => ({ ...current, payment_failure_threshold: Number(event.target.value) }))} /></Form.Group>
              <Form.Group><Form.Label>Trong khoảng (phút)</Form.Label><Form.Control type="number" min="1" max="1440" value={settings.payment_failure_window_minutes} onChange={(event) => setSettings((current) => ({ ...current, payment_failure_window_minutes: Number(event.target.value) }))} /></Form.Group>
            </div>
            <p className="notif-operations-note"><i className="bi bi-info-circle" />SMS khẩn được gửi khi tồn kho về 0 hoặc lỗi thanh toán đạt ngưỡng.</p>
          </Card.Body>
        </Card>
      )}

      <div className="d-flex justify-content-end">
        <button type="button" className="btn btn-primary" disabled={saving} onClick={save}>
          {saving ? <Spinner size="sm" className="me-2" /> : <i className="bi bi-save me-2" />}Lưu cài đặt
        </button>
      </div>
    </div>
  );
}
