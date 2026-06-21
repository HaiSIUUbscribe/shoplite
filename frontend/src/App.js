import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import MainLayout from './components/Mainlayout';
import AuthLayout from './components/AuthLayout';
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
import ProfileLayout from './components/profile/ProfileLayout';
import ProfileInfo from './pages/profile/ProfileInfo';
import ProfileOrders from './pages/profile/ProfileOrders';
import ProfileAddresses from './pages/profile/ProfileAddresses';
import ProfileWishlist from './pages/profile/ProfileWishlist';
import ProfileSecurity from './pages/profile/ProfileSecurity';
import ProfileNotifications from './pages/profile/ProfileNotifications';
import Dashboard from './pages/Admin/Dashboard';
import ProductsAdmin from './pages/Admin/ProductsAdmin';
import OrdersAdmin from './pages/Admin/OrdersAdmin';
import UsersAdmin from './pages/Admin/UsersAdmin';
import NotFound from './pages/NotFound';
import OrderSuccess from './pages/OrderSuccess';
import OrderFailed from './pages/OrderFailed';
import OrderDetail from './pages/OrderDetail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Contact from './pages/Contact';
import { FavoriteProvider } from './context/FavoriteContext';

export default function App() {
  const app = <AuthProvider><BrowserRouter><FavoriteProvider><CartProvider><Routes>
    <Route element={<MainLayout />}>
      <Route index element={<Home />} />
      <Route path="products" element={<Products />} />
      <Route path="products/:id" element={<ProductDetail />} />
      <Route path="contact" element={<Contact />} />
      <Route path="cart" element={<Cart />} />
      <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="orders" element={<ProtectedRoute><UserOrders /></ProtectedRoute>} />
      <Route path="orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
      <Route path="order-success/:id" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
      <Route path="order-failed" element={<OrderFailed />} />
      <Route path="profile" element={<ProtectedRoute><ProfileLayout /></ProtectedRoute>}>
        <Route index element={<ProfileInfo />} />
        <Route path="addresses" element={<ProfileAddresses />} />
        <Route path="orders" element={<ProfileOrders />} />
        <Route path="wishlist" element={<ProfileWishlist />} />
        <Route path="security" element={<ProfileSecurity />} />
        <Route path="notifications" element={<ProfileNotifications />} />
      </Route>
      <Route path="admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
      <Route path="admin/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
      <Route path="admin/products" element={<AdminRoute><ProductsAdmin /></AdminRoute>} />
      <Route path="admin/orders" element={<AdminRoute><OrdersAdmin /></AdminRoute>} />
      <Route path="admin/users" element={<AdminRoute><UsersAdmin /></AdminRoute>} />
      <Route path="*" element={<NotFound />} />
    </Route>
    <Route element={<AuthLayout />}>
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password" element={<ResetPassword />} />
    </Route>
  </Routes></CartProvider></FavoriteProvider></BrowserRouter></AuthProvider>;

  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID?.trim();
  return googleClientId
    ? <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider>
    : app;
}
