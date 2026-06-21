export const orderStatuses = {
  pending: { label: 'Chờ xác nhận', color: 'warning', step: 0 },
  processing: { label: 'Đang chuẩn bị', color: 'info', step: 1 },
  shipping: { label: 'Đang giao', color: 'primary', step: 2 },
  done: { label: 'Đã giao', color: 'success', step: 3 },
  cancelled: { label: 'Đã hủy', color: 'danger', step: -1 },
};

export const orderStatusIcons = {
  pending: 'bi-clock-history',
  processing: 'bi-box-seam',
  shipping: 'bi-truck',
  done: 'bi-check-circle-fill',
  cancelled: 'bi-x-circle-fill',
};

export const deliverySteps = ['Đã đặt hàng', 'Đang chuẩn bị', 'Đang giao', 'Đã giao'];

export function formatOrderDate(createdAt, now = new Date()) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';

  const sameDay = date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.getFullYear() === yesterday.getFullYear()
    && date.getMonth() === yesterday.getMonth()
    && date.getDate() === yesterday.getDate();
  const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  if (sameDay) return `Hôm nay lúc ${time}`;
  if (isYesterday) return `Hôm qua lúc ${time}`;
  return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function estimatedDelivery(createdAt) {
  const start = new Date(createdAt);
  const end = new Date(createdAt);
  start.setDate(start.getDate() + 3);
  end.setDate(end.getDate() + 5);
  return `${start.toLocaleDateString('vi-VN')} - ${end.toLocaleDateString('vi-VN')}`;
}
