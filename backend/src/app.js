const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const routes = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin like curl or mobile apps
      if (!origin || origin === allowedOrigin || origin === 'http://localhost:5173' || origin === 'http://127.0.0.1:5173') {
        callback(null, true);
      } else {
        callback(null, true); // Dev-friendly fallback
      }
    },
    credentials: true,
  })
);

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/v1/auth/login', authLimiter);

app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'stockify-backend',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1', routes);

app.use(errorHandler);

module.exports = app;
