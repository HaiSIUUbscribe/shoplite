import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import CategoryShowcase from '../components/home/CategoryShowcase';
import HomeHero from '../components/home/HomeHero';
import { FlashDeal, ServiceBand, TrustSections } from '../components/home/HomeHighlights';
import NewsletterSignup from '../components/home/NewsletterSignup';
import { productService } from '../services/api';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await productService.list({ sort: 'newest' });
      setProducts(data);
    } catch {
      setError('Chưa thể tải sản phẩm. Máy chủ có thể đang khởi động, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const categories = useMemo(() => {
    const grouped = new Map();
    products.forEach((product) => {
      if (!product.category) return;
      const current = grouped.get(product.category) || { name: product.category, count: 0, image: '' };
      current.count += 1;
      if (!current.image && product.thumbnail) current.image = product.thumbnail;
      grouped.set(product.category, current);
    });
    return [...grouped.values()].sort((a, b) => b.count - a.count).slice(0, 6);
  }, [products]);

  return <>
    <HomeHero loading={loading} products={products.filter((product) => product.thumbnail).slice(0, 3)} />
    <ServiceBand />
    <CategoryShowcase categories={categories} />
    <section className="product-section"><Container>
      <div className="section-heading"><div><span>Vừa lên kệ</span><h2>Sản phẩm mới nhất</h2></div><Button as={Link} to="/products" variant="outline-dark">Xem tất cả <i className="bi bi-arrow-right ms-2" /></Button></div>
      {error && <Alert variant="danger" className="d-flex align-items-center justify-content-between gap-3">
        <span>{error}</span>
        <Button variant="outline-danger" size="sm" onClick={loadProducts} disabled={loading}>
          Thử lại
        </Button>
      </Alert>}
      {!loading && !error && !products.length && <div className="empty-state"><i className="bi bi-box-seam" /><h3>Gian hàng đang được cập nhật</h3></div>}
      <Row className="g-4">{products.slice(0, 8).map((product) => <Col key={product.id} xl={3} md={4} sm={6}><ProductCard product={product} /></Col>)}</Row>
    </Container></section>
    <FlashDeal />
    <TrustSections />
    <NewsletterSignup />
  </>;
}
