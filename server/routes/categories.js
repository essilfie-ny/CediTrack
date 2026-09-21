const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', (req, res, next) => {
  try {
    let query = 'SELECT * FROM categories WHERE user_id = ? AND is_active = 1';
    const params = [req.user.id];
    
    if (req.query.type) {
      query += ' AND type = ?';
      params.push(req.query.type);
    }
    
    const categories = db.prepare(query).all(...params);
    res.json({ data: categories });
  } catch (error) {
    next(error);
  }
});

router.post('/', (req, res, next) => {
  try {
    const id = uuidv4();
    const { name, type, icon, color } = req.body;
    db.prepare(`
      INSERT INTO categories (id, user_id, name, type, icon, color, is_default)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(id, req.user.id, name, type, icon, color);
    
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    res.status(201).json({ data: category });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const { name, icon, color } = req.body;
    db.prepare(`
      UPDATE categories SET name = ?, icon = ?, color = ?
      WHERE id = ? AND user_id = ? AND is_default = 0
    `).run(name, icon, color, req.params.id, req.user.id);
    
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    res.json({ data: category });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    db.prepare('UPDATE categories SET is_active = 0 WHERE id = ? AND user_id = ? AND is_default = 0').run(req.params.id, req.user.id);
    res.json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
