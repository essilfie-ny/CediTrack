const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const auth = require('../middleware/auth');

const valOrNull = (v) => (v !== undefined && v !== null && String(v).trim() !== '' ? String(v) : null);

router.use(auth);

router.get('/', (req, res, next) => {
  try {
    const reminders = db.prepare('SELECT * FROM bill_reminders WHERE user_id = ?').all(req.user.id);
    res.json({ data: reminders });
  } catch (error) {
    next(error);
  }
});

router.get('/upcoming', (req, res, next) => {
  try {
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    const dateStr = in30Days.toISOString().split('T')[0];
    
    const reminders = db.prepare(`
      SELECT * FROM bill_reminders 
      WHERE user_id = ? AND is_paid = 0 AND due_date <= ?
      ORDER BY due_date ASC
    `).all(req.user.id, dateStr);
    res.json({ data: reminders });
  } catch (error) {
    next(error);
  }
});

router.post('/', (req, res, next) => {
  try {
    const id = uuidv4();
    const { name, amount, currency, due_date, frequency, category_id, account_id, notes } = req.body;
    
    const nameVal = valOrNull(name) || 'Bill Reminder';
    const amountVal = parseInt(amount) || 0;
    const currVal = valOrNull(currency) || 'GHS';
    const dueDateVal = valOrNull(due_date) || new Date().toISOString().split('T')[0];
    const freqVal = valOrNull(frequency) || 'monthly';
    const catIdVal = valOrNull(category_id);
    const accIdVal = valOrNull(account_id);
    const notesVal = valOrNull(notes);

    db.prepare(`
      INSERT INTO bill_reminders 
      (id, user_id, name, amount, currency, due_date, frequency, category_id, account_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.id, nameVal, amountVal, currVal, dueDateVal, freqVal, catIdVal, accIdVal, notesVal);
    
    const reminder = db.prepare('SELECT * FROM bill_reminders WHERE id = ?').get(id);
    res.status(201).json({ data: reminder });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const { name, amount, due_date, frequency, category_id, account_id, notes } = req.body;
    
    const nameVal = valOrNull(name) || 'Bill Reminder';
    const amountVal = parseInt(amount) || 0;
    const dueDateVal = valOrNull(due_date) || new Date().toISOString().split('T')[0];
    const freqVal = valOrNull(frequency) || 'monthly';
    const catIdVal = valOrNull(category_id);
    const accIdVal = valOrNull(account_id);
    const notesVal = valOrNull(notes);

    db.prepare(`
      UPDATE bill_reminders 
      SET name = ?, amount = ?, due_date = ?, frequency = ?, category_id = ?, account_id = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(nameVal, amountVal, dueDateVal, freqVal, catIdVal, accIdVal, notesVal, req.params.id, req.user.id);
    
    const reminder = db.prepare('SELECT * FROM bill_reminders WHERE id = ?').get(req.params.id);
    res.json({ data: reminder });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/paid', (req, res, next) => {
  try {
    db.prepare(`UPDATE bill_reminders SET is_paid = 1, updated_at = datetime('now') WHERE id = ? AND user_id = ?`).run(req.params.id, req.user.id);
    res.json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    db.prepare('DELETE FROM bill_reminders WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
