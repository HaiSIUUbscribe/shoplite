import React from 'react';
import { Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function ProfileOrders() {
  return (
    <Card className="profile-panel border-0">
      <Card.Body>
        <h2 className="profile-panel-title">
          <i className="bi bi-bag me-2" />Đơn hàng của tôi
        </h2>
        <p className="text-muted mb-4">
          Xem lịch sử và theo dõi tình trạng tất cả đơn hàng của bạn.
        </p>
        <Button as={Link} to="/orders" variant="primary">
          <i className="bi bi-arrow-right me-2" />Xem tất cả đơn hàng
        </Button>
      </Card.Body>
    </Card>
  );
}
