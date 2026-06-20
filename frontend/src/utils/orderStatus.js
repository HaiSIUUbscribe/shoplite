export const orderStatuses = {
  pending: { label: 'Chờ xác nhận', color: 'warning', step: 0 },
  processing: { label: 'Đang chuẩn bị', color: 'info', step: 1 },
  shipping: { label: 'Đang giao', color: 'primary', step: 2 },
  done: { label: 'Đã giao', color: 'success', step: 3 },
  cancelled: { label: 'Đã hủy', color: 'danger', step: -1 },
};

export const deliverySteps = ['Đã đặt hàng', 'Đang chuẩn bị', 'Đang giao', 'Đã giao'];

export function estimatedDelivery(createdAt) {
  const start = new Date(createdAt);
  const end = new Date(createdAt);
  start.setDate(start.getDate() + 3);
  end.setDate(end.getDate() + 5);
  return `${start.toLocaleDateString('vi-VN')} - ${end.toLocaleDateString('vi-VN')}`;
}
