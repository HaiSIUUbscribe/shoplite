import React from 'react';
import PropTypes from 'prop-types';

export default function ProductGallery({ gallery, activeImage, onThumbClick, imageFailed, onImageError, title, discountPercent, hasDiscount }) {
  return (
    <div className="detail-gallery">
      <div className="detail-media">
        {hasDiscount && <span className="detail-discount-flag">-{discountPercent}%</span>}
        {!imageFailed && gallery[activeImage] ? (
          <img src={gallery[activeImage]} alt={title} onError={onImageError} />
        ) : (
          <i className="bi bi-image" />
        )}
      </div>

      {gallery.length > 1 && (
        <div className="detail-thumb-row">
          {gallery.map((src, index) => (
            <button
              key={src + index}
              type="button"
              className={`detail-thumb ${activeImage === index ? 'active' : ''}`}
              onClick={() => onThumbClick(index)}
              aria-label={`Ảnh ${index + 1}`}
            >
              <img src={src} alt={`${title} ${index + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

ProductGallery.propTypes = {
  gallery: PropTypes.arrayOf(PropTypes.string).isRequired,
  activeImage: PropTypes.number.isRequired,
  onThumbClick: PropTypes.func.isRequired,
  imageFailed: PropTypes.bool.isRequired,
  onImageError: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  discountPercent: PropTypes.number.isRequired,
  hasDiscount: PropTypes.bool.isRequired,
};
