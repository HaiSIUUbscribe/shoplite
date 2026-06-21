import { useCallback, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { orderService, userService } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const PROCESSING_STATUSES = new Set(['pending', 'processing', 'shipping']);

function computeOrderStats(orders) {
  return {
    total: orders.length,
    spending: orders.reduce((sum, o) => sum + Number(o.total || 0), 0),
    processing: orders.filter((o) => PROCESSING_STATUSES.has(o.status)).length,
  };
}

/**
 * Quản lý fetch và cập nhật thông tin tài khoản.
 * Trả về profile data, form handlers và danh sách user (admin only).
 */
export default function useProfile() {
  const { updateUser, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [orderStats, setOrderStats] = useState({ total: 0, spending: 0, processing: 0 });
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const [profileData, orders] = await Promise.all([
        userService.getProfile(),
        orderService.getMine().catch(() => []),
      ]);
      setProfile(profileData.user);
      setOrderStats(computeOrderStats(orders));
    } catch {
      toast.error('Không thể tải thông tin tài khoản.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const saveProfile = async (formData) => {
    try {
      const data = await userService.updateProfile(formData);
      updateUser(data.user);
      setProfile(data.user);
      toast.success('Cập nhật thông tin thành công!');
      return true;
    } catch {
      toast.error('Cập nhật thất bại. Vui lòng thử lại.');
      return false;
    }
  };

  const changePassword = async ({ current, next, confirm }) => {
    if (next !== confirm) {
      toast.error('Mật khẩu xác nhận không khớp.');
      return false;
    }
    try {
      const data = await userService.changePassword(current, next);
      toast.success(data.message);
      if (data.reauthenticate) await logout();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể đổi mật khẩu.');
      return false;
    }
  };

  return {
    profile, orderStats, loading,
    saveProfile, changePassword,
  };
}
