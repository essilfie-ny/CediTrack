const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const transactionEngine = require('../services/transactionEngine');
const { db } = require('../config/database');

router.use(auth);

router.get('/', (req, res, next) => {
  try {
    const transfers = db.prepare('SELECT * FROM transfers WHERE user_id = ? ORDER BY date DESC').all(req.user.id);
    res.json({ data: transfers });
  } catch (error) {
    next(error);
  }
});

router.post('/', (req, res, next) => {
  try {
    const id = transactionEngine.addTransfer(req.user.id, req.body);
    const transfer = db.prepare('SELECT * FROM transfers WHERE id = ?').get(id);
    res.status(201).json({ data: transfer });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    transactionEngine.deleteTransfer(req.user.id, req.params.id);
    res.json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
