import React from 'react';
import PropTypes from 'prop-types';
import { Button, Form } from 'react-bootstrap';

export default function ProductActions({ stock, quantity, justAdded, onQuantityChange, onAddToCart, onBuyNow }) {
  return (
    <>
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
          onChange={(e) => onQuantityChange(Math.max(1, Math.min(stock, Number(e.target.value) || 1)))}
          aria-label="Số lượng"
          disabled={stock <= 0}
        />
        <Button
          size="lg"
          variant="outline-success"
          className={`add-to-cart-button ${justAdded ? 'is-added' : ''}`}
          onClick={onAddToCart}
          disabled={stock <= 0}
        >
          <i className={`bi ${justAdded ? 'bi-check-lg' : 'bi-cart-plus'} me-2`} />
          {justAdded ? 'Đã thêm' : 'Thêm vào giỏ'}
        </Button>
        <Button size="lg" className="buy-now-button" onClick={onBuyNow} disabled={stock <= 0}>
          <i className="bi bi-lightning-charge-fill me-2" />Mua ngay
        </Button>
      </div>

      <div className="purchase-notes">
        <span><i className="bi bi-truck" /> Giao hàng toàn quốc</span>
        <span><i className="bi bi-shield-check" /> Kiểm tra tồn kho tức thời</span>
      </div>
    </>
  );
}

ProductActions.propTypes = {
  stock: PropTypes.number.isRequired,
  quantity: PropTypes.number.isRequired,
  justAdded: PropTypes.bool.isRequired,
  onQuantityChange: PropTypes.func.isRequired,
  onAddToCart: PropTypes.func.isRequired,
  onBuyNow: PropTypes.func.isRequired,
};
