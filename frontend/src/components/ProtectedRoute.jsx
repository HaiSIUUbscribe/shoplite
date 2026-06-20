import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, authReady } = useContext(AuthContext);
  const location = useLocation();

  if (!authReady) {
    return <div className="page-loader"><Spinner animation="border" /><span>Đang xác thực...</span></div>;
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
