const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const auth = require('../middleware/auth');

const valOrNull = (v) => (v !== undefined && v !== null && String(v).trim() !== '' ? String(v) : null);

router.use(auth);

router.get('/', (req, res, next) => {
  try {
    const goals = db.prepare('SELECT * FROM savings_goals WHERE user_id = ? AND is_active = 1').all(req.user.id);
    res.json({ data: goals });
  } catch (error) {
    next(error);
  }
});

router.post('/', (req, res, next) => {
  try {
    const id = uuidv4();
    const { name, target_amount, current_amount, currency, target_date, icon, color } = req.body;
    
    const nameVal = valOrNull(name);
    const targetAmtVal = parseInt(target_amount) || 0;
    const currentAmtVal = parseInt(current_amount) || 0;
    const currVal = valOrNull(currency) || 'GHS';
    const targetDateVal = valOrNull(target_date);
    const iconVal = valOrNull(icon) || 'bullseye';
    const colorVal = valOrNull(color) || '#4f46e5';

    db.prepare(`
      INSERT INTO savings_goals (id, user_id, name, target_amount, current_amount, currency, target_date, icon, color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.id, nameVal, targetAmtVal, currentAmtVal, currVal, targetDateVal, iconVal, colorVal);
    
    const goal = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(id);
    res.status(201).json({ data: goal });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const { name, target_amount, target_date, icon, color } = req.body;
    const nameVal = valOrNull(name);
    const targetAmtVal = parseInt(target_amount) || 0;
    const targetDateVal = valOrNull(target_date);
    const iconVal = valOrNull(icon) || 'bullseye';
    const colorVal = valOrNull(color) || '#4f46e5';

    db.prepare(`
      UPDATE savings_goals SET name = ?, target_amount = ?, target_date = ?, icon = ?, color = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(nameVal, targetAmtVal, targetDateVal, iconVal, colorVal, req.params.id, req.user.id);
    
    const goal = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(req.params.id);
    res.json({ data: goal });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/contribute', (req, res, next) => {
  try {
    const amountVal = parseInt(req.body.amount) || 0;
    db.prepare(`
      UPDATE savings_goals SET current_amount = current_amount + ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(amountVal, req.params.id, req.user.id);
    
    const goal = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(req.params.id);
    res.json({ data: goal });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    db.prepare(`UPDATE savings_goals SET is_active = 0, updated_at = datetime('now') WHERE id = ? AND user_id = ?`).run(req.params.id, req.user.id);
    res.json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
