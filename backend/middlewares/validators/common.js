const { param, validationResult } = require('express-validator');
const ApiError = require('../../utils/ApiError');

const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array({ onlyFirstError: true }).map((error) => ({
    field: error.path,
    message: error.msg,
  }));
  return next(new ApiError(422, 'Dữ liệu gửi lên chưa hợp lệ.', 'VALIDATION_ERROR', details));
};

const idParam = param('id').isInt({ min: 1 }).withMessage('ID không hợp lệ.').toInt();
const idRules = [idParam];

module.exports = { validate, idParam, idRules };
