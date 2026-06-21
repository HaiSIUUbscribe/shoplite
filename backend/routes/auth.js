const express = require('express');
const router = express.Router();
const auth = require('../controllers/auth');
const { validate, registerRules, loginRules, socialLoginRules, forgotPasswordRules, resetPasswordRules } = require('../middlewares/validate');
const { loginLimiter, sensitiveAuthLimiter } = require('../middlewares/rateLimit');

router.post('/register', registerRules, validate, auth.register);
router.post('/login', loginLimiter, loginRules, validate, auth.login);
router.post('/social', loginLimiter, socialLoginRules, validate, auth.socialLogin);
router.post('/refresh', auth.refresh);
router.post('/logout', auth.logout);
router.post('/forgot-password', sensitiveAuthLimiter, forgotPasswordRules, validate, auth.forgotPassword);
router.post('/reset-password', sensitiveAuthLimiter, resetPasswordRules, validate, auth.resetPassword);

module.exports = router;
