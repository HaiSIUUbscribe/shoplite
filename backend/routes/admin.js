const express = require('express');
const router = express.Router();
const admin = require('../controllers/admin');
const { authenticate, isAdmin } = require('../middlewares/auth');
const { validate, idRules, adminUserRules } = require('../middlewares/validate');

router.use(authenticate, isAdmin);
router.get('/dashboard', admin.getDashboardStats);
router.get('/users', admin.getAllUsers);
router.put('/users/:id', adminUserRules, validate, admin.updateUser);
router.delete('/users/:id', idRules, validate, admin.deleteUser);

module.exports = router;
