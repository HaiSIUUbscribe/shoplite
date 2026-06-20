const express = require('express');
const router = express.Router();
const auth = require('../controllers/auth');
const users = require('../controllers/users');
const { authenticate } = require('../middlewares/auth');
const { validate, registerRules, loginRules, profileRules, forgotPasswordRules, resetPasswordRules } = require('../middlewares/validate');

router.post('/register', registerRules, validate, auth.register);
router.post('/login', loginRules, validate, auth.login);
router.post('/forgot-password', forgotPasswordRules, validate, auth.forgotPassword);
router.post('/reset-password', resetPasswordRules, validate, auth.resetPassword);

// Backward-compatible aliases; new clients should use /api/users/profile.
router.get('/me', authenticate, users.getProfile);
router.put('/update', authenticate, profileRules, validate, users.updateProfile);

module.exports = router;
