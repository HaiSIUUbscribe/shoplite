import React, { useContext } from "react";
import { Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import PropTypes from 'prop-types';

import { CartContext } from "../context/CartContext";
import { formatCurrency } from "../utils/formatCurrency";
import "../index.css";

export default function ProductCard({ product }) {
  const { addToCart } = useContext(CartContext);

  const handleAdd = () => {
    addToCart(product, 1);
  };

  return (
    <Card className="h-100 shadow-sm border-0 product-card">
      <Link to={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
        <div className="overflow-hidden">
          <Card.Img
            variant="top"
            src={product.thumbnail}
            alt={product.title}
            className="product-img"
            style={{ height: "220px", objectFit: "cover" }}
          />
        </div>
      </Link>

      <Card.Body className="d-flex flex-column text-center">
        <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <Card.Title className="fw-semibold text-truncate">
            {product.title}
          </Card.Title>
        </Link>

        {/* Mô tả ngắn */}
        <Card.Text className="text-muted small mb-2">
          {product.description.length > 60
            ? product.description.slice(0, 60) + "..."
            : product.description}
        </Card.Text>

        {/* Giá */}
        <Card.Text className="text-danger fw-bold mb-3">
        {formatCurrency(product.price * 1000)}
        </Card.Text>

        {/* Nút thêm vào giỏ */}
        <Button
          variant="outline-primary"
          onClick={handleAdd}
          className="mt-auto px-3"
        >
          + Thêm vào giỏ hàng
        </Button>
      </Card.Body>
    </Card>
  );
}

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    thumbnail: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
  }).isRequired,
};