const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const auth = require('../middleware/auth');
const { allDefaultCategories } = require('../config/defaultCategories');

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing required fields' });

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const id = uuidv4();

    db.exec('BEGIN TRANSACTION');
    db.prepare(`INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)`).run(id, name, email, passwordHash);

    const insertCat = db.prepare(`INSERT INTO categories (id, user_id, name, type, icon, color, is_default) VALUES (?, ?, ?, ?, ?, ?, 1)`);
    allDefaultCategories.forEach(cat => {
      insertCat.run(uuidv4(), id, cat.name, cat.type, cat.icon, cat.color);
    });
    db.exec('COMMIT');

    const token = jwt.sign({ id, email, name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ data: { token, user: { id, name, email } } });
  } catch (error) {
    db.exec('ROLLBACK');
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ data: { token, user: { id: user.id, name: user.name, email: user.email } } });
  } catch (error) {
    next(error);
  }
});

router.get('/me', auth, (req, res, next) => {
  try {
    const user = db.prepare('SELECT id, name, email, default_currency, onboarding_completed FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
});

// Update onboarding completed - NO demo data preloaded!
router.put('/onboarding', auth, (req, res, next) => {
  try {
    db.prepare('UPDATE users SET onboarding_completed = 1 WHERE id = ?').run(req.user.id);
    res.json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
