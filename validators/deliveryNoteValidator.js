const { check } = require('express-validator');
const validateResults = require('../utils/handleValidator');

const validateCreateDeliveryNote = [
  check('clientId')
    .notEmpty().withMessage('Client ID is required')
    .isMongoId().withMessage('Client ID must be a valid Mongo ID'),
  
  check('projectId')
    .notEmpty().withMessage('Project ID is required')
    .isMongoId().withMessage('Project ID must be a valid Mongo ID'),

  check('format')
    .notEmpty().withMessage('Format is required')
    .isIn(['material', 'hours']).withMessage('Format must be either "material" or "hours"'),

  check('material')
    .if((value, { req }) => req.body.format === 'material')
    .notEmpty().withMessage('Material is required'),

  check('hours')
    .if((value, { req }) => req.body.format === 'hours')
    .notEmpty().withMessage('Hours is required')
    .isNumeric().withMessage('Hours must be a number'),

  check('description')
    .notEmpty().withMessage('Description is required'),

  check('workdate')
    .notEmpty().withMessage('Workdate is required')
    .isISO8601().withMessage('Workdate must be a valid date'),

  (req, res, next) => validateResults(req, res, next)
];

module.exports = { validateCreateDeliveryNote };
