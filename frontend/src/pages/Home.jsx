import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Carousel, Col, Container, Row, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { productService } from '../services/api';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { productService.list({ sort: 'newest' }).then(setProducts).catch(() => setError('Chưa thể tải sản phẩm. Vui lòng thử lại sau.')).finally(() => setLoading(false)); }, []);
  const heroProducts = products.filter((product) => product.thumbnail).slice(0, 3);
  const categories = useMemo(() => [...new Set(products.map((product) => product.category).filter(Boolean))].slice(0, 6), [products]);

  return <>
    <section className="home-hero" aria-label="Sản phẩm nổi bật">
      {loading ? <div className="hero-loading"><Spinner animation="border" variant="light" /></div> : heroProducts.length ? <Carousel fade interval={5500} pause="hover">
        {heroProducts.map((product, index) => <Carousel.Item key={product.id}><div className="hero-slide" style={{ backgroundImage: `url(${JSON.stringify(product.thumbnail).slice(1, -1)})` }}><div className="hero-shade" /><Container className="hero-copy"><span>{index === 0 ? 'Lựa chọn mới tại ShopLite' : product.category || 'Được yêu thích'}</span><h1>{index === 0 ? 'Mua sắm nhẹ nhàng. Nhận hàng an tâm.' : product.title}</h1><p>{product.description || 'Giá rõ ràng, tồn kho cập nhật và theo dõi đơn hàng thuận tiện.'}</p><div><Button as={Link} to={`/products/${product.id}`} variant="light" size="lg">Xem sản phẩm <i className="bi bi-arrow-right" /></Button><Button as={Link} to="/products" variant="outline-light" size="lg">Tìm kiếm</Button></div></Container></div></Carousel.Item>)}
      </Carousel> : <div className="hero-slide hero-fallback"><Container className="hero-copy"><span>ShopLite</span><h1>Mua sắm nhẹ nhàng. Nhận hàng an tâm.</h1><p>Sản phẩm thiết thực, giá rõ ràng và quy trình đặt hàng gọn nhẹ.</p><Button as={Link} to="/products" variant="light" size="lg">Khám phá sản phẩm</Button></Container></div>}
    </section>
    <section className="service-band"><Container><Row className="g-3"><Col md={4}><div className="service-item"><i className="bi bi-truck" /><div><strong>Giao hàng toàn quốc</strong><span>Theo dõi từng trạng thái đơn</span></div></div></Col><Col md={4}><div className="service-item"><i className="bi bi-arrow-repeat" /><div><strong>Hỗ trợ sau mua</strong><span>Phản hồi trong 24 giờ làm việc</span></div></div></Col><Col md={4}><div className="service-item"><i className="bi bi-shield-check" /><div><strong>Thanh toán minh bạch</strong><span>Tổng tiền xác nhận từ hệ thống</span></div></div></Col></Row></Container></section>
    {categories.length > 0 && <section className="category-rail"><Container><div className="section-heading"><div><span>Mua theo nhu cầu</span><h2>Danh mục phổ biến</h2></div></div><div className="category-links">{categories.map((category, index) => <Link key={category} to={`/products?category=${encodeURIComponent(category)}`}><i className={`bi ${['bi-bag','bi-phone','bi-house','bi-watch','bi-headphones','bi-gift'][index]}`} /><span>{category}</span><i className="bi bi-arrow-up-right" /></Link>)}</div></Container></section>}
    <section className="product-section"><Container><div className="section-heading"><div><span>Vừa lên kệ</span><h2>Sản phẩm mới nhất</h2></div><Button as={Link} to="/products" variant="outline-dark">Xem tất cả <i className="bi bi-arrow-right ms-2" /></Button></div>{error && <Alert variant="danger">{error}</Alert>}{!loading && !error && !products.length && <div className="empty-state"><i className="bi bi-box-seam" /><h3>Gian hàng đang được cập nhật</h3></div>}<Row className="g-4">{products.slice(0, 8).map((product) => <Col key={product.id} xl={3} md={4} sm={6}><ProductCard product={product} /></Col>)}</Row></Container></section>
    <section className="trust-story"><Container><div><span>Một nơi cho cả hành trình mua sắm</span><h2>Từ lúc tìm thấy sản phẩm đến khi nhận hàng</h2></div><div className="trust-metrics"><div><strong>01</strong><span>Tìm kiếm và lọc nhanh</span></div><div><strong>02</strong><span>Tồn kho cập nhật tức thời</span></div><div><strong>03</strong><span>Theo dõi đơn rõ ràng</span></div></div></Container></section>
  </>;
}
