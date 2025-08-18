const rateLimit = require('express-rate-limit');
const globalLimiter = rateLimit({ windowMs: 15*60*1000, max: 100 });
const sensitiveLimiter = rateLimit({ windowMs: 60*1000, max: 10 });
const loginLimiter = rateLimit({ windowMs: 60*1000, max: 5, message: { error: 'Too many login attempts, please try again later.' } });
module.exports = { globalLimiter, sensitiveLimiter, loginLimiter };
