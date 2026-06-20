import React from 'react';
import { Col, Image, ListGroup, Row } from 'react-bootstrap';
import { formatCurrency } from '../utils/formatCurrency';
import { deliverySteps, estimatedDelivery, orderStatuses } from '../utils/orderStatus';
import { paymentMethodLabels, paymentStatusLabels } from '../utils/payment';

export default function OrderDetailView({ order }) {
  const status = orderStatuses[order.status] || orderStatuses.pending;
  return <>
    {order.status !== 'cancelled' ? <div className="order-timeline">
      {deliverySteps.map((label, index) => <div key={label} className={`timeline-step ${index <= status.step ? 'complete' : ''}`}><span><i className={`bi ${index < status.step ? 'bi-check-lg' : index === status.step ? 'bi-circle-fill' : 'bi-circle'}`} /></span><strong>{label}</strong></div>)}
    </div> : <div className="cancelled-notice"><i className="bi bi-x-circle" /><div><strong>Đơn hàng đã hủy</strong><span>Đơn này không còn được xử lý hoặc giao đi.</span></div></div>}
    <Row className="g-4 order-detail-grid">
      <Col lg={8}>
        <section className="order-detail-section"><div className="detail-section-heading"><h2>Sản phẩm</h2><span>{order.items.length} mặt hàng</span></div><ListGroup variant="flush">{order.items.map((item, index) => <ListGroup.Item key={`${order.id}-${item.product_id}-${item.size || ''}-${item.color || ''}-${index}`} className="order-product">{item.thumbnail ? <Image src={item.thumbnail} alt={item.title} /> : <div className="summary-placeholder"><i className="bi bi-image" /></div>}<div><strong>{item.title}</strong>{(item.size || item.color) && <span>{item.size && `Size ${item.size}`}{item.size && item.color && ' · '}{item.color}</span>}<span>{formatCurrency(Number(item.price))} × {item.qty}</span></div><b>{formatCurrency(Number(item.price) * item.qty)}</b></ListGroup.Item>)}</ListGroup><div className="order-cost-row"><span>Tạm tính</span><span>{formatCurrency(Number(order.subtotal || order.total))}</span></div><div className="order-cost-row"><span>Phí vận chuyển</span><span>Miễn phí</span></div>{Number(order.discount_amount) > 0 && <div className="order-cost-row order-voucher-discount"><span>Voucher {order.voucher_code}</span><strong>-{formatCurrency(Number(order.discount_amount))}</strong></div>}<div className="order-grand-total"><span>Tổng thanh toán</span><strong>{formatCurrency(Number(order.total))}</strong></div></section>
      </Col>
      <Col lg={4}>
        <section className="order-detail-section delivery-detail"><h2>Thông tin nhận hàng</h2><strong>{order.customer_name}</strong><p>{order.customer_phone}</p><p>{order.customer_email}</p><p>{order.customer_address}</p><hr /><span>Thanh toán</span><p>{paymentMethodLabels[order.payment_method] || order.payment_method}</p><p className={`payment-state ${order.payment_status}`}>{paymentStatusLabels[order.payment_status] || order.payment_status}</p>{order.status !== 'done' && order.status !== 'cancelled' && <><span>Dự kiến nhận hàng</span><p className="delivery-date">{estimatedDelivery(order.created_at)}</p></>}</section>
      </Col>
    </Row>
  </>;
}
