const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const auth = require('../middleware/auth');
const insightsEngine = require('../services/insightsEngine');
const transactionEngine = require('../services/transactionEngine');

router.use(auth);

// Monthly report
router.get('/monthly', (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || (new Date().getMonth() + 1);
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
    const summary = transactionEngine.getSummary(req.user.id, startDate, endDate);
    
    // Category breakdown for this month
    const categories = db.prepare(`
      SELECT c.name, c.icon, c.color, SUM(t.amount) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND t.type = 'expense' AND t.date >= ? AND t.date <= ?
      GROUP BY c.id
      ORDER BY total DESC
    `).all(req.user.id, startDate, endDate);

    // Previous month for comparison
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevStartDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
    const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
    const prevEndDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevLastDay).padStart(2, '0')}`;
    const prevSummary = transactionEngine.getSummary(req.user.id, prevStartDate, prevEndDate);

    res.json({ 
      data: {
        ...summary,
        categories,
        previousMonth: prevSummary,
        month,
        year
      }
    });
  } catch (error) {
    next(error);
  }
});

// Insights
router.get('/insights', (req, res, next) => {
  try {
    const insights = insightsEngine.getInsights(req.user.id);
    res.json({ data: insights });
  } catch (error) {
    next(error);
  }
});

// Category breakdown
router.get('/category-breakdown', (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate required' });
    }
    const breakdown = db.prepare(`
      SELECT c.name, c.icon, c.color, SUM(t.amount) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND t.type = 'expense' AND t.date >= ? AND t.date <= ?
      GROUP BY c.id
      ORDER BY total DESC
    `).all(req.user.id, startDate, endDate);
    
    res.json({ data: breakdown });
  } catch (error) {
    next(error);
  }
});

// Spending over time
router.get('/spending-over-time', (req, res, next) => {
  try {
    const { period, startDate, endDate } = req.query;
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = endDate || now.toISOString().split('T')[0];

    let sql;
    if (period === 'monthly') {
      sql = `
        SELECT substr(date, 1, 7) as period_key, SUM(amount) as total
        FROM transactions
        WHERE user_id = ? AND type = 'expense' AND date >= ? AND date <= ?
        GROUP BY period_key
        ORDER BY period_key ASC
      `;
    } else if (period === 'weekly') {
      // Group by ISO week
      sql = `
        SELECT substr(date, 1, 7) || '-W' || 
          CAST((CAST(substr(date, 9, 2) AS INTEGER) - 1) / 7 + 1 AS TEXT) as period_key, 
          SUM(amount) as total
        FROM transactions
        WHERE user_id = ? AND type = 'expense' AND date >= ? AND date <= ?
        GROUP BY period_key
        ORDER BY period_key ASC
      `;
    } else {
      // Default: daily
      sql = `
        SELECT date as period_key, SUM(amount) as total
        FROM transactions
        WHERE user_id = ? AND type = 'expense' AND date >= ? AND date <= ?
        GROUP BY date
        ORDER BY date ASC
      `;
    }

    const data = db.prepare(sql).all(req.user.id, start, end);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
