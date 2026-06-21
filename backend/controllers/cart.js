const CartModel = require('../models/CartModel');
const ProductModel = require('../models/ProductModel');
const ApiError = require('../utils/ApiError');

function parseOptions(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function assertVariant(product, size, color) {
  const sizes = parseOptions(product.sizes);
  const colors = parseOptions(product.colors);
  if ((sizes.length && !sizes.includes(size)) || (!sizes.length && size)) {
    throw new ApiError(422, 'Size sản phẩm không hợp lệ.', 'INVALID_PRODUCT_SIZE');
  }
  if ((colors.length && !colors.includes(color)) || (!colors.length && color)) {
    throw new ApiError(422, 'Màu sản phẩm không hợp lệ.', 'INVALID_PRODUCT_COLOR');
  }
}

exports.getCart = async (req, res, next) => {
  try {
    const items = await CartModel.findByUserId(req.user.id);
    return res.json({
      items: items.map((item) => ({
        ...item,
        item_key: String(item.id),
        price: Number(item.price),
        stock: Number(item.stock),
        qty: Number(item.qty),
      })),
    });
  } catch (error) {
    return next(error);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1, size = null, color = null } = req.body;
    const product = await ProductModel.findById(productId);
    if (!product) throw new ApiError(404, 'Sản phẩm không tồn tại.', 'PRODUCT_NOT_FOUND');
    if (Number(product.stock) <= 0) throw new ApiError(409, 'Sản phẩm hiện đã hết hàng.', 'OUT_OF_STOCK');
    assertVariant(product, size, color);

    const result = await CartModel.upsertItem({
      userId: req.user.id,
      productId,
      quantity,
      size,
      color,
      stock: Number(product.stock),
    });

    // Affected rows: 1 (insert mới), 2 (update thành công), 0 (update nhưng không thay đổi giá trị)
    // Nếu bị chặn bởi hàm IF() vì vượt quá stock thì affectedRows sẽ là 0.
    if (result.insertId === 0 && result.affectedRows === 0) {
      throw new ApiError(409, `Sản phẩm chỉ còn ${product.stock} trong kho.`, 'INSUFFICIENT_STOCK');
    }

    const isNew = result.insertId !== 0 && result.affectedRows === 1;
    return res.status(isNew ? 201 : 200).json({ message: 'Đã thêm sản phẩm vào giỏ hàng.' });
  } catch (error) {
    return next(error);
  }
};

exports.updateQuantity = async (req, res, next) => {
  try {
    const item = await CartModel.findByIdAndUserId(req.params.id, req.user.id);
    if (!item) throw new ApiError(404, 'Không tìm thấy sản phẩm trong giỏ.', 'CART_ITEM_NOT_FOUND');
    if (req.body.quantity > Number(item.stock)) {
      throw new ApiError(409, `Sản phẩm chỉ còn ${item.stock} trong kho.`, 'INSUFFICIENT_STOCK');
    }
    await CartModel.updateQuantity(req.params.id, req.user.id, req.body.quantity);
    return res.json({ message: 'Đã cập nhật số lượng.' });
  } catch (error) {
    return next(error);
  }
};

exports.removeItem = async (req, res, next) => {
  try {
    if (!(await CartModel.deleteById(req.params.id, req.user.id))) {
      throw new ApiError(404, 'Không tìm thấy sản phẩm trong giỏ.', 'CART_ITEM_NOT_FOUND');
    }
    return res.json({ message: 'Đã xóa sản phẩm khỏi giỏ hàng.' });
  } catch (error) {
    return next(error);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    await CartModel.clearByUserId(req.user.id);
    return res.json({ message: 'Đã xóa toàn bộ giỏ hàng.' });
  } catch (error) {
    return next(error);
  }
};
