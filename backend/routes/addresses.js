const express = require('express');
const router = express.Router();
const addresses = require('../controllers/addresses');
const { authenticate } = require('../middlewares/auth');
const {
  validate,
  addressCreateRules,
  addressUpdateRules,
  addressIdRules,
} = require('../middlewares/validate');

router.get('/', authenticate, addresses.list);
router.post('/', authenticate, addressCreateRules, validate, addresses.create);
router.put('/:id', authenticate, addressUpdateRules, validate, addresses.update);
router.delete('/:id', authenticate, addressIdRules, validate, addresses.remove);
router.patch('/:id/default', authenticate, addressIdRules, validate, addresses.setDefault);

module.exports = router;
