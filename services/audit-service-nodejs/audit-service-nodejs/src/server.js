const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const winston = require('winston');
const { startConsumer } = require('./queue/consumer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8008;

// Logger (console only)
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [ new winston.transports.Console() ]
});

// Security & basics
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGINS?.split(',') || ['*'], credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Elastic FS Audit Service', version: '1.0.0' },
    servers: [{ url: `http://localhost:${PORT}`, description: 'Dev' }]
  },
  apis: ['./src/routes/*.js']
};
const specs = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Health
app.get('/health', (_req, res) => res.json({ status: 'healthy', timestamp: new Date().toISOString() }));

// Routes
app.use('/api/v1/audit', require('./routes/audit'));

// Errors
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// 404
app.use('*', (_req, res) => res.status(404).json({ error: 'Route not found' }));

// Start
app.listen(PORT, '0.0.0.0', async () => {
  logger.info(`Audit service running on :${PORT}`);
  logger.info(`Docs at /docs`);
  try {
    await startConsumer(); // starts only if RABBITMQ_URL is set
  } catch (e) {
    logger.warn(`RabbitMQ consumer not started: ${e.message}`);
  }
});

module.exports = app;
