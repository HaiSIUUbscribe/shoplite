const express = require('express');
const router = express.Router();
const notif = require('../controllers/notifications');
const { authenticate, isAdmin } = require('../middlewares/auth');
const {
  validate,
  idRules,
  notificationListRules,
  notificationPreferenceRules,
  notificationSettingsRules,
} = require('../middlewares/validate');

// Tất cả route đều cần đăng nhập
router.use(authenticate);

router.get('/', notificationListRules, validate, notif.list);
router.get('/count',               notif.count);
router.get('/preferences',         notif.getPreferences);
router.put('/preferences', notificationPreferenceRules, validate, notif.setPreferences);
router.get('/settings', isAdmin, notif.getSettings);
router.put('/settings', isAdmin, notificationSettingsRules, validate, notif.setSettings);
router.patch('/read-all',          notif.markAllRead);
router.patch('/:id/read', idRules, validate, notif.markRead);
router.delete('/:id', idRules, validate, notif.deleteOne);

module.exports = router;
