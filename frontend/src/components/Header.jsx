import React, { useContext, useState, useEffect, useRef } from 'react';
import { Badge, Button, Container, Form, InputGroup, Nav, Navbar, NavDropdown, Offcanvas } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { formatCurrency } from '../utils/formatCurrency';
import { productService } from '../services/api';
import NotificationBell from './NotificationBell';

export default function Header() {
  const { user, cachedUser, authReady, logout } = useContext(AuthContext);
  const { totalQuantity } = useContext(CartContext);
  const [query, setQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchContainerRef = useRef(null);
  const navigate = useNavigate();
  const headerUser = user || (!authReady ? cachedUser : null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setLoadingSuggestions(true);
    setShowSuggestions(true);
    const delayDebounceFn = setTimeout(() => {
      productService.list({ search: query.trim() })
        .then((data) => {
          setSuggestions(data.slice(0, 5));
        })
        .catch(() => setSuggestions([]))
        .finally(() => setLoadingSuggestions(false));
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const search = (event) => {
    event.preventDefault();
    navigate(query.trim() ? `/products?search=${encodeURIComponent(query.trim())}` : '/products');
    setShowMenu(false);
    setShowSuggestions(false);
  };
  const closeMenu = () => setShowMenu(false);
  const handleLogout = () => { logout(); closeMenu(); navigate('/login'); };

  return <header id="main_header">
    <div className="announcement-bar"><Container><span><i className="bi bi-truck" /> Miễn phí giao hàng toàn quốc</span><div><NavLink to="/contact">Hỗ trợ khách hàng</NavLink><span>08:00 - 21:00</span></div></Container></div>
    <Navbar bg="white" sticky="top" className="main-navbar">
      <Container>
        <Navbar.Brand as={NavLink} to="/" className="brand-logo"><i className="bi bi-bag-check-fill" /><span>ShopLite</span></Navbar.Brand>
        <div className="header-search d-none d-lg-block position-relative" ref={searchContainerRef}>
          <Form onSubmit={search} className="d-flex w-100">
            <InputGroup>
              <Form.Control value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => query.trim() && setShowSuggestions(true)} placeholder="Bạn đang tìm sản phẩm gì?" aria-label="Tìm kiếm sản phẩm" />
              <Button type="submit" aria-label="Tìm kiếm"><i className="bi bi-search" /></Button>
            </InputGroup>
          </Form>
          {showSuggestions && (
            <div className="search-suggestions-dropdown shadow-lg rounded-3 bg-white position-absolute top-100 start-0 w-100 mt-1 overflow-hidden" style={{ zIndex: 1060, border: '1px solid #dfe6e2' }}>
              {loadingSuggestions ? (
                <div className="p-3 text-center text-muted"><span className="spinner-border spinner-border-sm me-2"/>Đang tìm kiếm...</div>
              ) : suggestions.length > 0 ? (
                <div className="list-group list-group-flush">
                  {suggestions.map(prod => (
                    <NavLink key={prod.id} to={`/products/${prod.id}`} className="list-group-item list-group-item-action d-flex align-items-center gap-3 p-2" onClick={() => { setShowSuggestions(false); setQuery(''); }}>
                      <div className="suggestion-img-wrap flex-shrink-0 bg-light rounded d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                        {prod.thumbnail ? <img src={prod.thumbnail} alt={prod.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} /> : <i className="bi bi-image text-muted" />}
                      </div>
                      <div className="suggestion-info overflow-hidden">
                        <strong className="d-block text-truncate text-dark" style={{ fontSize: '0.9rem' }}>{prod.title}</strong>
                        <span className="text-danger fw-bold" style={{ fontSize: '0.85rem' }}>{formatCurrency(prod.price)}</span>
                      </div>
                    </NavLink>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-muted" style={{ fontSize: '0.9rem' }}>Không tìm thấy sản phẩm nào.</div>
              )}
            </div>
          )}
        </div>
        <Button variant="light" className="mobile-menu-button" onClick={() => setShowMenu(true)} aria-label="Mở menu"><i className="bi bi-list" /></Button>
        <div className="header-actions">
          <div className="header-notification-slot">
            {user ? (
              <NotificationBell />
            ) : (
              <NavLink
                to="/login"
                className="header-icon-button"
                aria-label="Đăng nhập để xem thông báo"
                title="Đăng nhập để xem thông báo"
              >
                <i className="bi bi-bell" />
              </NavLink>
            )}
          </div>
          <NavLink to="/cart" className="header-icon-button" aria-label="Giỏ hàng"><i className="bi bi-bag" />{totalQuantity > 0 && <Badge>{totalQuantity > 99 ? '99+' : totalQuantity}</Badge>}</NavLink>
          <div className="header-account-slot">
            {headerUser ? (
              <NavDropdown align="end" title={<span className="user-dropdown"><i className="bi bi-person-circle" /><span>{headerUser.name}</span></span>} id="user-dropdown"><NavDropdown.Item as={NavLink} to="/profile">Tài khoản</NavDropdown.Item><NavDropdown.Item as={NavLink} to="/orders">Đơn hàng</NavDropdown.Item>{headerUser.role === 'admin' && <><NavDropdown.Item as={NavLink} to="/admin/dashboard">Quản trị</NavDropdown.Item><NavDropdown.Item as={NavLink} to="/admin/users">Quản lý tài khoản</NavDropdown.Item></>}<NavDropdown.Divider /><NavDropdown.Item onClick={handleLogout} className="text-danger">Đăng xuất</NavDropdown.Item></NavDropdown>
            ) : !authReady ? (
              <span className="header-account-skeleton" aria-label="Đang kiểm tra đăng nhập" />
            ) : (
              <Button as={NavLink} to="/login" variant="outline-dark" className="login-button">Đăng nhập</Button>
            )}
          </div>
        </div>
        <Navbar.Collapse className="desktop-nav-only"><Nav className="main-nav"><Nav.Link as={NavLink} to="/" end>Trang chủ</Nav.Link><Nav.Link as={NavLink} to="/products">Sản phẩm</Nav.Link><Nav.Link as={NavLink} to="/contact">Liên hệ</Nav.Link>{headerUser?.role === 'admin' && <NavDropdown title="Quản trị" id="admin-dropdown"><NavDropdown.Item as={NavLink} to="/admin/dashboard">Dashboard</NavDropdown.Item><NavDropdown.Item as={NavLink} to="/admin/products">Sản phẩm</NavDropdown.Item><NavDropdown.Item as={NavLink} to="/admin/orders">Đơn hàng</NavDropdown.Item><NavDropdown.Item as={NavLink} to="/admin/users">Người dùng</NavDropdown.Item></NavDropdown>}</Nav></Navbar.Collapse>
      </Container>
    </Navbar>
    <Offcanvas show={showMenu} onHide={closeMenu} placement="end" className="mobile-menu">
      <Offcanvas.Header closeButton><Offcanvas.Title><i className="bi bi-bag-check-fill" /> ShopLite</Offcanvas.Title></Offcanvas.Header>
      <Offcanvas.Body>
        <Form onSubmit={search} className="mobile-search"><InputGroup><Form.Control value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm kiếm sản phẩm" /><Button type="submit"><i className="bi bi-search" /></Button></InputGroup></Form>
        <nav className="mobile-nav"><NavLink to="/" onClick={closeMenu}>Trang chủ</NavLink><NavLink to="/products" onClick={closeMenu}>Sản phẩm</NavLink><NavLink to="/contact" onClick={closeMenu}>Liên hệ</NavLink><NavLink to="/cart" onClick={closeMenu}>Giỏ hàng <span>{totalQuantity}</span></NavLink>{headerUser ? <><NavLink to="/profile" onClick={closeMenu}>Tài khoản</NavLink><NavLink to="/orders" onClick={closeMenu}>Đơn hàng</NavLink>{headerUser.role === 'admin' && <><NavLink to="/admin/dashboard" onClick={closeMenu}>Quản trị</NavLink><NavLink to="/admin/users" onClick={closeMenu}>Quản lý tài khoản</NavLink></>}<button type="button" onClick={handleLogout}>Đăng xuất</button></> : <NavLink to="/login" onClick={closeMenu}>Đăng nhập</NavLink>}</nav>
      </Offcanvas.Body>
    </Offcanvas>
  </header>;
}
