const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const userRoles = req.user.roles || [];
    const ok = roles.some(r => userRoles.includes(r));
    if (!ok) return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  };
};

module.exports = { authenticateToken, requireRole };
