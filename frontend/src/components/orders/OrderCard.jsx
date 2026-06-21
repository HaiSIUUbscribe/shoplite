import React from 'react';
import { Accordion, Badge, Button, Col, Image, ListGroup, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import PropTypes from 'prop-types';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatOrderDate, orderStatusIcons, orderStatuses } from '../../utils/orderStatus';
import { paymentMethodLabels, paymentStatusLabels } from '../../utils/payment';

// ── Helpers ───────────────────────────────────────────────────

export function generateInvoicePdf(order) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('SHOPLITE - HOA DON MUA HANG', 105, 20, { align: 'center' });
  doc.setFontSize(11);
  doc.text(`Ma don: #${order.id}`, 14, 34);
  doc.text(`Ngay dat: ${new Date(order.created_at).toLocaleString('vi-VN')}`, 14, 42);
  doc.text(`Nguoi nhan: ${order.customer_name || ''}`, 14, 50);
  doc.autoTable({
    startY: 60,
    head: [['#', 'San pham', 'SL', 'Don gia', 'Thanh tien']],
    body: order.items.map((item, idx) => [
      idx + 1,
      `${item.title}${item.size ? ` - Size ${item.size}` : ''}${item.color ? ` - ${item.color}` : ''}`,
      item.qty,
      formatCurrency(item.price),
      formatCurrency(item.price * item.qty),
    ]),
    headStyles: { fillColor: [16, 94, 74] },
  });
  doc.setFontSize(13);
  doc.text(`Tong: ${formatCurrency(order.total)}`, 196, doc.lastAutoTable.finalY + 12, { align: 'right' });
  doc.save(`shoplite-don-${order.id}.pdf`);
}

// ── Sub-components ────────────────────────────────────────────

function ReviewButton({ item, isDone, isReviewed, onReview }) {
  if (!isDone) return null;
  if (isReviewed) {
    return (
      <span className="text-success fw-semibold" style={{ fontSize: '0.75rem' }}>
        <i className="bi bi-patch-check-fill me-1" />Đã đánh giá
      </span>
    );
  }
  return (
    <Button
      size="sm"
      variant="outline-warning"
      className="fw-semibold"
      style={{ fontSize: '0.72rem', borderRadius: 20 }}
      onClick={() => onReview(item)}
    >
      ⭐ Đánh giá
    </Button>
  );
}

ReviewButton.propTypes = {
  item: PropTypes.object.isRequired,
  isDone: PropTypes.bool.isRequired,
  isReviewed: PropTypes.bool.isRequired,
  onReview: PropTypes.func.isRequired,
};

function OrderProductItem({ item, orderId, index, isDone, isReviewed, onReview }) {
  const key = `${orderId}-${item.product_id}-${item.size || ''}-${item.color || ''}-${index}`;
  return (
    <ListGroup.Item key={key} className="order-product">
      {item.thumbnail
        ? <Image src={item.thumbnail} alt={item.title} />
        : <div className="summary-placeholder"><i className="bi bi-image" /></div>
      }
      <div>
        <strong>{item.title}</strong>
        {(item.size || item.color) && (
          <span>
            {item.size && `Size ${item.size}`}
            {item.size && item.color && ' · '}
            {item.color}
          </span>
        )}
        <span>{formatCurrency(Number(item.price))} x {item.qty}</span>
      </div>
      <div className="d-flex flex-column align-items-end gap-1">
        <b>{formatCurrency(Number(item.price) * item.qty)}</b>
        <ReviewButton item={item} isDone={isDone} isReviewed={isReviewed} onReview={onReview} />
      </div>
    </ListGroup.Item>
  );
}

OrderProductItem.propTypes = {
  item: PropTypes.object.isRequired,
  orderId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  index: PropTypes.number.isRequired,
  isDone: PropTypes.bool.isRequired,
  isReviewed: PropTypes.bool.isRequired,
  onReview: PropTypes.func.isRequired,
};

export default function OrderCard({ order, reviewedIds, onReview }) {
  const status = orderStatuses[order.status] || { label: order.status, color: 'secondary' };
  const statusIcon = orderStatusIcons[order.status] || 'bi-info-circle';
  const isDone = order.status === 'done';
  const leadItem = order.items[0];
  const itemCount = order.items.length;
  const totalUnits = order.items.reduce((sum, item) => sum + Number(item.qty || 0), 0);

  return (
    <Accordion.Item eventKey={String(order.id)} className="order-item">
      <Accordion.Header>
        <div className="order-card-summary">
          <div className="order-summary-thumbnail" aria-hidden="true">
            {leadItem?.thumbnail
              ? <img src={leadItem.thumbnail} alt="" />
              : <i className="bi bi-image" />
            }
            {itemCount > 1 && <span>+{itemCount - 1}</span>}
          </div>

          <div className="order-summary-main">
            <div className="order-summary-identity">
              <span>Đơn hàng</span>
              <strong>#{order.id}</strong>
            </div>
            <strong className="order-summary-product" title={leadItem?.title}>
              {leadItem?.title || 'Sản phẩm trong đơn hàng'}
            </strong>
            <div className="order-summary-context">
              <span><i className="bi bi-calendar3" />{formatOrderDate(order.created_at)}</span>
              <span><i className="bi bi-box-seam" />{itemCount} mặt hàng · {totalUnits} sản phẩm</span>
            </div>
          </div>

          <div className="order-summary-status">
            <Badge bg={status.color} className="order-status-badge">
              <i className={`bi ${statusIcon}`} />{status.label}
            </Badge>
          </div>

          <div className="order-summary-total">
            <span>Tổng thanh toán</span>
            <strong>{formatCurrency(Number(order.total))}</strong>
          </div>

          <span className="order-summary-toggle" aria-hidden="true">
            <span className="toggle-collapsed">Xem chi tiết</span>
            <span className="toggle-expanded">Thu gọn</span>
            <i className="bi bi-chevron-down" />
          </span>
        </div>
      </Accordion.Header>
      <Accordion.Body>
        <Row className="g-4">
          <Col lg={8}>
            <ListGroup variant="flush">
              {order.items.map((item, index) => (
                <OrderProductItem
                  key={`${order.id}-${item.product_id}-${index}`}
                  item={item}
                  orderId={order.id}
                  index={index}
                  isDone={isDone}
                  isReviewed={reviewedIds.has(Number(item.product_id))}
                  onReview={onReview}
                />
              ))}
            </ListGroup>
          </Col>
          <Col lg={4}>
            <div className="delivery-info">
              <h3>Thông tin nhận hàng</h3>
              <p><strong>{order.customer_name}</strong></p>
              <p>{order.customer_phone}</p>
              <p>{order.customer_address}</p>
              <p>{paymentMethodLabels[order.payment_method] || order.payment_method}</p>
              <p>{paymentStatusLabels[order.payment_status] || order.payment_status}</p>
            </div>
          </Col>
        </Row>
        <div className="order-actions mt-3">
          <Button as={Link} to={`/orders/${order.id}`} size="sm">
            Xem chi tiết <i className="bi bi-arrow-right ms-2" />
          </Button>
          <Button variant="outline-dark" size="sm" onClick={() => generateInvoicePdf(order)}>
            <i className="bi bi-file-earmark-pdf me-2" />Tải hóa đơn
          </Button>
        </div>
      </Accordion.Body>
    </Accordion.Item>
  );
}

OrderCard.propTypes = {
  order: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    created_at: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    items: PropTypes.array.isRequired,
    customer_name: PropTypes.string,
    customer_phone: PropTypes.string,
    customer_address: PropTypes.string,
    payment_method: PropTypes.string,
    payment_status: PropTypes.string,
  }).isRequired,
  reviewedIds: PropTypes.instanceOf(Set).isRequired,
  onReview: PropTypes.func.isRequired,
};
