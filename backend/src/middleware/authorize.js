/**
 * Factory: authorize(...roles)
 * Returns Express middleware that checks req.user.role against allowed roles.
 * Returns 403 if the user's role is not in the allowed list.
 *
 * Usage:
 *   router.delete('/products/:id', auth, authorize('admin'), deleteProduct);
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions.' });
    }
    next();
  };
}

module.exports = authorize;
