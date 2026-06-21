const ReviewModel = require('../models/ReviewModel');
const ApiError = require('../utils/ApiError');

exports.getMyReviewedProductIds = async (req, res, next) => {
  try {
    const productIds = await ReviewModel.getReviewedProductIdsByUser(req.user.id);
    return res.json({ reviewedProductIds: productIds });
  } catch (error) {
    return next(error);
  }
};

exports.getByProduct = async (req, res, next) => {
  try {
    const [reviews, stats] = await Promise.all([
      ReviewModel.findByProductId(req.params.id),
      ReviewModel.getStats(req.params.id),
    ]);
    return res.json({ reviews, average: Number(stats.average), count: Number(stats.count) });
  } catch (error) {
    return next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    if (!(await ReviewModel.hasCompletedPurchase(req.user.id, req.params.id))) {
      throw new ApiError(
        403,
        'B\u1ea1n ch\u1ec9 c\u00f3 th\u1ec3 \u0111\u00e1nh gi\u00e1 sau khi \u0111\u00e3 nh\u1eadn s\u1ea3n ph\u1ea9m.',
        'REVIEW_PURCHASE_REQUIRED'
      );
    }
    if (await ReviewModel.findByUserAndProduct(req.user.id, req.params.id)) {
      throw reviewExistsError();
    }
    const reviewId = await ReviewModel.create({
      productId: req.params.id,
      userId: req.user.id,
      rating: req.body.rating,
      comment: req.body.comment || null,
    });
    return res.status(201).json({
      message: 'C\u1ea3m \u01a1n b\u1ea1n \u0111\u00e3 g\u1eedi \u0111\u00e1nh gi\u00e1!',
      reviewId,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return next(reviewExistsError());
    return next(error);
  }
};

function reviewExistsError() {
  return new ApiError(
    409,
    'B\u1ea1n \u0111\u00e3 \u0111\u00e1nh gi\u00e1 s\u1ea3n ph\u1ea9m n\u00e0y.',
    'REVIEW_ALREADY_EXISTS'
  );
}
