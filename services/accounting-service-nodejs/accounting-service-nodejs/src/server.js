const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { AppError } = require('./utils/errors');
const accountsRouter = require('./routes/accounts');
const journalsRouter = require('./routes/journals');
const reportsRouter = require('./routes/reports');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGINS?.split(',') || '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('tiny'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'accounting' }));

// Routes
app.use('/accounts', accountsRouter);
app.use('/journals', journalsRouter);
app.use('/reports', reportsRouter);

// 404
app.use((req, _res, next) => next(new AppError('Not found', 404)));

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const body = { error: err.message || 'Server error' };
  if (err.meta) body.meta = err.meta;
  res.status(status).json(body);
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`accounting-service listening on :${port}`));
