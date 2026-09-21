const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const auth = require('../middleware/auth');
const budgetService = require('../services/budgetService');

const valOrNull = (v) => (v !== undefined && v !== null && String(v).trim() !== '' ? String(v) : null);

router.use(auth);

router.get('/', (req, res, next) => {
  try {
    const budgets = budgetService.getBudgetsWithSpending(req.user.id);
    res.json({ data: budgets });
  } catch (error) {
    next(error);
  }
});

router.get('/suggestions', (req, res, next) => {
  try {
    res.json({ data: [] });
  } catch (error) {
    next(error);
  }
});

router.post('/', (req, res, next) => {
  try {
    db.exec('BEGIN TRANSACTION');
    const id = uuidv4();
    const { name, period, amount, start_date, end_date, categories } = req.body;
    
    const startDateVal = valOrNull(start_date) || new Date().toISOString().split('T')[0];
    const endDateVal = valOrNull(end_date);
    const amountVal = parseInt(amount) || 0;

    db.prepare(`
      INSERT INTO budgets (id, user_id, name, period, amount, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.id, name, period || 'monthly', amountVal, startDateVal, endDateVal);
    
    if (categories && Array.isArray(categories)) {
      const insertCat = db.prepare('INSERT INTO budget_categories (id, budget_id, category_id, amount) VALUES (?, ?, ?, ?)');
      categories.forEach(cat => {
        if (cat.category_id) {
          insertCat.run(uuidv4(), id, cat.category_id, parseInt(cat.amount) || amountVal);
        }
      });
    }
    
    db.exec('COMMIT');
    res.status(201).json({ data: { id, name, period, amount: amountVal } });
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch (rErr) {}
    next(error);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const { name, period, amount, start_date, end_date } = req.body;
    const startDateVal = valOrNull(start_date) || new Date().toISOString().split('T')[0];
    const endDateVal = valOrNull(end_date);
    const amountVal = parseInt(amount) || 0;

    db.prepare(`
      UPDATE budgets SET name = ?, period = ?, amount = ?, start_date = ?, end_date = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(name, period || 'monthly', amountVal, startDateVal, endDateVal, req.params.id, req.user.id);
    res.json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    db.prepare('DELETE FROM budgets WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
