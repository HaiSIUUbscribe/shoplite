import React from 'react';
import PropTypes from 'prop-types';

export default function ProductVariantSelector({ sizes, colors, colorMap, selectedSize, selectedColor, onSizeChange, onColorChange }) {
  return (
    <>
      {sizes.length > 0 && (
        <div className="variant-selector">
          <div className="variant-heading">
            <span>Chọn size</span>
            <strong>{selectedSize}</strong>
          </div>
          <div className="size-options">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                className={selectedSize === size ? 'active' : ''}
                onClick={() => onSizeChange(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div className="variant-selector">
          <div className="variant-heading">
            <span>Chọn màu</span>
            <strong>{selectedColor}</strong>
          </div>
          <div className="color-options">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                className={selectedColor === color ? 'active' : ''}
                onClick={() => onColorChange(color)}
              >
                <span style={{ backgroundColor: colorMap[color.toLocaleLowerCase('vi')] || '#d5dbd8' }} />
                {color}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

ProductVariantSelector.propTypes = {
  sizes: PropTypes.arrayOf(PropTypes.string).isRequired,
  colors: PropTypes.arrayOf(PropTypes.string).isRequired,
  colorMap: PropTypes.objectOf(PropTypes.string).isRequired,
  selectedSize: PropTypes.string.isRequired,
  selectedColor: PropTypes.string.isRequired,
  onSizeChange: PropTypes.func.isRequired,
  onColorChange: PropTypes.func.isRequired,
};
