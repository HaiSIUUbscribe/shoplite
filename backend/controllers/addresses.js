const AddressModel = require('../models/AddressModel');
const ApiError = require('../utils/ApiError');

exports.list = async (req, res, next) => {
  try {
    return res.json(await AddressModel.findByUser(req.user.id));
  } catch (error) {
    return next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const id = await AddressModel.create(req.user.id, req.body);
    return res.status(201).json({ message: 'Đã thêm địa chỉ.', id });
  } catch (error) {
    return next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const rows = await AddressModel.update(req.params.id, req.user.id, req.body);
    if (!rows) throw new ApiError(404, 'Không tìm thấy địa chỉ.', 'ADDRESS_NOT_FOUND');
    return res.json({ message: 'Đã cập nhật địa chỉ.' });
  } catch (error) {
    return next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const rows = await AddressModel.deleteById(req.params.id, req.user.id);
    if (!rows) throw new ApiError(404, 'Không tìm thấy địa chỉ.', 'ADDRESS_NOT_FOUND');
    return res.json({ message: 'Đã xóa địa chỉ.' });
  } catch (error) {
    return next(error);
  }
};

exports.setDefault = async (req, res, next) => {
  try {
    const rows = await AddressModel.setDefault(req.params.id, req.user.id);
    if (!rows) throw new ApiError(404, 'Không tìm thấy địa chỉ.', 'ADDRESS_NOT_FOUND');
    return res.json({ message: 'Đã đặt làm địa chỉ mặc định.' });
  } catch (error) {
    return next(error);
  }
};
