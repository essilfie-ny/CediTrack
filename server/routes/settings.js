const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', (req, res, next) => {
  try {
    const settings = db.prepare('SELECT key, value FROM settings WHERE user_id = ?').all(req.user.id);
    const settingsObj = settings.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
    res.json({ data: settingsObj });
  } catch (error) {
    next(error);
  }
});

router.put('/', (req, res, next) => {
  try {
    db.exec('BEGIN TRANSACTION');
    const settings = req.body;
    
    for (const [key, value] of Object.entries(settings)) {
      db.prepare(`
        INSERT INTO settings (id, user_id, key, value) 
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, key) DO UPDATE SET value = ?
      `).run(uuidv4(), req.user.id, key, value, value);
    }
    
    db.exec('COMMIT');
    res.json({ data: { success: true } });
  } catch (error) {
    db.exec('ROLLBACK');
    next(error);
  }
});

module.exports = router;
