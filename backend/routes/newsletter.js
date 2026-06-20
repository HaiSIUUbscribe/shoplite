const express = require('express');
const newsletter = require('../controllers/newsletter');
const { validate, newsletterRules } = require('../middlewares/validate');

const router = express.Router();

router.post('/subscribe', newsletterRules, validate, newsletter.subscribe);

module.exports = router;
