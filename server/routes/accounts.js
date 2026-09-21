const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', (req, res, next) => {
  try {
    const accounts = db.prepare('SELECT * FROM accounts WHERE user_id = ? AND is_active = 1').all(req.user.id);
    res.json({ data: accounts });
  } catch (error) {
    next(error);
  }
});

router.post('/', (req, res, next) => {
  try {
    const id = uuidv4();
    const { name, type, icon, balance, color } = req.body;
    db.prepare(`
      INSERT INTO accounts (id, user_id, name, type, icon, balance, color) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.id, name, type, icon || 'wallet2', balance || 0, color || '#4f46e5');
    
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
    res.status(201).json({ data: account });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const { name, type, icon, color, balance } = req.body;
    if (balance !== undefined) {
      db.prepare(`
        UPDATE accounts SET name = ?, type = ?, icon = ?, color = ?, balance = ?, updated_at = datetime('now')
        WHERE id = ? AND user_id = ?
      `).run(name, type, icon || 'wallet2', color || '#3b82f6', balance, req.params.id, req.user.id);
    } else {
      db.prepare(`
        UPDATE accounts SET name = ?, type = ?, icon = ?, color = ?, updated_at = datetime('now')
        WHERE id = ? AND user_id = ?
      `).run(name, type, icon || 'wallet2', color || '#3b82f6', req.params.id, req.user.id);
    }
    
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
    res.json({ data: account });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/balance', (req, res, next) => {
  try {
    const { balance } = req.body;
    db.prepare(`
      UPDATE accounts SET balance = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(balance, req.params.id, req.user.id);

    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
    res.json({ data: account });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    db.prepare(`UPDATE accounts SET is_active = 0, updated_at = datetime('now') WHERE id = ? AND user_id = ?`).run(req.params.id, req.user.id);
    res.json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
