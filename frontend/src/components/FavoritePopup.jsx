import React, { useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './FavoritePopup.css';

export default function FavoritePopup({ show, product, isAdded, onClose }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 2500); // Tự đóng sau 2.5s
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!product) return null;

  return (
    <Modal 
      show={show} 
      onHide={onClose} 
      centered 
      className="favorite-popup-modal"
      backdropClassName="favorite-popup-backdrop"
      animation={true}
    >
      <Modal.Body className="text-center p-5">
        <div className={`favorite-icon-wrapper ${isAdded ? 'added' : 'removed'}`}>
          <i className={`bi ${isAdded ? 'bi-heart-fill' : 'bi-heart'}`} />
        </div>
        <h3 className="favorite-popup-title mt-4 mb-2">
          {isAdded ? 'Đã thêm vào yêu thích' : 'Đã bỏ yêu thích'}
        </h3>
        <p className="favorite-popup-product text-muted mb-4">
          <strong>{product.title}</strong>
        </p>
        {isAdded && (
          <Link to="/profile/wishlist" onClick={onClose} className="btn btn-dark favorite-popup-btn">
            Xem danh sách yêu thích
          </Link>
        )}
      </Modal.Body>
    </Modal>
  );
}
