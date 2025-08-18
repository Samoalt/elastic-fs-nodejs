const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const winston = require('winston');
require('dotenv').config();

const notificationsRouter = require('./routes/notifications');
const { startConsumer } = require('./queue/consumer');

const app = express();
const PORT = process.env.PORT || 5006;

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [ new winston.transports.Console() ]
});

// Security & basics
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGINS?.split(',') || ['*'], credentials: true }));
app.use(rateLimit({ windowMs: 15*60*1000, max: 100 }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger
const specs = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Elastic FS Notification Service', version: '1.0.0' },
    servers: [{ url: `http://localhost:${PORT}`, description: 'Dev' }]
  },
  apis: ['./src/routes/*.js']
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Health
app.get('/health', (_req, res) => res.json({ status: 'healthy', ts: new Date().toISOString() }));

// Routes
app.use('/api/v1/notifications', notificationsRouter);

// Errors
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// 404
app.use('*', (_req, res) => res.status(404).json({ error: 'Route not found' }));

app.listen(PORT, '0.0.0.0', async () => {
  logger.info(`Notification service running on :${PORT} (docs at /docs)`);
  try { await startConsumer(); } catch (e) { logger.warn(`RabbitMQ consumer not started: ${e.message}`); }
});

module.exports = app;
