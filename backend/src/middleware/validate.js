const { validationResult } = require('express-validator');

/**
 * Middleware: validate request using express-validator.
 * Must be placed after the validator chain in a route.
 * Returns 400 with field errors if validation failed.
 *
 * Usage:
 *   router.post('/login', [body('email').isEmail(), body('password').notEmpty()], validate, loginHandler);
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

module.exports = validate;
