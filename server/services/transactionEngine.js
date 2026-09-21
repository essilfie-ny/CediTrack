const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');

// Helper to ensure values passed to node:sqlite are never undefined
const valOrNull = (v) => (v !== undefined && v !== null && String(v).trim() !== '' ? String(v) : null);

class TransactionEngine {
  addTransaction(userId, data) {
    let id;
    try {
      db.exec('BEGIN TRANSACTION');
      
      id = uuidv4();
      const insertTx = db.prepare(`
        INSERT INTO transactions 
        (id, user_id, account_id, category_id, type, amount, currency, description, merchant, date, time, reference, payment_method)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const accountId = valOrNull(data.account_id);
      const categoryId = valOrNull(data.category_id);
      const type = valOrNull(data.type);
      const amount = parseInt(data.amount) || 0;
      const currency = valOrNull(data.currency) || 'GHS';
      const description = valOrNull(data.description);
      const merchant = valOrNull(data.merchant);
      const date = valOrNull(data.date) || new Date().toISOString().split('T')[0];
      const time = valOrNull(data.time) || '12:00';
      const reference = valOrNull(data.reference);
      const paymentMethod = valOrNull(data.payment_method);

      insertTx.run(
        id, userId, accountId, categoryId, type, 
        amount, currency, description, merchant, 
        date, time, reference, paymentMethod
      );

      const balanceChange = type === 'income' ? amount : -amount;
      db.prepare(`UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?`).run(balanceChange, accountId, userId);

      db.exec('COMMIT');
      return id;
    } catch (error) {
      try { db.exec('ROLLBACK'); } catch (rErr) {}
      throw error;
    }
  }

  editTransaction(userId, transactionId, data) {
    try {
      db.exec('BEGIN TRANSACTION');

      const oldTx = db.prepare('SELECT amount, type, account_id FROM transactions WHERE id = ? AND user_id = ?').get(transactionId, userId);
      if (!oldTx) throw new Error('Transaction not found');

      const oldBalanceChange = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
      db.prepare(`UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?`).run(oldBalanceChange, oldTx.account_id, userId);

      const accountId = valOrNull(data.account_id);
      const categoryId = valOrNull(data.category_id);
      const type = valOrNull(data.type);
      const amount = parseInt(data.amount) || 0;
      const description = valOrNull(data.description);
      const merchant = valOrNull(data.merchant);
      const date = valOrNull(data.date) || new Date().toISOString().split('T')[0];
      const time = valOrNull(data.time) || '12:00';

      const updateTx = db.prepare(`
        UPDATE transactions SET 
          account_id = ?, category_id = ?, type = ?, amount = ?, description = ?, merchant = ?, date = ?, time = ?
        WHERE id = ? AND user_id = ?
      `);
      updateTx.run(
        accountId, categoryId, type, amount, description, merchant, date, time,
        transactionId, userId
      );

      const newBalanceChange = type === 'income' ? amount : -amount;
      db.prepare(`UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?`).run(newBalanceChange, accountId, userId);

      db.exec('COMMIT');
    } catch (error) {
      try { db.exec('ROLLBACK'); } catch (rErr) {}
      throw error;
    }
  }

  deleteTransaction(userId, transactionId) {
    try {
      db.exec('BEGIN TRANSACTION');
      const oldTx = db.prepare('SELECT amount, type, account_id FROM transactions WHERE id = ? AND user_id = ?').get(transactionId, userId);
      if (oldTx) {
        const oldBalanceChange = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
        db.prepare(`UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?`).run(oldBalanceChange, oldTx.account_id, userId);
        db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(transactionId, userId);
      }
      db.exec('COMMIT');
    } catch (error) {
      try { db.exec('ROLLBACK'); } catch (rErr) {}
      throw error;
    }
  }

  addTransfer(userId, data) {
    let id;
    try {
      db.exec('BEGIN TRANSACTION');
      id = uuidv4();
      
      const insertTransfer = db.prepare(`
        INSERT INTO transfers (id, user_id, from_account_id, to_account_id, amount, date, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const fromAccountId = valOrNull(data.from_account_id);
      const toAccountId = valOrNull(data.to_account_id);
      const amount = parseInt(data.amount) || 0;
      const date = valOrNull(data.date) || new Date().toISOString().split('T')[0];
      const description = valOrNull(data.description);

      insertTransfer.run(id, userId, fromAccountId, toAccountId, amount, date, description);

      db.prepare(`UPDATE accounts SET balance = balance - ? WHERE id = ? AND user_id = ?`).run(amount, fromAccountId, userId);
      db.prepare(`UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?`).run(amount, toAccountId, userId);

      db.exec('COMMIT');
      return id;
    } catch (error) {
      try { db.exec('ROLLBACK'); } catch (rErr) {}
      throw error;
    }
  }

  deleteTransfer(userId, transferId) {
    try {
      db.exec('BEGIN TRANSACTION');
      const oldTr = db.prepare('SELECT amount, from_account_id, to_account_id FROM transfers WHERE id = ? AND user_id = ?').get(transferId, userId);
      if (oldTr) {
        db.prepare(`UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?`).run(oldTr.amount, oldTr.from_account_id, userId);
        db.prepare(`UPDATE accounts SET balance = balance - ? WHERE id = ? AND user_id = ?`).run(oldTr.amount, oldTr.to_account_id, userId);
        db.prepare('DELETE FROM transfers WHERE id = ? AND user_id = ?').run(transferId, userId);
      }
      db.exec('COMMIT');
    } catch (error) {
      try { db.exec('ROLLBACK'); } catch (rErr) {}
      throw error;
    }
  }

  getBalance(userId) {
    const row = db.prepare('SELECT SUM(balance) as total FROM accounts WHERE user_id = ?').get(userId);
    return row?.total || 0;
  }

  getSummary(userId, startDate, endDate) {
    const txs = db.prepare(`
      SELECT type, SUM(amount) as total FROM transactions 
      WHERE user_id = ? AND date >= ? AND date <= ?
      GROUP BY type
    `).all(userId, startDate, endDate);
    
    let income = 0;
    let expenses = 0;
    
    txs.forEach(t => {
      if (t.type === 'income') income += t.total;
      if (t.type === 'expense') expenses += t.total;
    });

    return { income, expenses, net: income - expenses };
  }

  detectDuplicate(userId, amount, date, description) {
    return false;
  }
}

module.exports = new TransactionEngine();
