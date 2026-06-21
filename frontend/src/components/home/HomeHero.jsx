import React from 'react';
import PropTypes from 'prop-types';
import { Button, Carousel, Container, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function HomeHero({ loading, products }) {
  if (loading) return <section className="home-hero"><div className="hero-loading"><Spinner animation="border" variant="light" /></div></section>;

  return <section className="home-hero" aria-label="Sản phẩm nổi bật">
    {products.length ? <Carousel fade interval={5500} pause="hover">
      {products.map((product, index) => <Carousel.Item key={product.id}>
        <div className="hero-slide" style={{ backgroundImage: `url(${JSON.stringify(product.thumbnail).slice(1, -1)})` }}>
          <div className="hero-shade" />
          <Container className="hero-copy">
            <div className="hero-eyebrow"><span>{index === 0 ? 'Lựa chọn mới tại ShopLite' : product.category || 'Được yêu thích'}</span></div>
            <h1>{index === 0 ? <>Mua sắm <em>nhẹ nhàng.</em><br />Nhận hàng an tâm.</> : product.title}</h1>
            <p>{product.description || 'Giá rõ ràng, tồn kho cập nhật và theo dõi đơn hàng thuận tiện.'}</p>
            <div>
              <Button as={Link} to={`/products/${product.id}`} variant="light" size="lg">Xem sản phẩm <i className="bi bi-arrow-right ms-2" /></Button>
              <Button as={Link} to="/products" variant="outline-light" size="lg">Tìm kiếm</Button>
            </div>
          </Container>
        </div>
      </Carousel.Item>)}
    </Carousel> : <div className="hero-slide hero-fallback">
      <Container className="hero-copy">
        <div className="hero-eyebrow"><span>ShopLite</span></div>
        <h1>Mua sắm <em>nhẹ nhàng.</em><br />Nhận hàng an tâm.</h1>
        <p>Sản phẩm thiết thực, giá rõ ràng và quy trình đặt hàng gọn nhẹ.</p>
        <Button as={Link} to="/products" variant="light" size="lg">Khám phá sản phẩm <i className="bi bi-arrow-right ms-2" /></Button>
      </Container>
    </div>}
  </section>;
}

HomeHero.propTypes = {
  loading: PropTypes.bool.isRequired,
  products: PropTypes.arrayOf(PropTypes.object).isRequired,
};
