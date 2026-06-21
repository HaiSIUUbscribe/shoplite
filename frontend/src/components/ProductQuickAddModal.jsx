import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Form, Modal } from 'react-bootstrap';
import { formatCurrency } from '../utils/formatCurrency';

const COLOR_VALUES = {
  'đen': '#1f2421', 'trắng': '#ffffff', 'xám': '#9ca3af', 'xanh navy': '#263b59',
  'xanh': '#2f6f9f', 'đỏ': '#c9413b', 'hồng': '#df8fa3', 'nâu': '#7a5948',
  'be': '#d8c9aa', 'vàng': '#e7bd38', 'tím': '#76528b', 'cam': '#dd7a32',
};

export default function ProductQuickAddModal({ product, show, onHide, onAdd }) {
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '');
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || '');
  const [quantity, setQuantity] = useState(1);

  const outOfStock = Number(product.stock) <= 0;
  const hasDiscount = Number(product.originalPrice) > Number(product.price);

  const handleAdd = () => {
    onAdd({
      quantity,
      size: selectedSize || null,
      color: selectedColor || null
    });
  };

  return (
    <Modal show={show} onHide={onHide} centered className="quick-add-modal">
      <Modal.Header closeButton>
        <Modal.Title className="fs-5 text-truncate w-100 pe-3">{product.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex mb-4 gap-3">
          <div style={{ width: '80px', height: '80px', flexShrink: 0 }} className="bg-light rounded overflow-hidden">
            <img src={product.thumbnail} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <strong className="text-danger fs-5 d-block">{formatCurrency(Number(product.price) * quantity)}</strong>
            {hasDiscount && <span className="text-decoration-line-through text-muted small">{formatCurrency(Number(product.originalPrice) * quantity)}</span>}
            <div className="text-muted small mt-1">Kho: {product.stock}</div>
          </div>
        </div>

        {product.sizes?.length > 0 && (
          <div className="mb-3">
            <label className="fw-bold d-block mb-2 small">Kích thước</label>
            <div className="d-flex flex-wrap gap-2">
              {product.sizes.map(size => (
                <Button
                  key={size}
                  variant={selectedSize === size ? 'dark' : 'outline-dark'}
                  size="sm"
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>
        )}

        {product.colors?.length > 0 && (
          <div className="mb-3">
            <label className="fw-bold d-block mb-2 small">Màu sắc</label>
            <div className="d-flex flex-wrap gap-2">
              {product.colors.map(color => (
                <Button
                  key={color}
                  variant={selectedColor === color ? 'dark' : 'outline-dark'}
                  size="sm"
                  onClick={() => setSelectedColor(color)}
                  className="d-flex align-items-center gap-2"
                >
                  <span
                    style={{
                      width: '14px', height: '14px', borderRadius: '50%',
                      backgroundColor: COLOR_VALUES[color.toLowerCase()] || '#ccc',
                      border: '1px solid rgba(0,0,0,0.1)'
                    }}
                  />
                  {color}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-3">
          <label className="fw-bold d-block mb-2 small">Số lượng</label>
          <Form.Control
            type="number"
            min="1"
            max={product.stock}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, Number(e.target.value) || 1)))}
            style={{ maxWidth: '100px' }}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>Hủy</Button>
        <Button variant="success" onClick={handleAdd} disabled={outOfStock}>
          <i className="bi bi-cart-plus me-2" /> Thêm vào giỏ
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

ProductQuickAddModal.propTypes = {
  product: PropTypes.shape({
    title: PropTypes.string.isRequired,
    thumbnail: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    originalPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    stock: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    sizes: PropTypes.arrayOf(PropTypes.string),
    colors: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};
