const express = require('express');
const router = express.Router();
const contact = require('../controllers/contact');
const { validate, contactRules } = require('../middlewares/validate');
const { uploadContactImages } = require('../middlewares/upload');
const { contactLimiter } = require('../middlewares/rateLimit');
const { authenticate } = require('../middlewares/auth');

router.post('/', authenticate, contactLimiter, uploadContactImages, contactRules, validate, contact.sendMessage);

module.exports = router;
