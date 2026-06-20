import React, { useContext, useState } from 'react';
import { Badge, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { CartContext } from '../context/CartContext';
import { formatCurrency } from '../utils/formatCurrency';

export default function ProductCard({ product }) {
  const { addToCart } = useContext(CartContext);
  const [imageFailed, setImageFailed] = useState(false);
  const outOfStock = Number(product.stock) <= 0;
  const hasVariants = Boolean(product.sizes?.length || product.colors?.length);

  return (
    <Card className="product-card h-100 border-0">
      <Link to={`/products/${product.id}`} className="product-media" aria-label={`Xem ${product.title}`}>
        {!imageFailed && product.thumbnail ? (
          <Card.Img src={product.thumbnail} alt={product.title} onError={() => setImageFailed(true)} />
        ) : (
          <i className="bi bi-image" aria-hidden="true" />
        )}
        {outOfStock && <Badge bg="dark" className="stock-badge">Hết hàng</Badge>}
      </Link>
      <Card.Body className="d-flex flex-column p-3">
        {product.category && <span className="product-category">{product.category}</span>}
        <Card.Title as={Link} to={`/products/${product.id}`} className="product-title">
          {product.title}
        </Card.Title>
        <Card.Text className="product-description">
          {product.description || 'Sản phẩm chất lượng được tuyển chọn tại ShopLite.'}
        </Card.Text>
        <div className="d-flex justify-content-between align-items-center gap-2 mt-auto pt-2">
          <strong className="product-price">{formatCurrency(Number(product.price))}</strong>
          {hasVariants ? <Button as={Link} to={`/products/${product.id}`} variant="primary" className="icon-button" disabled={outOfStock} title={outOfStock ? 'Sản phẩm đã hết hàng' : 'Chọn size và màu'} aria-label={`Chọn phiên bản ${product.title}`}><i className="bi bi-sliders" /></Button> : <Button variant="primary" className="icon-button" onClick={() => addToCart(product)} disabled={outOfStock} title={outOfStock ? 'Sản phẩm đã hết hàng' : 'Thêm vào giỏ hàng'} aria-label={outOfStock ? 'Sản phẩm đã hết hàng' : `Thêm ${product.title} vào giỏ hàng`}><i className="bi bi-cart-plus" /></Button>}
        </div>
      </Card.Body>
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
    stock: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    sizes: PropTypes.arrayOf(PropTypes.string),
    colors: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
};
