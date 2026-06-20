import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { productService, voucherService } from '../services/api';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, startBuyNow } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [justAdded, setJustAdded] = useState(false);
  const [voucherSaving, setVoucherSaving] = useState(false);
  const [voucherClaimStatus, setVoucherClaimStatus] = useState('idle');
  const [voucherClaimMessage, setVoucherClaimMessage] = useState('Nhận mã qua email, giảm tối đa 100.000đ');

  useEffect(() => {
    if (!user) return;
    try {
      const saved = JSON.parse(window.localStorage.getItem('shoplite_saved_voucher_v1') || 'null');
      if (saved?.userId === user.id && saved?.voucher?.code) {
        setVoucherClaimStatus('saved');
        setVoucherClaimMessage(`Đã lưu mã ${saved.voucher.code} để dùng khi thanh toán`);
      }
    } catch {
      window.localStorage.removeItem('shoplite_saved_voucher_v1');
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    productService.getById(id)
      .then((data) => {
        setProduct(data);
        setSelectedSize(data.sizes?.[0] || '');
        setSelectedColor(data.colors?.[0] || '');
        setActiveImage(0);
      })
      .catch((requestError) => setError(requestError.response?.status === 404 ? 'Sản phẩm không tồn tại hoặc đã ngừng bán.' : 'Không thể tải thông tin sản phẩm.'))
      .finally(() => setLoading(false));
  }, [id]);

  const gallery = useMemo(() => {
    if (!product) return [];
    const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : [];
    return product.thumbnail ? [product.thumbnail, ...images.filter((src) => src !== product.thumbnail)] : images;
  }, [product]);

  if (loading) return <div className="page-loader"><Spinner animation="border" /><span>Đang tải sản phẩm...</span></div>;
  if (error) return <Container className="py-5"><Alert variant="warning">{error}</Alert><Button as={Link} to="/products" variant="outline-dark">Quay lại sản phẩm</Button></Container>;

  const stock = Number(product.stock);
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const colors = Array.isArray(product.colors) ? product.colors : [];
  const selectedOptions = { size: selectedSize || null, color: selectedColor || null };
  const hasDiscount = Number(product.originalPrice) > Number(product.price);
  const discountPercent = hasDiscount
    ? Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)
    : 0;
  const colorValues = {
    'đen': '#1f2421', 'trắng': '#ffffff', 'xám': '#9ca3af', 'xanh navy': '#263b59',
    'xanh': '#2f6f9f', 'đỏ': '#c9413b', 'hồng': '#df8fa3', 'nâu': '#7a5948',
    'be': '#d8c9aa', 'vàng': '#e7bd38', 'tím': '#76528b', 'cam': '#dd7a32',
  };

  const buyNow = () => {
    if (startBuyNow(product, quantity, selectedOptions)) navigate('/checkout?mode=buy-now');
  };

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedOptions);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  };

  const claimVoucher = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    if (voucherClaimStatus === 'saved') return;

    setVoucherSaving(true);
    setVoucherClaimStatus('idle');
    try {
      const data = await voucherService.claim();
      window.localStorage.setItem('shoplite_saved_voucher_v1', JSON.stringify({
        userId: user.id,
        voucher: data.voucher,
      }));
      setVoucherClaimStatus('saved');
      setVoucherClaimMessage(`Đã lưu mã ${data.voucher.code} để dùng khi thanh toán`);
    } catch (requestError) {
      setVoucherClaimStatus('error');
      setVoucherClaimMessage(requestError.response?.data?.message || 'Không thể lưu voucher. Vui lòng thử lại.');
    } finally {
      setVoucherSaving(false);
    }
  };

  return (
    <Container className="product-detail-page">
      <nav className="detail-breadcrumb" aria-label="breadcrumb">
        <Link to="/">Trang chủ</Link>
        <i className="bi bi-chevron-right" />
        <Link to="/products">Sản phẩm</Link>
        {product.category && (
          <>
            <i className="bi bi-chevron-right" />
            <Link to={`/products?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
          </>
        )}
        <i className="bi bi-chevron-right" />
        <span>{product.title}</span>
      </nav>

      <div className="detail-back"><Link to="/products"><i className="bi bi-arrow-left" /> Trở lại danh sách</Link></div>

      <Row className="g-5">
        <Col lg={6}>
          <div className="detail-gallery">
            <div className="detail-media">
              {hasDiscount && <span className="detail-discount-flag">-{discountPercent}%</span>}
              {!imageFailed && gallery[activeImage] ? (
                <img src={gallery[activeImage]} alt={product.title} onError={() => setImageFailed(true)} />
              ) : (
                <i className="bi bi-image" />
              )}
            </div>
            {gallery.length > 1 && (
              <div className="detail-thumb-row">
                {gallery.map((src, index) => (
                  <button
                    type="button"
                    key={src + index}
                    className={`detail-thumb ${activeImage === index ? 'active' : ''}`}
                    onClick={() => { setActiveImage(index); setImageFailed(false); }}
                  >
                    <img src={src} alt={`${product.title} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="detail-trust-grid">
            <div><i className="bi bi-truck" /><div><strong>Giao hàng nhanh</strong><span>Toàn quốc 2-4 ngày</span></div></div>
            <div><i className="bi bi-arrow-repeat" /><div><strong>Đổi trả dễ</strong><span>Trong vòng 7 ngày</span></div></div>
            <div><i className="bi bi-shield-check" /><div><strong>Hàng chính hãng</strong><span>Đảm bảo 100%</span></div></div>
          </div>
        </Col>

        <Col lg={6}>
          <div className="detail-info-panel">
            {product.category && <Badge bg="light" text="dark" className="detail-category">{product.category}</Badge>}
            <h1>{product.title}</h1>

            <div className="detail-rating-row" aria-hidden="true">
              {Array.from({ length: 5 }, (_, index) => (
                <i key={index} className={`bi ${index < 4 ? 'bi-star-fill' : 'bi-star'}`} />
              ))}
              <span>({((Number(product.id) || 1) * 7) % 89 + 12} đánh giá)</span>
            </div>

            <div className="detail-price-row">
              <p className="detail-price">{formatCurrency(Number(product.price) * quantity)}</p>
              {hasDiscount && <span className="detail-price-original">{formatCurrency(Number(product.originalPrice) * quantity)}</span>}
              {quantity > 1 && <span className="detail-price-unit">{quantity} × {formatCurrency(Number(product.price))}</span>}
            </div>

            <p className="detail-description">{product.description || 'Thông tin sản phẩm đang được cập nhật.'}</p>

            <div className="detail-voucher-offer">
              <i className="bi bi-ticket-perforated" aria-hidden="true" />
              <div><strong>Voucher thành viên mới giảm 10%</strong><span className={voucherClaimStatus === 'error' ? 'is-error' : ''}>{voucherClaimMessage}</span></div>
              <Button type="button" variant="link" onClick={claimVoucher} disabled={voucherSaving || voucherClaimStatus === 'saved'}>
                {voucherSaving ? <Spinner animation="border" size="sm" /> : voucherClaimStatus === 'saved' ? 'Đã lưu' : 'Nhận mã'}
              </Button>
            </div>

            {sizes.length > 0 && (
              <div className="variant-selector">
                <div className="variant-heading"><span>Chọn size</span><strong>{selectedSize}</strong></div>
                <div className="size-options">
                  {sizes.map((size) => (
                    <button type="button" key={size} className={selectedSize === size ? 'active' : ''} onClick={() => setSelectedSize(size)}>{size}</button>
                  ))}
                </div>
              </div>
            )}

            {colors.length > 0 && (
              <div className="variant-selector">
                <div className="variant-heading"><span>Chọn màu</span><strong>{selectedColor}</strong></div>
                <div className="color-options">
                  {colors.map((color) => (
                    <button type="button" key={color} className={selectedColor === color ? 'active' : ''} onClick={() => setSelectedColor(color)}>
                      <span style={{ backgroundColor: colorValues[color.toLocaleLowerCase('vi')] || '#d5dbd8' }} />
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={`stock-line ${stock > 0 ? 'available' : 'unavailable'}`}>
              <i className={`bi ${stock > 0 ? 'bi-check-circle' : 'bi-x-circle'}`} />
              {stock > 0 ? `Còn ${stock} sản phẩm` : 'Tạm hết hàng'}
            </div>

            <div className="detail-actions">
              <Form.Control
                type="number"
                min="1"
                max={Math.max(stock, 1)}
                value={quantity}
                onChange={(event) => setQuantity(Math.max(1, Math.min(stock, Number(event.target.value) || 1)))}
                aria-label="Số lượng"
                disabled={stock <= 0}
              />
              <Button
                size="lg"
                variant="outline-success"
                className={`add-to-cart-button ${justAdded ? 'is-added' : ''}`}
                onClick={handleAddToCart}
                disabled={stock <= 0}
              >
                <i className={`bi ${justAdded ? 'bi-check-lg' : 'bi-cart-plus'} me-2`} />
                {justAdded ? 'Đã thêm' : 'Thêm vào giỏ'}
              </Button>
              <Button size="lg" className="buy-now-button" onClick={buyNow} disabled={stock <= 0}>
                <i className="bi bi-lightning-charge-fill me-2" />Mua ngay
              </Button>
            </div>

            <div className="purchase-notes">
              <span><i className="bi bi-truck" /> Giao hàng toàn quốc</span>
              <span><i className="bi bi-shield-check" /> Kiểm tra tồn kho tức thời</span>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
