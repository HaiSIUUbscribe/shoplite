const express = require('express');
const router = express.Router();
const admin = require('../controllers/admin');
const { authenticate, isAdmin } = require('../middlewares/auth');
const {
  validate,
  idRules,
  adminUserRules,
  adminUserListRules,
  adminUserStatusRules,
} = require('../middlewares/validate');

router.use(authenticate, isAdmin);
router.get('/dashboard', admin.getDashboardStats);
router.get('/users', adminUserListRules, validate, admin.getAllUsers);
router.get('/users/:id', idRules, validate, admin.getUserById);
router.put('/users/:id', adminUserRules, validate, admin.updateUser);
router.patch('/users/:id/status', adminUserStatusRules, validate, admin.updateUserStatus);
router.delete('/users/:id', idRules, validate, admin.deleteUser);

module.exports = router;
