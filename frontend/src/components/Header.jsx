import React, { useContext } from "react";
import { Navbar, Nav, Container, Button, NavDropdown, Badge} from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import "bootstrap-icons/font/bootstrap-icons.css";

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const { cartItems } = useContext(CartContext);
  const navigate = useNavigate();

  const totalItemsInCart = cartItems.reduce((total, item) => total + item.qty, 0);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Navbar id="main_header" bg="white" expand="lg" sticky="top" className="main-navbar shadow-sm py-3">
      <Container>
        <Navbar.Brand as={NavLink} to="/" className="brand-logo">
          <i className="bi bi-bag-check-fill me-2"></i> ShopLite
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar" className="justify-content-between">
          <Nav className="me-auto main-nav">
            <Nav.Link as={NavLink} to="/" end>
              Trang chủ
            </Nav.Link>
            <Nav.Link as={NavLink} to="/products">
              Sản phẩm
            </Nav.Link>

            {user && user.role === "admin" && (
              <NavDropdown title="Quản trị" id="admin-dropdown">
                <NavDropdown.Item as={NavLink} to="/admin/dashboard">
                  Dashboard
                </NavDropdown.Item>
                <NavDropdown.Item as={NavLink} to="/admin/products">
                  Quản lý sản phẩm
                </NavDropdown.Item>
                <NavDropdown.Item as={NavLink} to="/admin/orders">
                  Quản lý đơn hàng
                </NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>

          <Nav className="d-flex align-items-center gap-3">
            <Nav.Link as={NavLink} to="/cart" className="cart-icon position-relative">
              <i className="bi bi-cart3 fs-4 text-dark"></i>
              {totalItemsInCart > 0 && (
                <Badge pill bg="danger" className="cart-badge">
                  {totalItemsInCart > 99 ? "99+" : totalItemsInCart}
                </Badge>
              )}
            </Nav.Link>

            {user ? (
              <NavDropdown
                align="end"
                title={
                  <span className="user-dropdown">
                    <i className="bi bi-person-circle fs-4 me-2"></i>
                    <span>{user.name}</span>
                  </span>
                }
                id="user-dropdown"
              >
                <NavDropdown.Item as={NavLink} to="/profile">
                  <i className="bi bi-person-lines-fill me-2"></i>Thông tin tài khoản
                </NavDropdown.Item>
                <NavDropdown.Item as={NavLink} to="/orders">
                  <i className="bi bi-bag-check me-2"></i>Đơn hàng của tôi
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout} className="text-danger">
                  <i className="bi bi-box-arrow-right me-2"></i>Đăng xuất
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Button as={NavLink} to="/login" variant="outline-primary" className="auth-btn">
                  Đăng nhập
                </Button>
                <Button as={NavLink} to="/register" variant="primary" className="auth-btn">
                  Đăng ký
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
