import React, { useContext, useState } from 'react';
import { Badge, Button, Container, Form, InputGroup, Nav, Navbar, NavDropdown, Offcanvas } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const { totalQuantity } = useContext(CartContext);
  const [query, setQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const search = (event) => {
    event.preventDefault();
    navigate(query.trim() ? `/products?search=${encodeURIComponent(query.trim())}` : '/products');
    setShowMenu(false);
  };
  const closeMenu = () => setShowMenu(false);
  const handleLogout = () => { logout(); closeMenu(); navigate('/login'); };

  return <header id="main_header">
    <div className="announcement-bar"><Container><span><i className="bi bi-truck" /> Miễn phí giao hàng toàn quốc</span><div><NavLink to="/contact">Hỗ trợ khách hàng</NavLink><span>08:00 - 21:00</span></div></Container></div>
    <Navbar bg="white" sticky="top" className="main-navbar">
      <Container>
        <Navbar.Brand as={NavLink} to="/" className="brand-logo"><i className="bi bi-bag-check-fill" /><span>ShopLite</span></Navbar.Brand>
        <Form onSubmit={search} className="header-search d-none d-lg-flex"><InputGroup><Form.Control value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Bạn đang tìm sản phẩm gì?" aria-label="Tìm kiếm sản phẩm" /><Button type="submit" aria-label="Tìm kiếm"><i className="bi bi-search" /></Button></InputGroup></Form>
        <Button variant="light" className="mobile-menu-button" onClick={() => setShowMenu(true)} aria-label="Mở menu"><i className="bi bi-list" /></Button>
        <div className="header-actions">
          <NavLink to="/cart" className="header-icon-button" aria-label="Giỏ hàng"><i className="bi bi-bag" />{totalQuantity > 0 && <Badge>{totalQuantity > 99 ? '99+' : totalQuantity}</Badge>}</NavLink>
          {user ? <NavDropdown align="end" title={<span className="user-dropdown"><i className="bi bi-person-circle" /><span>{user.name}</span></span>} id="user-dropdown"><NavDropdown.Item as={NavLink} to="/profile">Tài khoản</NavDropdown.Item><NavDropdown.Item as={NavLink} to="/orders">Đơn hàng</NavDropdown.Item>{user.role === 'admin' && <NavDropdown.Item as={NavLink} to="/admin/dashboard">Quản trị</NavDropdown.Item>}<NavDropdown.Divider /><NavDropdown.Item onClick={handleLogout} className="text-danger">Đăng xuất</NavDropdown.Item></NavDropdown> : <Button as={NavLink} to="/login" variant="outline-dark" className="login-button">Đăng nhập</Button>}
        </div>
        <Navbar.Collapse className="desktop-nav-only"><Nav className="main-nav"><Nav.Link as={NavLink} to="/" end>Trang chủ</Nav.Link><Nav.Link as={NavLink} to="/products">Sản phẩm</Nav.Link><Nav.Link as={NavLink} to="/contact">Liên hệ</Nav.Link>{user?.role === 'admin' && <NavDropdown title="Quản trị" id="admin-dropdown"><NavDropdown.Item as={NavLink} to="/admin/dashboard">Dashboard</NavDropdown.Item><NavDropdown.Item as={NavLink} to="/admin/products">Sản phẩm</NavDropdown.Item><NavDropdown.Item as={NavLink} to="/admin/orders">Đơn hàng</NavDropdown.Item></NavDropdown>}</Nav></Navbar.Collapse>
      </Container>
    </Navbar>
    <Offcanvas show={showMenu} onHide={closeMenu} placement="end" className="mobile-menu">
      <Offcanvas.Header closeButton><Offcanvas.Title><i className="bi bi-bag-check-fill" /> ShopLite</Offcanvas.Title></Offcanvas.Header>
      <Offcanvas.Body>
        <Form onSubmit={search} className="mobile-search"><InputGroup><Form.Control value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm kiếm sản phẩm" /><Button type="submit"><i className="bi bi-search" /></Button></InputGroup></Form>
        <nav className="mobile-nav"><NavLink to="/" onClick={closeMenu}>Trang chủ</NavLink><NavLink to="/products" onClick={closeMenu}>Sản phẩm</NavLink><NavLink to="/contact" onClick={closeMenu}>Liên hệ</NavLink><NavLink to="/cart" onClick={closeMenu}>Giỏ hàng <span>{totalQuantity}</span></NavLink>{user ? <><NavLink to="/profile" onClick={closeMenu}>Tài khoản</NavLink><NavLink to="/orders" onClick={closeMenu}>Đơn hàng</NavLink>{user.role === 'admin' && <NavLink to="/admin/dashboard" onClick={closeMenu}>Quản trị</NavLink>}<button type="button" onClick={handleLogout}>Đăng xuất</button></> : <NavLink to="/login" onClick={closeMenu}>Đăng nhập</NavLink>}</nav>
      </Offcanvas.Body>
    </Offcanvas>
  </header>;
}
