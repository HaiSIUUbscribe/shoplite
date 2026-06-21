const ProductModel = require('../models/ProductModel');
const ApiError = require('../utils/ApiError');
const productImportService = require('../services/productImport');
const dispatcher = require('../services/notificationDispatcher');

function parseOptionList(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function normalizeProduct(product) {
  return product ? {
    ...product,
    sizes: parseOptionList(product.sizes),
    colors: parseOptionList(product.colors),
  } : null;
}

exports.getProducts = async (req, res, next) => {
  try {
    return res.json((await ProductModel.findAll(req.query)).map(normalizeProduct));
  } catch (error) {
    return next(error);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    return res.json(await ProductModel.findCategories());
  } catch (error) {
    return next(error);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) throw new ApiError(404, 'Không tìm thấy sản phẩm.', 'PRODUCT_NOT_FOUND');
    return res.json(normalizeProduct(product));
  } catch (error) {
    return next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const productId = await ProductModel.create({
      title: req.body.title,
      description: req.body.description || '',
      price: req.body.price,
      category: req.body.category || '',
      sizes: req.body.sizes || [],
      colors: req.body.colors || [],
      thumbnail: req.body.thumbnail || '',
      stock: req.body.stock,
    });
    dispatcher.dispatch(dispatcher.EVENTS.STOCK_CHANGED, {
      productId,
      productTitle: req.body.title,
      previousStock: null,
      stock: req.body.stock,
    });
    return res.status(201).json({ message: 'Đã thêm sản phẩm.', productId });
  } catch (error) {
    return next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const existing = await ProductModel.findById(req.params.id);
    if (!existing) throw new ApiError(404, 'Không tìm thấy sản phẩm.', 'PRODUCT_NOT_FOUND');
    const affectedRows = await ProductModel.update(req.params.id, {
      title: req.body.title,
      description: req.body.description || '',
      price: req.body.price,
      category: req.body.category || '',
      sizes: req.body.sizes || [],
      colors: req.body.colors || [],
      thumbnail: req.body.thumbnail || '',
      stock: req.body.stock,
    });
    if (!affectedRows) throw new ApiError(404, 'Không tìm thấy sản phẩm.', 'PRODUCT_NOT_FOUND');
    dispatcher.dispatch(dispatcher.EVENTS.STOCK_CHANGED, {
      productId: req.params.id,
      productTitle: req.body.title,
      previousStock: Number(existing.stock),
      stock: req.body.stock,
    });
    return res.json({ message: 'Đã cập nhật sản phẩm.' });
  } catch (error) {
    return next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    if (!(await ProductModel.deleteById(req.params.id))) {
      throw new ApiError(404, 'Không tìm thấy sản phẩm.', 'PRODUCT_NOT_FOUND');
    }
    return res.json({ message: 'Đã xóa sản phẩm thành công' });
  } catch (error) {
    next(error);
  }
};

exports.downloadImportTemplate = async (req, res, next) => {
  try {
    const buffer = await productImportService.generateTemplateBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="shoplite-product-template.xlsx"');
    return res.send(Buffer.from(buffer));
  } catch (error) {
    return next(error);
  }
};

exports.importProducts = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Vui lòng chọn file Excel .xlsx.' });

    const importedCount = await productImportService.importProductsFromBuffer(req.file.buffer);

    return res.status(201).json({ message: `Đã nhập ${importedCount} sản phẩm.`, imported: importedCount });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message, errors: error.errors });
    }
    return next(error);
  }
};

exports.uploadImages = async (req, res, next) => {
  try {
    if (!req.files?.length) {
      throw new ApiError(400, 'Vui lòng chọn ít nhất một ảnh sản phẩm.', 'IMAGE_REQUIRED');
    }
    const baseUrl = String(process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    const images = req.files.map((file) => ({
      filename: file.filename,
      url: `${baseUrl}/uploads/products/${file.filename}`,
      size: file.size,
      mimeType: file.mimetype,
    }));
    return res.status(201).json({ message: `Đã tải lên ${images.length} ảnh.`, images });
  } catch (error) {
    return next(error);
  }
};
