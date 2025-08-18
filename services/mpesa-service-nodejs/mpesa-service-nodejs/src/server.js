const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const winston = require('winston');
require('dotenv').config();

const mpesaRouter = require('./routes/mpesa');

const app = express();
const PORT = process.env.PORT || 5004;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [ new winston.transports.Console() ]
});

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGINS?.split(',') || ['*'], credentials: true }));
app.use(rateLimit({ windowMs: 15*60*1000, max: 100 }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const specs = swaggerJsdoc({
  definition: { openapi: '3.0.0', info: { title: 'Elastic FS M-Pesa Service', version: '1.0.0' }, servers: [{ url:`http://localhost:${PORT}`, description:'Dev' }] },
  apis: ['./src/routes/*.js']
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

app.get('/health', (_req, res)=> res.json({ status:'healthy', ts:new Date().toISOString() }));

app.use('/api/v1/mpesa', mpesaRouter);

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err,_req,res,_next)=>{ logger.error('Error:', err); res.status(err.status||500).json({ error: err.message||'Internal server error' }); });
app.use('*', (_req,res)=> res.status(404).json({ error:'Route not found' }));

app.listen(PORT,'0.0.0.0', ()=>{ logger.info(`M-Pesa service running on :${PORT}`); logger.info(`Docs at /docs`); });
module.exports = app;
