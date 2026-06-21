const mailer = require('../utils/mailer');
const ApiError = require('../utils/ApiError');

exports.sendMessage = async (req, res, next) => {
  try {
    const attachments = (req.files || []).map((file) => ({
      filename: file.originalname.replace(/[^a-zA-Z0-9._ -]/g, '_'),
      content: file.buffer,
      contentType: file.mimetype,
    }));
    const sent = await mailer.sendContactMessage({ ...req.body, attachments });
    if (!sent) {
      throw new ApiError(
        503,
        'Biểu mẫu liên hệ đang bảo trì. Vui lòng gửi email trực tiếp đến support@shoplite.vn.',
        'MAIL_NOT_CONFIGURED'
      );
    }
    return res.status(202).json({ message: 'Yêu cầu hỗ trợ đã được gửi. ShopLite sẽ phản hồi sớm nhất.' });
  } catch (error) {
    return next(error);
  }
};
