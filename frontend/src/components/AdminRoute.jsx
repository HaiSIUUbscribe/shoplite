import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user, authReady } = useContext(AuthContext);
  if (!authReady) return <div className="page-loader"><Spinner animation="border" /><span>Đang xác thực...</span></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}
