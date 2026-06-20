const express = require('express');
const router = express.Router();
const contact = require('../controllers/contact');
const { validate, contactRules } = require('../middlewares/validate');

router.post('/', contactRules, validate, contact.sendMessage);

module.exports = router;
