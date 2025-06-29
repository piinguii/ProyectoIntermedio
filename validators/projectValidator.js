const { check } = require('express-validator');
const validateResults = require('../utils/handleValidator');

const validateCreateProject = [
  check('name').exists().notEmpty(),
  check('projectCode').exists().notEmpty(),
  check('email').isEmail(),
  check('address.street').notEmpty(),
  check('address.number').isNumeric(),
  check('address.postal').isNumeric(),
  check('address.city').notEmpty(),
  check('address.province').notEmpty(),
  check('code').exists().notEmpty(),
  check('clientId').isMongoId(),
  (req, res, next) => validateResults(req, res, next)
];

module.exports = { validateCreateProject };
