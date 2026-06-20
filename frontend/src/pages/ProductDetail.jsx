import React, { useContext, useEffect, useState } from 'react';
import { Alert, Badge, Button, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { productService } from '../services/api';
import { CartContext } from '../context/CartContext';
import { formatCurrency } from '../utils/formatCurrency';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, startBuyNow } = useContext(CartContext);
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setLoading(true);
    productService.getById(id)
      .then((data) => {
        setProduct(data);
        setSelectedSize(data.sizes?.[0] || '');
        setSelectedColor(data.colors?.[0] || '');
      })
      .catch((requestError) => setError(requestError.response?.status === 404 ? 'Sản phẩm không tồn tại hoặc đã ngừng bán.' : 'Không thể tải thông tin sản phẩm.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-loader"><Spinner animation="border" /><span>Đang tải sản phẩm...</span></div>;
  if (error) return <Container className="py-5"><Alert variant="warning">{error}</Alert><Button as={Link} to="/products" variant="outline-dark">Quay lại sản phẩm</Button></Container>;

  const stock = Number(product.stock);
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const colors = Array.isArray(product.colors) ? product.colors : [];
  const selectedOptions = { size: selectedSize || null, color: selectedColor || null };
  const colorValues = {
    'đen': '#1f2421', 'trắng': '#ffffff', 'xám': '#9ca3af', 'xanh navy': '#263b59',
    'xanh': '#2f6f9f', 'đỏ': '#c9413b', 'hồng': '#df8fa3', 'nâu': '#7a5948',
    'be': '#d8c9aa', 'vàng': '#e7bd38', 'tím': '#76528b', 'cam': '#dd7a32',
  };

  const buyNow = () => {
    if (startBuyNow(product, quantity, selectedOptions)) navigate('/checkout?mode=buy-now');
  };

  return (
    <Container className="product-detail-page">
      <div className="detail-back"><Link to="/products"><i className="bi bi-arrow-left" /> Trở lại danh sách</Link></div>
      <Row className="g-5 align-items-center">
        <Col lg={6}>
          <div className="detail-media">
            {!imageFailed && product.thumbnail ? <img src={product.thumbnail} alt={product.title} onError={() => setImageFailed(true)} /> : <i className="bi bi-image" />}
          </div>
        </Col>
        <Col lg={6}>
          {product.category && <Badge bg="light" text="dark" className="detail-category">{product.category}</Badge>}
          <h1>{product.title}</h1>
          <div className="detail-price-row"><p className="detail-price">{formatCurrency(Number(product.price) * quantity)}</p>{quantity > 1 && <span>{quantity} × {formatCurrency(Number(product.price))}</span>}</div>
          <p className="detail-description">{product.description || 'Thông tin sản phẩm đang được cập nhật.'}</p>
          {sizes.length > 0 && <div className="variant-selector"><div className="variant-heading"><span>Chọn size</span><strong>{selectedSize}</strong></div><div className="size-options">{sizes.map((size) => <button type="button" key={size} className={selectedSize === size ? 'active' : ''} onClick={() => setSelectedSize(size)}>{size}</button>)}</div></div>}
          {colors.length > 0 && <div className="variant-selector"><div className="variant-heading"><span>Chọn màu</span><strong>{selectedColor}</strong></div><div className="color-options">{colors.map((color) => <button type="button" key={color} className={selectedColor === color ? 'active' : ''} onClick={() => setSelectedColor(color)}><span style={{ backgroundColor: colorValues[color.toLocaleLowerCase('vi')] || '#d5dbd8' }} />{color}</button>)}</div></div>}
          <div className={`stock-line ${stock > 0 ? 'available' : 'unavailable'}`}><i className={`bi ${stock > 0 ? 'bi-check-circle' : 'bi-x-circle'}`} /> {stock > 0 ? `Còn ${stock} sản phẩm` : 'Tạm hết hàng'}</div>
          <div className="detail-actions">
            <Form.Control type="number" min="1" max={Math.max(stock, 1)} value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(stock, Number(event.target.value) || 1)))} aria-label="Số lượng" disabled={stock <= 0} />
            <Button size="lg" variant="outline-success" onClick={() => addToCart(product, quantity, selectedOptions)} disabled={stock <= 0}><i className="bi bi-cart-plus me-2" />Thêm vào giỏ</Button>
            <Button size="lg" className="buy-now-button" onClick={buyNow} disabled={stock <= 0}><i className="bi bi-lightning-charge-fill me-2" />Mua ngay</Button>
          </div>
          <div className="purchase-notes"><span><i className="bi bi-truck" /> Giao hàng toàn quốc</span><span><i className="bi bi-shield-check" /> Kiểm tra tồn kho tức thời</span></div>
        </Col>
      </Row>
    </Container>
  );
}
