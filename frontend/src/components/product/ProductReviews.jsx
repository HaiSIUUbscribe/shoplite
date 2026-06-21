import React, { useCallback, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Card, Form, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import { productService } from '../../services/api';

export default function ProductReviews({ productId, onStatsChange }) {
  const { user } = useContext(AuthContext);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ average: 0, count: 0 });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await productService.getReviews(productId);
      const nextStats = { average: Number(data.average), count: Number(data.count) };
      setReviews(data.reviews || []);
      setStats(nextStats);
      onStatsChange(nextStats);
    } catch {
      setReviews([]);
      const emptyStats = { average: 0, count: 0 };
      setStats(emptyStats);
      onStatsChange(emptyStats);
    } finally {
      setLoading(false);
    }
  }, [onStatsChange, productId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await productService.addReview(productId, rating, comment);
      toast.success('Gửi đánh giá thành công!');
      setComment('');
      setRating(5);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể gửi đánh giá.');
    } finally {
      setSubmitting(false);
    }
  };

  return <section className="product-reviews mt-5 pt-4 border-top">
    <h3>Đánh giá khách hàng ({stats.count} đánh giá)</h3>
    <div className="d-flex align-items-center mb-4"><h2 className="mb-0 text-warning me-3">★ {stats.average.toFixed(1)}</h2></div>
    {user ? <Card className="mb-4 shadow-sm border-0 bg-light"><Card.Body><h5 className="mb-3">Viết đánh giá của bạn</h5><Form onSubmit={submit}>
      <Form.Group className="mb-3"><Form.Label>Chất lượng sản phẩm</Form.Label><div className="review-star-picker">{[1, 2, 3, 4, 5].map((star) => <button type="button" key={star} onClick={() => setRating(star)} className={star <= rating ? 'active' : ''} aria-label={`${star} sao`}>★</button>)}</div></Form.Group>
      <Form.Group className="mb-3"><Form.Label>Nhận xét</Form.Label><Form.Control as="textarea" rows={3} maxLength={1000} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Nhập cảm nhận của bạn về sản phẩm..." /></Form.Group>
      <Button type="submit" disabled={submitting}>{submitting ? <Spinner animation="border" size="sm" /> : 'Gửi đánh giá'}</Button>
    </Form></Card.Body></Card> : <Alert variant="info">Vui lòng <Link to="/login">đăng nhập</Link> để viết đánh giá.</Alert>}
    {loading ? <div className="page-loader"><Spinner animation="border" size="sm" /></div> : <div className="review-list mt-4">{reviews.length === 0 ? <p className="text-muted">Chưa có đánh giá nào cho sản phẩm này.</p> : reviews.map((review) => <Card key={review.id} className="mb-3 border-0 border-bottom rounded-0"><Card.Body className="px-0"><div className="d-flex justify-content-between mb-2"><strong>{review.user_name}</strong><small className="text-muted">{new Date(review.created_at).toLocaleDateString('vi-VN')}</small></div><div className="text-warning mb-2">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div><p className="mb-0">{review.comment}</p></Card.Body></Card>)}</div>}
  </section>;
}

ProductReviews.propTypes = {
  productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onStatsChange: PropTypes.func.isRequired,
};
