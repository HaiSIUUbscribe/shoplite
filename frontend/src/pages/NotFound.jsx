import React from 'react';
import { Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return <Container className="py-5"><div className="empty-state not-found"><strong>404</strong><h1>Trang này không tồn tại</h1><p>Đường dẫn có thể đã thay đổi hoặc nội dung đã được gỡ.</p><Button as={Link} to="/">Về trang chủ</Button></div></Container>;
}
