import React from 'react';
import PropTypes from 'prop-types';
import { Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const fallbackIcons = ['bi-bag', 'bi-phone', 'bi-house', 'bi-watch', 'bi-headphones', 'bi-gift'];

export default function CategoryShowcase({ categories }) {
  if (!categories.length) return null;
  return <section className="category-rail">
    <Container>
      <div className="category-heading">
        <div><span>Mua theo nhu cầu</span><h2>Danh mục phổ biến</h2><p>Khám phá nhanh những nhóm sản phẩm được quan tâm nhiều tại ShopLite.</p></div>
        <Button as={Link} to="/products" variant="outline-dark">Tất cả danh mục <i className="bi bi-arrow-right ms-2" /></Button>
      </div>
      <div className="category-grid">
        {categories.map((category, index) => <Link className="category-tile" key={category.name} to={`/products?category=${encodeURIComponent(category.name)}`} aria-label={`Xem danh mục ${category.name}`}>
          <div className="category-image">{category.image ? <img src={category.image} alt="" loading="lazy" /> : <i className={`bi ${fallbackIcons[index]}`} />}</div>
          <div className="category-overlay" />
          <div className="category-content"><span className="category-count-badge">{category.count} sản phẩm</span><h3>{category.name}</h3><span className="category-explore">Khám phá <i className="bi bi-arrow-up-right" /></span></div>
        </Link>)}
      </div>
    </Container>
  </section>;
}

CategoryShowcase.propTypes = { categories: PropTypes.arrayOf(PropTypes.object).isRequired };
