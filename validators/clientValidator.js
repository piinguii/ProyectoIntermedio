const { check } = require('express-validator');
const validateResults = require('../utils/handleValidator');

const validateCreateClient = [
  check('name').exists().notEmpty().isString(),
  check('email').optional().isEmail(),
  check('address.street').exists().notEmpty().isString(),
  check('address.number').exists().isNumeric(),
  check('address.postal').exists().isNumeric(),
  check('address.city').exists().notEmpty().isString(),
  check('address.province').exists().notEmpty().isString(),
  (req, res, next) => validateResults(req, res, next)
];

module.exports = { validateCreateClient };
