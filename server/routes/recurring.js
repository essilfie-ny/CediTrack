const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const auth = require('../middleware/auth');

const valOrNull = (v) => (v !== undefined && v !== null && String(v).trim() !== '' ? String(v) : null);

router.use(auth);

router.get('/', (req, res, next) => {
  try {
    const recurring = db.prepare('SELECT * FROM recurring_transactions WHERE user_id = ? AND is_active = 1').all(req.user.id);
    res.json({ data: recurring });
  } catch (error) {
    next(error);
  }
});

router.post('/', (req, res, next) => {
  try {
    const id = uuidv4();
    const { account_id, category_id, type, amount, currency, description, frequency, next_date } = req.body;
    
    const accIdVal = valOrNull(account_id);
    const catIdVal = valOrNull(category_id);
    const typeVal = valOrNull(type);
    const amountVal = parseInt(amount) || 0;
    const currVal = valOrNull(currency) || 'GHS';
    const descVal = valOrNull(description) || 'Recurring Item';
    const freqVal = valOrNull(frequency) || 'monthly';
    const nextDateVal = valOrNull(next_date) || new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO recurring_transactions 
      (id, user_id, account_id, category_id, type, amount, currency, description, frequency, next_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.id, accIdVal, catIdVal, typeVal, amountVal, currVal, descVal, freqVal, nextDateVal);
    
    const rec = db.prepare('SELECT * FROM recurring_transactions WHERE id = ?').get(id);
    res.status(201).json({ data: rec });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const { account_id, category_id, type, amount, description, frequency, next_date } = req.body;
    
    const accIdVal = valOrNull(account_id);
    const catIdVal = valOrNull(category_id);
    const typeVal = valOrNull(type);
    const amountVal = parseInt(amount) || 0;
    const descVal = valOrNull(description) || 'Recurring Item';
    const freqVal = valOrNull(frequency) || 'monthly';
    const nextDateVal = valOrNull(next_date) || new Date().toISOString().split('T')[0];

    db.prepare(`
      UPDATE recurring_transactions 
      SET account_id = ?, category_id = ?, type = ?, amount = ?, description = ?, frequency = ?, next_date = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(accIdVal, catIdVal, typeVal, amountVal, descVal, freqVal, nextDateVal, req.params.id, req.user.id);
    
    const rec = db.prepare('SELECT * FROM recurring_transactions WHERE id = ?').get(req.params.id);
    res.json({ data: rec });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    db.prepare(`UPDATE recurring_transactions SET is_active = 0, updated_at = datetime('now') WHERE id = ? AND user_id = ?`).run(req.params.id, req.user.id);
    res.json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
