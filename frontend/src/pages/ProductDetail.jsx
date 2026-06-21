import React from 'react';
import { Alert, Badge, Button, Col, Container, Row, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency';
import useProductDetail from '../hooks/useProductDetail';
import { AuthContext } from '../context/AuthContext';
import { FavoriteContext } from '../context/FavoriteContext';
import ProductGallery from '../components/product/ProductGallery';
import ProductVariantSelector from '../components/product/ProductVariantSelector';
import ProductActions from '../components/product/ProductActions';
import ProductReviews from '../components/product/ProductReviews';
import ProductVoucherOffer from '../components/product/ProductVoucherOffer';

export default function ProductDetail() {
  const { id } = useParams();
  const {
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
  } = useProductDetail(id);

  const { user } = React.useContext(AuthContext);
  const { favoriteIds, toggleFavorite } = React.useContext(FavoriteContext) || { favoriteIds: new Set(), toggleFavorite: () => {} };
  
  const isFavorited = product && favoriteIds.has(product.id);
  const navigate = require('react-router-dom').useNavigate;
  const location = require('react-router-dom').useLocation;
  const nav = navigate();
  const loc = location();

  const handleFavoriteClick = () => {
    if (!user) {
      nav('/login', { state: { from: loc.pathname + loc.search } });
      return;
    }
    toggleFavorite(product);
  };

  if (loading) return <div className="page-loader"><Spinner animation="border" /><span>Đang tải sản phẩm...</span></div>;
  if (error) return (
    <Container className="py-5">
      <Alert variant="warning">{error}</Alert>
      <Link to="/products" className="btn btn-outline-dark">Quay lại sản phẩm</Link>
    </Container>
  );

  const stock = Number(product.stock);
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const colors = Array.isArray(product.colors) ? product.colors : [];

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
          <ProductGallery
            gallery={gallery}
            activeImage={activeImage}
            onThumbClick={(i) => { setActiveImage(i); setImageFailed(false); }}
            imageFailed={imageFailed}
            onImageError={() => setImageFailed(true)}
            title={product.title}
            hasDiscount={discount.hasDiscount}
            discountPercent={discount.percent}
          />

          <div className="detail-trust-grid">
            <div><i className="bi bi-truck" /><div><strong>Giao hàng nhanh</strong><span>Toàn quốc 2-4 ngày</span></div></div>
            <div><i className="bi bi-arrow-repeat" /><div><strong>Đổi trả dễ</strong><span>Trong vòng 7 ngày</span></div></div>
            <div><i className="bi bi-shield-check" /><div><strong>Hàng chính hãng</strong><span>Đảm bảo 100%</span></div></div>
          </div>
        </Col>

        <Col lg={6}>
          <div className="detail-info-panel">
            {product.category && <Badge bg="light" text="dark" className="detail-category">{product.category}</Badge>}
            <div className="d-flex justify-content-between align-items-start">
              <h1 className="mb-0 pe-3">{product.title}</h1>
              <Button 
                variant="light" 
                className="rounded-circle d-flex align-items-center justify-content-center p-2 shadow-sm flex-shrink-0" 
                style={{ width: '48px', height: '48px' }}
                onClick={handleFavoriteClick}
                title={isFavorited ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
              >
                <i className={`bi ${isFavorited ? 'bi-heart-fill text-danger' : 'bi-heart'}`} style={{ fontSize: '1.4rem', marginTop: '2px' }} />
              </Button>
            </div>

            <div className="detail-rating-row" aria-hidden="true">
              {Array.from({ length: 5 }, (_, i) => (
                <i key={i} className={`bi ${i < Math.round(reviewStats.average) ? 'bi-star-fill' : 'bi-star'}`} />
              ))}
              <span>({reviewStats.count} đánh giá)</span>
            </div>

            <div className="detail-price-row">
              <p className="detail-price">{formatCurrency(Number(product.price) * quantity)}</p>
              {discount.hasDiscount && <span className="detail-price-original">{formatCurrency(Number(product.originalPrice) * quantity)}</span>}
              {quantity > 1 && <span className="detail-price-unit">{quantity} × {formatCurrency(Number(product.price))}</span>}
            </div>

            <p className="detail-description">{product.description || 'Thông tin sản phẩm đang được cập nhật.'}</p>

            <ProductVoucherOffer productId={product.id} />

            <ProductVariantSelector
              sizes={sizes}
              colors={colors}
              colorMap={COLOR_MAP}
              selectedSize={selectedSize}
              selectedColor={selectedColor}
              onSizeChange={setSelectedSize}
              onColorChange={setSelectedColor}
            />

            <ProductActions
              stock={stock}
              quantity={quantity}
              justAdded={justAdded}
              onQuantityChange={setQuantity}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
            />
          </div>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <div className="product-extended-details">
            <h2 className="extended-section-title">Chi tiết sản phẩm</h2>
            <table className="product-specs-table">
              <tbody>
                <tr>
                  <th>Danh mục</th>
                  <td>
                    <nav className="detail-breadcrumb d-inline p-0 m-0 bg-transparent">
                      <Link to="/">Trang chủ</Link>
                      <i className="bi bi-chevron-right mx-1" />
                      <Link to="/products">Sản phẩm</Link>
                      {product.category && (
                        <>
                          <i className="bi bi-chevron-right mx-1" />
                          <Link to={`/products?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
                        </>
                      )}
                    </nav>
                  </td>
                </tr>
                <tr><th>Kho hàng</th><td>{stock}</td></tr>
                <tr><th>Thương hiệu</th><td>OEM</td></tr>
                <tr><th>Xuất xứ</th><td>Việt Nam</td></tr>
                <tr><th>Gửi từ</th><td>Hà Nội</td></tr>
              </tbody>
            </table>

            <div className="mt-5 pt-4 border-top">
              <h4>Mô tả sản phẩm</h4>
              <div className="text-muted lh-lg" style={{ whiteSpace: 'pre-line' }}>{product.description}</div>
            </div>

            <ProductReviews productId={product.id} onStatsChange={setReviewStats} />
          </div>
        </Col>
      </Row>
    </Container>
  );
}
