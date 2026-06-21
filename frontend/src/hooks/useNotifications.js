import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { notificationService } from '../services/api';

const POLL_INTERVAL = 60_000; // poll count mỗi 60 giây

export default function useNotifications() {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);

  const fetchCount = useCallback(async () => {
    if (!user) return;
    try {
      const data = await notificationService.count();
      setUnread(data.unread);
    } catch { /* silent */ }
  }, [user]);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await notificationService.list();
      setItems(data.items);
      setUnread(data.unread);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [user]);

  // Poll unread count mỗi POLL_INTERVAL
  useEffect(() => {
    if (!user) return;
    fetchCount();
    timerRef.current = setInterval(fetchCount, POLL_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [user, fetchCount]);

  // Khi mở dropdown thì fetch đầy đủ
  useEffect(() => {
    if (open) fetchAll();
  }, [open, fetchAll]);

  const markRead = useCallback(async (id) => {
    await notificationService.markRead(id);
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: 1 } : n));
    setUnread((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationService.markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    setUnread(0);
  }, []);

  const remove = useCallback(async (id) => {
    await notificationService.deleteOne(id);
    const target = items.find((n) => n.id === id);
    setItems((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.is_read) setUnread((c) => Math.max(0, c - 1));
  }, [items]);

  return { items, unread, loading, open, setOpen, markRead, markAllRead, remove, fetchAll };
}
