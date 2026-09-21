const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const auth = require('../middleware/auth');
const messageParser = require('../services/messageParser');
const transactionEngine = require('../services/transactionEngine');

router.use(auth);

router.get('/', (req, res, next) => {
  try {
    const messages = db.prepare('SELECT * FROM imported_messages WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json({ data: messages });
  } catch (error) {
    next(error);
  }
});

router.post('/parse', (req, res, next) => {
  try {
    const raw_message = req.body.raw_message || req.body.message || '';
    const parsed = messageParser.parse(raw_message);
    
    const id = uuidv4();
    db.prepare(`
      INSERT INTO imported_messages (id, user_id, raw_message, parsed_data)
      VALUES (?, ?, ?, ?)
    `).run(id, req.user.id, raw_message, JSON.stringify(parsed || {}));

    res.json({ data: { id, parsed } });
  } catch (error) {
    next(error);
  }
});

router.post('/confirm', (req, res, next) => {
  try {
    const { message_id, transaction_data } = req.body;
    db.exec('BEGIN TRANSACTION');
    
    transaction_data.source_message_id = message_id;
    const txId = transactionEngine.addTransaction(req.user.id, transaction_data);
    
    db.prepare('UPDATE imported_messages SET status = "confirmed", transaction_id = ? WHERE id = ? AND user_id = ?').run(txId, message_id, req.user.id);
    
    db.exec('COMMIT');
    res.json({ data: { success: true, transaction_id: txId } });
  } catch (error) {
    db.exec('ROLLBACK');
    next(error);
  }
});

router.put('/:id/ignore', (req, res, next) => {
  try {
    db.prepare('UPDATE imported_messages SET status = "ignored" WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
