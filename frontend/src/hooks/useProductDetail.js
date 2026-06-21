import { useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { productService } from '../services/api';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

/** Map tên màu tiếng Việt → mã hex để hiển thị swatch */
const COLOR_MAP = {
  'đen': '#1f2421', 'trắng': '#ffffff', 'xám': '#9ca3af', 'xanh navy': '#263b59',
  'xanh': '#2f6f9f', 'đỏ': '#c9413b', 'hồng': '#df8fa3', 'nâu': '#7a5948',
  'be': '#d8c9aa', 'vàng': '#e7bd38', 'tím': '#76528b', 'cam': '#dd7a32',
};

/**
 * Quản lý fetch sản phẩm, trạng thái chọn size/màu/số lượng,
 * và các action thêm giỏ / mua ngay.
 */
export default function useProductDetail(id) {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart, startBuyNow } = useContext(CartContext);
  const { user } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [reviewStats, setReviewStats] = useState({ average: 0, count: 0 });

  useEffect(() => {
    setLoading(true);
    setError('');
    productService.getById(id)
      .then((data) => {
        setProduct(data);
        setSelectedSize(data.sizes?.[0] || '');
        setSelectedColor(data.colors?.[0] || '');
        setActiveImage(0);
        setImageFailed(false);
      })
      .catch((requestError) => {
        setError(
          requestError.response?.status === 404
            ? 'Sản phẩm không tồn tại hoặc đã ngừng bán.'
            : 'Không thể tải thông tin sản phẩm.'
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  const gallery = useMemo(() => {
    if (!product) return [];
    const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : [];
    return product.thumbnail
      ? [product.thumbnail, ...images.filter((src) => src !== product.thumbnail)]
      : images;
  }, [product]);

  const discount = useMemo(() => {
    if (!product) return { hasDiscount: false, percent: 0 };
    const original = Number(product.originalPrice);
    const current = Number(product.price);
    const hasDiscount = original > current;
    return {
      hasDiscount,
      percent: hasDiscount ? Math.round(((original - current) / original) * 100) : 0,
    };
  }, [product]);

  const requireAuth = () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return false;
    }
    return true;
  };

  const handleAddToCart = async () => {
    if (!requireAuth()) return;
    const selectedOptions = { size: selectedSize || null, color: selectedColor || null };
    const success = await addToCart(product, quantity, selectedOptions);
    if (success) {
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 1600);
    }
  };

  const handleBuyNow = () => {
    if (!requireAuth()) return;
    const selectedOptions = { size: selectedSize || null, color: selectedColor || null };
    if (startBuyNow(product, quantity, selectedOptions)) navigate('/checkout?mode=buy-now');
  };

  return {
    product, loading, error,
    gallery, discount, COLOR_MAP,
    selectedSize, setSelectedSize,
    selectedColor, setSelectedColor,
    quantity, setQuantity,
    activeImage, setActiveImage,
    imageFailed, setImageFailed,
    justAdded,
    reviewStats, setReviewStats,
    handleAddToCart, handleBuyNow,
  };
}
