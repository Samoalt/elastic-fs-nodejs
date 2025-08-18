const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const winston = require('winston');
const db = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGINS?.split(',') || ['*'], credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Elastic FS Auth Service', version: '1.0.0' },
    servers: [{ url: `http://localhost:${PORT}`, description: 'Dev' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js']
};
const specs = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Health
app.get('/health', (_req, res) => res.json({ status: 'healthy', ts: new Date().toISOString() }));

// Routes
app.use('/api/v1/auth', require('./routes/auth'));

// Errors
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// 404
app.use('*', (_req, res) => res.status(404).json({ error: 'Route not found' }));

(async () => {
  await db.connect();
  app.listen(PORT, '0.0.0.0', () => logger.info(`Auth service running on :${PORT} (docs at /docs)`));
})();

module.exports = app;
