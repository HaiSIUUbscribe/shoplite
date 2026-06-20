import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import MainLayout from './components/Mainlayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import UserOrders from './pages/UserOrders';
import UserProfile from './pages/UsersProfile';
import Dashboard from './pages/Admin/Dashboard';
import ProductsAdmin from './pages/Admin/ProductsAdmin';
import OrdersAdmin from './pages/Admin/OrdersAdmin';
import NotFound from './pages/NotFound';
import OrderSuccess from './pages/OrderSuccess';
import OrderFailed from './pages/OrderFailed';
import OrderDetail from './pages/OrderDetail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Contact from './pages/Contact';

export default function App() {
  return <AuthProvider><CartProvider><BrowserRouter><Routes>
    <Route element={<MainLayout />}>
      <Route index element={<Home />} />
      <Route path="products" element={<Products />} />
      <Route path="products/:id" element={<ProductDetail />} />
      <Route path="contact" element={<Contact />} />
      <Route path="cart" element={<Cart />} />
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password" element={<ResetPassword />} />
      <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="orders" element={<ProtectedRoute><UserOrders /></ProtectedRoute>} />
      <Route path="orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
      <Route path="order-success/:id" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
      <Route path="order-failed" element={<OrderFailed />} />
      <Route path="profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
      <Route path="admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
      <Route path="admin/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
      <Route path="admin/products" element={<AdminRoute><ProductsAdmin /></AdminRoute>} />
      <Route path="admin/orders" element={<AdminRoute><OrdersAdmin /></AdminRoute>} />
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes></BrowserRouter></CartProvider></AuthProvider>;
}
