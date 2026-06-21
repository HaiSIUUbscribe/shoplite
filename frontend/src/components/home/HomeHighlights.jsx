import React, { useEffect, useState } from 'react';
import { Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function remainingToday() {
  const end = new Date();
  end.setHours(23, 59, 59, 0);
  const diff = Math.max(0, end - new Date());
  return [Math.floor(diff / 3600000), Math.floor((diff % 3600000) / 60000), Math.floor((diff % 60000) / 1000)].map((value) => String(value).padStart(2, '0'));
}

export function ServiceBand() {
  return <section className="service-band" aria-label="Cam kết dịch vụ"><Container>{[
    ['bi-truck', 'Giao hàng toàn quốc', 'Theo dõi từng trạng thái đơn'],
    ['bi-arrow-repeat', 'Hỗ trợ sau mua', 'Phản hồi trong 24 giờ làm việc'],
    ['bi-shield-check', 'Thanh toán minh bạch', 'Tổng tiền xác nhận từ hệ thống'],
  ].map(([icon, title, text]) => <div className="service-item" key={title}><div className="service-icon-wrap"><i className={`bi ${icon}`} /></div><div><strong>{title}</strong><span>{text}</span></div></div>)}</Container></section>;
}

export function FlashDeal() {
  const [time, setTime] = useState(remainingToday);
  useEffect(() => { const id = window.setInterval(() => setTime(remainingToday()), 1000); return () => window.clearInterval(id); }, []);
  return <section className="flash-deal-band"><Container><div className="flash-deal-inner"><div className="flash-deal-left"><span className="flash-badge"><i className="bi bi-lightning-charge-fill" /> Ưu đãi hôm nay</span><h2>Giảm thêm <em>10%</em> cho đơn từ 500k</h2><p>Áp dụng voucher thành viên mới khi thanh toán.</p></div><div className="flash-deal-right"><div className="flash-timer">{time.map((value, index) => <React.Fragment key={index}>{index > 0 && <div className="flash-sep">:</div>}<div className="flash-unit"><span>{value}</span><label>{['giờ', 'phút', 'giây'][index]}</label></div></React.Fragment>)}</div><Button as={Link} to="/products" variant="light" size="lg" className="flash-cta">Mua ngay <i className="bi bi-arrow-right ms-2" /></Button></div></div></Container></section>;
}

export function TrustSections() {
  return <><section className="social-proof-section"><Container><div className="proof-stats">{[['2,400', '+', 'Đơn hàng đã giao'], ['1,800', '+', 'Khách hàng hài lòng'], ['4.8', '/5', 'Điểm đánh giá trung bình'], ['98', '%', 'Phản hồi đúng hạn']].map(([value, suffix, label]) => <div className="proof-stat" key={label}><strong>{value}<span>{suffix}</span></strong><span>{label}</span></div>)}</div></Container></section><section className="trust-story"><Container><div><span>Một nơi cho cả hành trình mua sắm</span><h2>Từ lúc tìm thấy đến khi nhận hàng</h2></div><div className="trust-metrics"><div><strong>Tìm &amp; lọc</strong><span>Bộ lọc nhanh theo danh mục, giá và tồn kho</span></div><div><strong>Đặt hàng</strong><span>Quy trình thanh toán rõ ràng, xác nhận tức thì</span></div><div><strong>Theo dõi</strong><span>Cập nhật trạng thái đơn từng bước đến tay bạn</span></div></div></Container></section></>;
}
