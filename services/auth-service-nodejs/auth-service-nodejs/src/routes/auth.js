const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  first_name: Joi.string().min(1).required(),
  last_name: Joi.string().min(1).required(),
  phone: Joi.string().allow('', null)
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const { email, password, first_name, last_name, phone } = value;

    const exists = await db.query('SELECT 1 FROM users WHERE email=$1', [email]);
    if (exists.rows.length) return res.status(409).json({ error: 'User already exists' });

    const password_hash = await bcrypt.hash(password, 12);
    const result = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, email, first_name, last_name, created_at`,
      [email, password_hash, first_name, last_name, phone]
    );
    const user = result.rows[0];

    // Default role "user"
    const role = await db.query('SELECT id FROM roles WHERE name=$1', ['user']);
    if (role.rows.length) {
      await db.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1,$2)', [user.id, role.rows[0].id]);
    }

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (e) {
    console.error('Registration error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const { email, password } = value;

    const q = await db.query(
      `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.is_active,
              ARRAY_AGG(r.name) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.email = $1
       GROUP BY u.id`,
      [email]
    );
    if (!q.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = q.rows[0];
    if (!user.is_active) return res.status(401).json({ error: 'Account is deactivated' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { user_id: user.id, email: user.email, roles: (user.roles || []).filter(Boolean) },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({ message: 'Login successful', token, user: {
      id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name,
      roles: (user.roles || []).filter(Boolean)
    }});
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// Current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT u.id, u.email, u.first_name, u.last_name,
             ARRAY_AGG(r.name) FILTER (WHERE r.name IS NOT NULL) AS roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1
      GROUP BY u.id
    `, [req.user.user_id]);
    res.json(rows[0] || null);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign role (admin only)
router.post('/roles/assign', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const schema = Joi.object({
      userId: Joi.number().integer().required(),
      role: Joi.string().valid('admin','user','manager').required()
    });
    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const role = await db.query('SELECT id FROM roles WHERE name=$1', [value.role]);
    if (!role.rows.length) return res.status(400).json({ error: 'Unknown role' });
    await db.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [value.userId, role.rows[0].id]
    );
    res.json({ message: 'Role assigned' });
  } catch (e) {
    console.error('Assign role error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
