const express = require('express');
const locations = require('../controllers/locations');

const router = express.Router();

router.get('/vietnam', locations.getVietnamLocations);

module.exports = router;
