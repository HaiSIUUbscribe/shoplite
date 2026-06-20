const multer = require('multer');
const ApiError = require('../utils/ApiError');

exports.notFound = (req, res, next) => {
  next(new ApiError(404, 'Không tìm thấy API được yêu cầu.', 'ROUTE_NOT_FOUND'));
};

exports.errorHandler = (error, req, res, next) => {
  let normalized = error;

  if (error instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: 'File tải lên vượt quá dung lượng cho phép.',
      LIMIT_FILE_COUNT: 'Số lượng file tải lên vượt quá giới hạn.',
      LIMIT_UNEXPECTED_FILE: 'Tên trường, số lượng hoặc định dạng file không hợp lệ.',
    };
    normalized = new ApiError(400, messages[error.code] || 'Không thể xử lý file tải lên.', 'UPLOAD_ERROR');
  } else if (error.type === 'entity.parse.failed') {
    normalized = new ApiError(400, 'Dữ liệu JSON không hợp lệ.', 'INVALID_JSON');
  } else if (error.code === 'ER_DUP_ENTRY') {
    normalized = new ApiError(409, 'Dữ liệu đã tồn tại trong hệ thống.', 'DUPLICATE_RESOURCE');
  } else if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_ROW_IS_REFERENCED_2') {
    normalized = new ApiError(409, 'Dữ liệu đang được liên kết và không thể thay đổi.', 'RESOURCE_CONFLICT');
  }

  const status = Number(normalized.status) || 500;
  if (status >= 500) console.error(normalized);

  const response = {
    message: status >= 500 ? 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.' : normalized.message,
    code: normalized.code || 'INTERNAL_SERVER_ERROR',
  };
  if (normalized.details) response.details = normalized.details;
  if (process.env.NODE_ENV === 'development' && status >= 500) response.stack = normalized.stack;

  return res.status(status).json(response);
};
