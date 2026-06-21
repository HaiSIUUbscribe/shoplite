import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Form, Image, Modal, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { productService } from '../services/api';
import StarPicker from './StarPicker';

const INITIAL_STATE = { rating: 5, comment: '' };

export default function ReviewModal({ show, product, onHide, onSuccess }) {
  const [form, setForm] = useState(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setForm(INITIAL_STATE);
    onHide();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await productService.addReview(product.product_id, form.rating, form.comment);
      toast.success(' Cảm ơn bạn đã đánh giá sản phẩm!');
      onSuccess(product.product_id);
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể gửi đánh giá.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!product) return null;

  const { title, thumbnail, size, color } = product;

  return (
    <Modal show={show} onHide={handleClose} centered size="md">
      <Modal.Header
        closeButton
        className="border-0 text-white"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <Modal.Title className="fs-6 fw-bold">⭐ Đánh giá sản phẩm</Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        {/* Product Preview */}
        <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded-3 bg-light">
          {thumbnail
            ? <Image src={thumbnail} alt={title} rounded style={{ width: 60, height: 60, objectFit: 'cover' }} />
            : <div className="summary-placeholder" style={{ width: 60, height: 60 }}><i className="bi bi-image" /></div>
          }
          <div>
            <p className="fw-semibold mb-0" style={{ fontSize: '0.92rem' }}>{title}</p>
            {(size || color) && (
              <small className="text-muted">
                {size && `Size ${size}`}{size && color && ' · '}{color}
              </small>
            )}
          </div>
        </div>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3 text-center">
            <Form.Label className="fw-semibold d-block mb-1">Chất lượng sản phẩm</Form.Label>
            <StarPicker value={form.rating} onChange={(rating) => setForm((prev) => ({ ...prev, rating }))} />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold">Nhận xét của bạn</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              maxLength={1000}
              value={form.comment}
              onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
              placeholder="Chia sẻ cảm nhận thực tế để giúp những người mua hàng tiếp theo..."
              style={{ resize: 'none' }}
            />
          </Form.Group>

          <div className="d-flex gap-2 justify-content-end">
            <Button variant="outline-secondary" onClick={handleClose} disabled={submitting}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
            >
              {submitting ? <><Spinner size="sm" className="me-1" />Đang gửi...</> : 'Gửi đánh giá'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

ReviewModal.propTypes = {
  show: PropTypes.bool.isRequired,
  product: PropTypes.shape({
    product_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    thumbnail: PropTypes.string,
    size: PropTypes.string,
    color: PropTypes.string,
  }),
  onHide: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

ReviewModal.defaultProps = {
  product: null,
};
