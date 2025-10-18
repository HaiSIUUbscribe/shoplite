const express = require('express');
const router = express.Router();
const { register, login, getProfile ,updateProfile} = require('../controllers/auth');
const { authenticate } = require('../middlewares/auth');

// Routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getProfile);
router.put('/update', authenticate, updateProfile);

module.exports = router;
