import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Carousel, Col, Container, Row, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { newsletterService, productService } from '../services/api';
import ProductCard from '../components/ProductCard';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NEWSLETTER_RESET_DELAY = 4000;

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState('idle');
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const newsletterResetTimer = useRef(null);
  useEffect(() => {
    productService.list({ sort: 'newest' }).then(setProducts).catch(() => setError('Chưa thể tải sản phẩm. Vui lòng thử lại sau.')).finally(() => setLoading(false));
  }, []);
  const heroProducts = products.filter((product) => product.thumbnail).slice(0, 3);
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

  const heroLabel = (index, product) => index === 0 ? 'Lựa chọn mới tại ShopLite' : product.category || 'Được yêu thích';
  const heroTitle = (index, product) => index === 0 ? <>Mua sắm <em>nhẹ nhàng.</em><br />Nhận hàng an tâm.</> : product.title;
  const heroDesc = (product) => product.description || 'Giá rõ ràng, tồn kho cập nhật và theo dõi đơn hàng thuận tiện.';

  useEffect(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 0);
    const tick = () => {
      const diff = Math.max(0, end - new Date());
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      const hEl = document.getElementById('ft-h');
      const mEl = document.getElementById('ft-m');
      const sEl = document.getElementById('ft-s');
      if (hEl) hEl.textContent = h;
      if (mEl) mEl.textContent = m;
      if (sEl) sEl.textContent = s;
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => () => {
    if (newsletterResetTimer.current) window.clearTimeout(newsletterResetTimer.current);
  }, []);

  const updateNewsletterEmail = (event) => {
    setNewsletterEmail(event.target.value);
    if (newsletterStatus !== 'idle') {
      setNewsletterStatus('idle');
      setNewsletterMessage('');
    }
  };

  const submitNewsletter = async (event) => {
    event.preventDefault();
    const normalizedEmail = newsletterEmail.trim().toLowerCase();

    if (!emailPattern.test(normalizedEmail)) {
      setNewsletterStatus('error');
      setNewsletterMessage('Email không hợp lệ.');
      return;
    }

    setNewsletterLoading(true);
    setNewsletterStatus('idle');
    setNewsletterMessage('');

    try {
      const data = await newsletterService.subscribe(normalizedEmail);
      if (data.status === 'duplicate') {
        setNewsletterStatus('duplicate');
        setNewsletterMessage(data.message || 'Email này đã đăng ký nhận tin trước đó.');
        return;
      }

      setNewsletterStatus('success');
      setNewsletterMessage(data.message || 'Mã voucher đã được gửi qua email.');
      newsletterResetTimer.current = window.setTimeout(() => {
        setNewsletterEmail('');
        setNewsletterStatus('idle');
        setNewsletterMessage('');
      }, NEWSLETTER_RESET_DELAY);
    } catch {
      setNewsletterStatus('error');
      setNewsletterMessage('Không thể đăng ký, vui lòng thử lại.');
    } finally {
      setNewsletterLoading(false);
    }
  };

  return <>
    {/* Hero */}
    <section className="home-hero" aria-label="Sản phẩm nổi bật">
      {loading
        ? <div className="hero-loading"><Spinner animation="border" variant="light" /></div>
        : heroProducts.length
          ? <Carousel fade interval={5500} pause="hover">
              {heroProducts.map((product, index) => (
                <Carousel.Item key={product.id}>
                  <div className="hero-slide" style={{ backgroundImage: `url(${JSON.stringify(product.thumbnail).slice(1, -1)})` }}>
                    <div className="hero-shade" />
                    <Container className="hero-copy">
                      <div className="hero-eyebrow">
                        <span>{heroLabel(index, product)}</span>
                      </div>
                      <h1>{heroTitle(index, product)}</h1>
                      <p>{heroDesc(product)}</p>
                      <div>
                        <Button as={Link} to={`/products/${product.id}`} variant="light" size="lg">
                          Xem sản phẩm <i className="bi bi-arrow-right ms-2" />
                        </Button>
                        <Button as={Link} to="/products" variant="outline-light" size="lg">
                          Tìm kiếm
                        </Button>
                      </div>
                    </Container>
                  </div>
                </Carousel.Item>
              ))}
            </Carousel>
          : <div className="hero-slide hero-fallback">
              <Container className="hero-copy">
                <div className="hero-eyebrow">
                  <span>ShopLite</span>
                </div>
                <h1>Mua sắm <em>nhẹ nhàng.</em><br />Nhận hàng an tâm.</h1>
                <p>Sản phẩm thiết thực, giá rõ ràng và quy trình đặt hàng gọn nhẹ.</p>
                <div>
                  <Button as={Link} to="/products" variant="light" size="lg">
                    Khám phá sản phẩm <i className="bi bi-arrow-right ms-2" />
                  </Button>
                </div>
              </Container>
            </div>
      }
    </section>

    {/* Service band */}
    <section className="service-band" aria-label="Cam kết dịch vụ">
      <Container>
        <div className="service-item">
          <div className="service-icon-wrap"><i className="bi bi-truck" /></div>
          <div><strong>Giao hàng toàn quốc</strong><span>Theo dõi từng trạng thái đơn</span></div>
        </div>
        <div className="service-item">
          <div className="service-icon-wrap"><i className="bi bi-arrow-repeat" /></div>
          <div><strong>Hỗ trợ sau mua</strong><span>Phản hồi trong 24 giờ làm việc</span></div>
        </div>
        <div className="service-item">
          <div className="service-icon-wrap"><i className="bi bi-shield-check" /></div>
          <div><strong>Thanh toán minh bạch</strong><span>Tổng tiền xác nhận từ hệ thống</span></div>
        </div>
      </Container>
    </section>

    {/* Category rail */}
    {categories.length > 0 && (
      <section className="category-rail">
        <Container>
          <div className="category-heading">
            <div>
              <span>Mua theo nhu cầu</span>
              <h2>Danh mục phổ biến</h2>
              <p>Khám phá nhanh những nhóm sản phẩm được quan tâm nhiều tại ShopLite.</p>
            </div>
            <Button as={Link} to="/products" variant="outline-dark">
              Tất cả danh mục <i className="bi bi-arrow-right ms-2" />
            </Button>
          </div>
          <div className="category-grid">
            {categories.map((category, index) => (
              <Link
                className="category-tile"
                key={category.name}
                to={`/products?category=${encodeURIComponent(category.name)}`}
                aria-label={`Xem danh mục ${category.name}`}
              >
                <div className="category-image">
                  {category.image
                    ? <img src={category.image} alt="" loading="lazy" />
                    : <i className={`bi ${['bi-bag','bi-phone','bi-house','bi-watch','bi-headphones','bi-gift'][index]}`} />
                  }
                </div>
                <div className="category-overlay" />
                <div className="category-content">
                  <span className="category-count-badge">{category.count} sản phẩm</span>
                  <h3>{category.name}</h3>
                  <span className="category-explore">
                    Khám phá <i className="bi bi-arrow-up-right" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    )}

    {/* Product section */}
    <section className="product-section">
      <Container>
        <div className="section-heading">
          <div>
            <span>Vừa lên kệ</span>
            <h2>Sản phẩm mới nhất</h2>
          </div>
          <Button as={Link} to="/products" variant="outline-dark">
            Xem tất cả <i className="bi bi-arrow-right ms-2" />
          </Button>
        </div>
        {error && <Alert variant="danger">{error}</Alert>}
        {!loading && !error && !products.length && (
          <div className="empty-state">
            <i className="bi bi-box-seam" />
            <h3>Gian hàng đang được cập nhật</h3>
          </div>
        )}
        <Row className="g-4">
          {products.slice(0, 8).map((product) => (
            <Col key={product.id} xl={3} md={4} sm={6}>
              <ProductCard product={product} />
            </Col>
          ))}
        </Row>
      </Container>
    </section>

    {/* Flash deal banner */}
    <section className="flash-deal-band">
      <Container>
        <div className="flash-deal-inner">
          <div className="flash-deal-left">
            <span className="flash-badge"><i className="bi bi-lightning-charge-fill" /> Ưu đãi hôm nay</span>
            <h2>Giảm thêm <em>10%</em> cho đơn từ 500k</h2>
            <p>Áp dụng tự động khi thanh toán — không cần mã giảm giá.</p>
          </div>
          <div className="flash-deal-right">
            <div className="flash-timer" id="flash-timer">
              <div className="flash-unit"><span id="ft-h">08</span><label>giờ</label></div>
              <div className="flash-sep">:</div>
              <div className="flash-unit"><span id="ft-m">00</span><label>phút</label></div>
              <div className="flash-sep">:</div>
              <div className="flash-unit"><span id="ft-s">00</span><label>giây</label></div>
            </div>
            <Button as={Link} to="/products" variant="light" size="lg" className="flash-cta">
              Mua ngay <i className="bi bi-arrow-right ms-2" />
            </Button>
          </div>
        </div>
      </Container>
    </section>

    {/* Social proof + stats */}
    <section className="social-proof-section">
      <Container>
        <div className="proof-stats">
          <div className="proof-stat">
            <strong>2,400<span>+</span></strong>
            <span>Đơn hàng đã giao</span>
          </div>
          <div className="proof-stat">
            <strong>1,800<span>+</span></strong>
            <span>Khách hàng hài lòng</span>
          </div>
          <div className="proof-stat">
            <strong>4.8<span>/5</span></strong>
            <span>Điểm đánh giá trung bình</span>
          </div>
          <div className="proof-stat">
            <strong>98<span>%</span></strong>
            <span>Phản hồi đúng hạn</span>
          </div>
        </div>

      </Container>
    </section>

    {/* Newsletter */}
    <section className="newsletter-section" id="newsletter">
      <Container>
        <div className="newsletter-inner">
          <div className="newsletter-copy">
            <span>Voucher dành cho thành viên mới</span>
            <h2>Nhận mã giảm 10% qua email</h2>
            <p>Giảm tối đa 100.000đ cho đơn từ 500.000đ. Mỗi email chỉ nhận một mã và mã có hiệu lực trong 30 ngày.</p>
          </div>
          {newsletterStatus === 'success' ? (
            <div className="newsletter-success" role="status" aria-live="polite">
              <i className="bi bi-check-circle-fill" aria-hidden="true" />
              <span>{newsletterMessage}</span>
            </div>
          ) : (
            <div>
              <form className="newsletter-form" onSubmit={submitNewsletter} noValidate>
                <div className="newsletter-input-wrap">
                  <i className="bi bi-envelope" aria-hidden="true" />
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={updateNewsletterEmail}
                    placeholder="Email của bạn"
                    aria-label="Địa chỉ email"
                    aria-invalid={newsletterStatus === 'error'}
                    maxLength={190}
                    disabled={newsletterLoading}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={newsletterLoading}>
                  {newsletterLoading ? <><Spinner animation="border" size="sm" className="me-2" />Đang gửi...</> : 'Đăng ký'}
                </button>
              </form>
              {newsletterMessage && (
                <div className={`newsletter-message is-${newsletterStatus}`} role="status" aria-live="polite">
                  <i className={`bi ${newsletterStatus === 'duplicate' ? 'bi-info-circle' : 'bi-exclamation-circle'}`} aria-hidden="true" />
                  <span>{newsletterMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Container>
    </section>
    <section className="trust-story">
      <Container>
        <div>
          <span>Một nơi cho cả hành trình mua sắm</span>
          <h2>Từ lúc tìm thấy đến khi nhận hàng</h2>
        </div>
        <div className="trust-metrics">
          <div>
            <strong>Tìm &amp; lọc</strong>
            <span>Bộ lọc nhanh theo danh mục, giá và tồn kho</span>
          </div>
          <div>
            <strong>Đặt hàng</strong>
            <span>Quy trình thanh toán rõ ràng, xác nhận tức thì</span>
          </div>
          <div>
            <strong>Theo dõi</strong>
            <span>Cập nhật trạng thái đơn từng bước đến tay bạn</span>
          </div>
        </div>
      </Container>
    </section>
  </>;
}
