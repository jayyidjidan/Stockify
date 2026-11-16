/**
 * Global Express error handler.
 * Logs the error and returns a JSON response with an appropriate HTTP status.
 *
 * Usage: app.use(errorHandler) — must be registered LAST.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
