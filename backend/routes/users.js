const express = require('express');
const router = express.Router();
const users = require('../controllers/users');
const { authenticate } = require('../middlewares/auth');
const { validate, profileRules, changePasswordRules } = require('../middlewares/validate');

router.get('/profile', authenticate, users.getProfile);
router.put('/profile', authenticate, profileRules, validate, users.updateProfile);
router.put('/change-password', authenticate, changePasswordRules, validate, users.changePassword);

module.exports = router;
