import React, { useContext, useEffect, useState } from 'react';
import { Card, Col, Row, Spinner, Alert } from 'react-bootstrap';
import { favoriteService } from '../../services/api';
import ProductCard from '../../components/ProductCard';
import { FavoriteContext } from '../../context/FavoriteContext';

export default function ProfileWishlist() {
  const { favoriteIds } = useContext(FavoriteContext);
  const [fetchedProducts, setFetchedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    favoriteService.getMine()
      .then((data) => setFetchedProducts(data))
      .catch(() => setError('Không thể tải danh sách yêu thích.'))
      .finally(() => setLoading(false));
  }, []);

  // Lọc chỉ giữ lại các sản phẩm vẫn còn trong danh sách yêu thích
  const products = fetchedProducts.filter(p => favoriteIds.has(p.id));

  return (
    <Card className="profile-panel border-0">
      <Card.Body>
        <h2 className="profile-panel-title mb-4">
          <i className="bi bi-heart-fill text-danger me-2" />Sản phẩm yêu thích
        </h2>

        {loading ? (
          <div className="page-loader py-5">
            <Spinner animation="border" /><span>Đang tải...</span>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : products.length === 0 ? (
          <div className="empty-state mt-4">
            <i className="bi bi-heart" />
            <h3>Chưa có sản phẩm yêu thích</h3>
            <p>Nhấn vào biểu tượng trái tim trên sản phẩm để lưu vào danh sách này.</p>
          </div>
        ) : (
          <Row className="g-3">
            {products.map((product) => (
              <Col lg={4} md={6} sm={6} xs={6} key={product.id}>
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
        )}
      </Card.Body>
    </Card>
  );
}
