const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const winston = require('winston');
require('dotenv').config();

const paymentsRouter = require('./routes/payments');
const webhooksRouter = require('./routes/webhooks');

const app = express();
const PORT = process.env.PORT || 5003;

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'payments-service.log' })
  ]
});

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGINS?.split(',') || ['*'], credentials: true }));

// Rate limiting
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger
const specs = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Elastic FS Payments-Service Service', version: '1.0.0', description: 'Payments Service service for Elastic FS' },
    servers: [{ url: `http://localhost:${PORT}`, description: 'Development server' }]
  },
  apis: ['./src/routes/*.js']
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Health
app.get('/health', (_req, res) => res.json({ status: 'healthy', timestamp: new Date().toISOString() }));

// Routes
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1/payments/webhooks', webhooksRouter);

// Errors
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// 404
app.use('*', (_req, res) => res.status(404).json({ error: 'Route not found' }));

// Start
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Payments-Service service running on port ${PORT}`);
  logger.info(`Documentation available at http://localhost:${PORT}/docs`);
});

module.exports = app;
