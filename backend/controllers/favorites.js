const FavoriteModel = require('../models/FavoriteModel');
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

const formatProduct = (product) => ({
  ...product,
  sizes: parseOptions(product.sizes),
  colors: parseOptions(product.colors),
});

exports.getMine = async (req, res, next) => {
  try {
    const products = await FavoriteModel.findAllByUser(req.user.id);
    return res.json(products.map(formatProduct));
  } catch (error) {
    return next(error);
  }
};

exports.getMineIds = async (req, res, next) => {
  try {
    const ids = await FavoriteModel.getIdsByUser(req.user.id);
    return res.json(ids);
  } catch (error) {
    return next(error);
  }
};

exports.add = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const product = await ProductModel.findById(productId);
    if (!product) throw new ApiError(404, 'Không tìm thấy sản phẩm.', 'PRODUCT_NOT_FOUND');

    await FavoriteModel.add(req.user.id, productId);
    return res.status(201).json({ message: 'Đã thêm vào danh sách yêu thích.' });
  } catch (error) {
    return next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await FavoriteModel.remove(req.user.id, req.params.productId);
    return res.json({ message: 'Đã xóa khỏi danh sách yêu thích.' });
  } catch (error) {
    return next(error);
  }
};
