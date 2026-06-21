const common = require('./validators/common');
const auth = require('./validators/auth');
const user = require('./validators/user');
const product = require('./validators/product');
const order = require('./validators/order');
const cart = require('./validators/cart');
const misc = require('./validators/misc');
const notification = require('./validators/notification');
const accountData = require('./validators/accountData');

module.exports = {
  validate: common.validate,
  idRules: common.idRules,

  ...auth,
  ...user,
  ...product,
  ...order,
  ...cart,
  ...misc,
  ...notification,
  ...accountData,
};
