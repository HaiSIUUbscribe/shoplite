import { useCallback, useEffect, useState } from 'react';
import { orderService, productService } from '../services/api';

/**
 * Fetch đơn hàng của user hiện tại và danh sách product_id đã được đánh giá.
 * Trả về dữ liệu cùng với hàm đánh dấu sản phẩm vừa được review.
 */
export default function useUserOrders() {
  const [orders, setOrders] = useState([]);
  const [reviewedIds, setReviewedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ordersData, reviewedData] = await Promise.all([
        orderService.getMine(),
        productService.getMyReviewedProductIds().catch(() => ({ reviewedProductIds: [] })),
      ]);
      setOrders(ordersData);
      setReviewedIds(new Set(reviewedData.reviewedProductIds.map(Number)));
    } catch {
      setError('Không thể tải danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /** Gọi sau khi user đánh giá thành công để cập nhật UI ngay lập tức */
  const markAsReviewed = useCallback((productId) => {
    setReviewedIds((prev) => new Set([...prev, Number(productId)]));
  }, []);

  return {
    orders, reviewedIds, loading, error, markAsReviewed,
  };
}
