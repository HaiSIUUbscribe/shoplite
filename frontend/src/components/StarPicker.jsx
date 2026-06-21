import React, { useState } from 'react';
import PropTypes from 'prop-types';

const STAR_LABELS = ['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'];

export default function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div>
      <div className="review-star-picker" style={{ fontSize: '2rem' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            aria-label={`${star} sao`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className={star <= active ? 'active' : ''}
          >
            ★
          </button>
        ))}
      </div>
      <small className="fw-semibold text-warning">{STAR_LABELS[active]}</small>
    </div>
  );
}

StarPicker.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};
