import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { Container, Row, Col, Button, Image, Badge } from "react-bootstrap";
import { CartContext } from "../context/CartContext";
import { formatCurrency } from "../utils/formatCurrency";
import "bootstrap-icons/font/bootstrap-icons.css";

const ProductDetail = () => {
  const { addToCart } = useContext(CartContext);
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetch(`https://dummyjson.com/products/${id}`)
      .then((res) => res.json())
      .then((data) => setProduct(data))
      .catch((err) => console.error(err));
  }, [id]);

  if (!product) {
    return <p className="text-center mt-5">Đang tải thông tin sản phẩm...</p>;
  }

  const handleAdd = () => {
    addToCart(product, 1);
  };

  return (
    <Container className="my-5">
      <Row className="align-items-center">
        <Col md={6} className="text-center mb-4 mb-md-0">
          <Image
            src={product.thumbnail}
            alt={product.title}
            fluid
            style={{
              maxHeight: "400px",
              objectFit: "contain",
              borderRadius: "12px",
              boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
            }}
          />
        </Col>

        {/* Thông tin sản phẩm */}
        <Col md={6}>
          <h2 className="fw-bold">{product.title}</h2>
          <p className="text-muted">{product.description}</p>

          <div className="mb-3">
            <h4 className="text-danger fw-bold">
              {formatCurrency(product.price * 1000)}
            </h4>
            <Badge bg="success" className="me-2">
              <i className="bi bi-star-fill me-1"></i> {product.rating}
            </Badge>
            <Badge bg="info">{product.category}</Badge>
          </div>

          <p className="mb-1">
            <strong>Thương hiệu:</strong> {product.brand}
          </p>
          <p className="mb-1">
            <strong>Còn lại:</strong> {product.stock} sản phẩm
          </p>

          <Button
            variant="primary"
            size="lg"
            className="mt-3 d-flex align-items-center"
            onClick={handleAdd}
          >
            <i className="bi bi-cart-plus me-2"></i> Thêm vào giỏ hàng
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductDetail;
