const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadRoot = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '..', 'uploads');
const productUploadDirectory = path.join(uploadRoot, 'products');
fs.mkdirSync(productUploadDirectory, { recursive: true });

const imageExtensions = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const imageStorage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, productUploadDirectory);
  },
  filename(req, file, callback) {
    callback(null, `${crypto.randomUUID()}${imageExtensions[file.mimetype] || ''}`);
  },
});

const imageUploader = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter(req, file, callback) {
    if (!imageExtensions[file.mimetype]) {
      return callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'images'));
    }
    return callback(null, true);
  },
});

const excelUploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    if (!file.originalname.toLowerCase().endsWith('.xlsx')) {
      return callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'file'));
    }
    return callback(null, true);
  },
});

const contactImageUploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
  fileFilter(req, file, callback) {
    if (!imageExtensions[file.mimetype]) {
      return callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'attachments'));
    }
    return callback(null, true);
  },
});

module.exports = {
  uploadRoot,
  uploadProductImages: imageUploader.array('images', 6),
  uploadExcel: excelUploader.single('file'),
  uploadContactImages: contactImageUploader.array('attachments', 3),
};
