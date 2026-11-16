const jwt = require('jsonwebtoken');

/**
 * Middleware: verify JWT from Authorization: Bearer <token>.
 * Attaches decoded payload to req.user.
 * Returns 401 if token is missing or invalid.
 */
function auth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed authorization token.' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = auth;
