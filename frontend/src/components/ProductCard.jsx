import React, { useContext, useState } from 'react';
import { Badge, Button, Card } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { FavoriteContext } from '../context/FavoriteContext';
import { formatCurrency } from '../utils/formatCurrency';
import ProductQuickAddModal from './ProductQuickAddModal';

export default function ProductCard({ product }) {
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { favoriteIds, toggleFavorite } = useContext(FavoriteContext) || { favoriteIds: new Set(), toggleFavorite: () => {} };
  const navigate = useNavigate();
  const location = useLocation();
  const [imageFailed, setImageFailed] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const outOfStock = Number(product.stock) <= 0;
  const lowStock = !outOfStock && Number(product.stock) <= 5;
  const hasVariants = Boolean(product.sizes?.length || product.colors?.length);
  const hasDiscount = Number(product.originalPrice) > Number(product.price);
  const discountPercent = hasDiscount
    ? Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)
    : 0;

  const handleQuickAdd = async () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    const success = await addToCart(product);
    if (success) {
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 1400);
    }
  };

  const handleModalAdd = async ({ quantity, size, color }) => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    const success = await addToCart(product, quantity, { size, color });
    if (success) setShowModal(false);
  };

  const isFavorited = favoriteIds.has(product.id);

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    toggleFavorite(product);
  };

  return (
    <Card className="product-card h-100 border-0">
      <Link to={`/products/${product.id}`} className="product-media" aria-label={`Xem ${product.title}`}>
        {!imageFailed && product.thumbnail ? (
          <Card.Img src={product.thumbnail} alt={product.title} onError={() => setImageFailed(true)} loading="lazy" />
        ) : (
          <i className="bi bi-image" aria-hidden="true" />
        )}

        <div className="product-media-tags">
          {hasDiscount && <Badge className="discount-badge">-{discountPercent}%</Badge>}
          {outOfStock && <Badge className="stock-badge">Hết hàng</Badge>}
          {lowStock && <Badge className="lowstock-badge">Sắp hết</Badge>}
        </div>

        <span className="product-media-shine" aria-hidden="true" />

        <span className="product-quickview">
          <i className="bi bi-eye" /> Xem nhanh
        </span>
      </Link>

      <Button 
        variant="link" 
        className={`product-favorite-btn ${isFavorited ? 'active' : ''}`}
        onClick={handleFavoriteClick}
        title={isFavorited ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
        aria-label={isFavorited ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
      >
        <i className={`bi ${isFavorited ? 'bi-heart-fill text-danger' : 'bi-heart'}`} />
      </Button>

      <Card.Body className="d-flex flex-column p-3">
        {product.category && <span className="product-category">{product.category}</span>}

        <Card.Title as={Link} to={`/products/${product.id}`} className="product-title">
          {product.title}
        </Card.Title>

        <div className="product-rating" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => {
            const seed = (Number(product.id) || 0) % 5;
            const filled = index < 4 + (seed % 2 === 0 ? 1 : 0) - (index === 4 && seed % 3 === 0 ? 1 : 0);
            return <i key={index} className={`bi ${filled ? 'bi-star-fill' : 'bi-star'}`} />;
          })}
          <span className="product-rating-count">({((Number(product.id) || 1) * 7) % 89 + 12})</span>
        </div>

        <Card.Text className="product-description">
          {product.description || 'Sản phẩm chất lượng được tuyển chọn tại ShopLite.'}
        </Card.Text>

        <div className="product-card-footer mt-auto pt-2">
          <div className="product-price-block">
            <strong className="product-price">{formatCurrency(Number(product.price))}</strong>
            {hasDiscount && <span className="product-price-original">{formatCurrency(Number(product.originalPrice))}</span>}
          </div>

          {hasVariants ? (
            <Button
              className="icon-button variant-button"
              onClick={(e) => { e.preventDefault(); setShowModal(true); }}
              disabled={outOfStock}
              title={outOfStock ? 'Sản phẩm đã hết hàng' : 'Chọn size và màu'}
              aria-label={`Chọn phiên bản ${product.title}`}
            >
              <i className="bi bi-cart-plus" />
            </Button>
          ) : (
            <Button
              className={`icon-button add-button ${justAdded ? 'is-added' : ''}`}
              onClick={handleQuickAdd}
              disabled={outOfStock}
              title={outOfStock ? 'Sản phẩm đã hết hàng' : 'Thêm vào giỏ hàng'}
              aria-label={outOfStock ? 'Sản phẩm đã hết hàng' : `Thêm ${product.title} vào giỏ hàng`}
            >
              <i className={`bi ${justAdded ? 'bi-check-lg' : 'bi-cart-plus'}`} />
            </Button>
          )}
        </div>
      </Card.Body>

      {showModal && (
        <ProductQuickAddModal
          product={product}
          show={showModal}
          onHide={() => setShowModal(false)}
          onAdd={handleModalAdd}
        />
      )}
    </Card>
  );
}

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    thumbnail: PropTypes.string,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    category: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    originalPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    stock: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    sizes: PropTypes.arrayOf(PropTypes.string),
    colors: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
};
