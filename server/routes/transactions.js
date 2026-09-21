const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const auth = require('../middleware/auth');
const transactionEngine = require('../services/transactionEngine');

router.use(auth);

// List transactions with filters and pagination
router.get('/', (req, res, next) => {
  try {
    const { type, category, account, startDate, endDate, search, limit, page } = req.query;
    
    let sql = `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color, a.name as account_name
               FROM transactions t
               LEFT JOIN categories c ON t.category_id = c.id
               LEFT JOIN accounts a ON t.account_id = a.id
               WHERE t.user_id = ?`;
    const params = [req.user.id];

    if (type && type !== 'all') {
      sql += ` AND t.type = ?`;
      params.push(type);
    }
    if (category) {
      sql += ` AND t.category_id = ?`;
      params.push(category);
    }
    if (account) {
      sql += ` AND t.account_id = ?`;
      params.push(account);
    }
    if (startDate) {
      sql += ` AND t.date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND t.date <= ?`;
      params.push(endDate);
    }
    if (search) {
      sql += ` AND (t.description LIKE ? OR t.merchant LIKE ? OR t.notes LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ` ORDER BY t.date DESC, t.time DESC`;

    if (limit) {
      const lim = parseInt(limit) || 20;
      const pg = parseInt(page) || 1;
      const offset = (pg - 1) * lim;
      sql += ` LIMIT ? OFFSET ?`;
      params.push(lim, offset);
    }

    const txs = db.prepare(sql).all(...params);
    res.json({ data: txs });
  } catch (error) {
    next(error);
  }
});

// Period summary
router.get('/summary', (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }
    const summary = transactionEngine.getSummary(req.user.id, startDate, endDate);
    res.json({ data: summary });
  } catch (error) {
    next(error);
  }
});

// Single transaction
router.get('/:id', (req, res, next) => {
  try {
    const tx = db.prepare(`
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color, a.name as account_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE t.id = ? AND t.user_id = ?
    `).get(req.params.id, req.user.id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ data: tx });
  } catch (error) {
    next(error);
  }
});

// Create transaction
router.post('/', (req, res, next) => {
  try {
    const { account_id, type, amount } = req.body;
    if (!account_id || !type || !amount) {
      return res.status(400).json({ error: 'account_id, type, and amount are required' });
    }
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'type must be income or expense' });
    }
    if (amount <= 0) {
      return res.status(400).json({ error: 'amount must be positive' });
    }

    const id = transactionEngine.addTransaction(req.user.id, req.body);
    const tx = db.prepare(`
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(id);
    res.status(201).json({ data: tx });
  } catch (error) {
    next(error);
  }
});

// Update transaction
router.put('/:id', (req, res, next) => {
  try {
    transactionEngine.editTransaction(req.user.id, req.params.id, req.body);
    const tx = db.prepare(`
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(req.params.id);
    res.json({ data: tx });
  } catch (error) {
    next(error);
  }
});

// Delete transaction
router.delete('/:id', (req, res, next) => {
  try {
    transactionEngine.deleteTransaction(req.user.id, req.params.id);
    res.json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
