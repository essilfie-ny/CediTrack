const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbPath = process.env.DB_PATH || './data/ceditrack.db';

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      default_currency TEXT DEFAULT 'GHS',
      onboarding_completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('cash','bank','mobile_money','savings','credit_card','other')),
      icon TEXT DEFAULT 'wallet2',
      balance INTEGER DEFAULT 0,
      color TEXT DEFAULT '#4f46e5',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('expense','income')),
      icon TEXT NOT NULL,
      color TEXT DEFAULT '#64748b',
      is_default INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      account_id TEXT NOT NULL REFERENCES accounts(id),
      category_id TEXT REFERENCES categories(id),
      type TEXT NOT NULL CHECK(type IN ('income','expense')),
      amount INTEGER NOT NULL,
      currency TEXT DEFAULT 'GHS',
      description TEXT,
      merchant TEXT,
      date TEXT NOT NULL,
      time TEXT,
      reference TEXT,
      payment_method TEXT,
      is_recurring INTEGER DEFAULT 0,
      recurring_id TEXT,
      source_message_id TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transfers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      from_account_id TEXT NOT NULL REFERENCES accounts(id),
      to_account_id TEXT NOT NULL REFERENCES accounts(id),
      amount INTEGER NOT NULL,
      currency TEXT DEFAULT 'GHS',
      description TEXT,
      date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      period TEXT NOT NULL CHECK(period IN ('weekly','monthly','yearly')),
      amount INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS budget_categories (
      id TEXT PRIMARY KEY,
      budget_id TEXT NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
      category_id TEXT NOT NULL REFERENCES categories(id),
      amount INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS savings_goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      target_amount INTEGER NOT NULL,
      current_amount INTEGER DEFAULT 0,
      currency TEXT DEFAULT 'GHS',
      target_date TEXT,
      icon TEXT DEFAULT 'bullseye',
      color TEXT DEFAULT '#4f46e5',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      account_id TEXT NOT NULL REFERENCES accounts(id),
      category_id TEXT REFERENCES categories(id),
      type TEXT NOT NULL CHECK(type IN ('income','expense')),
      amount INTEGER NOT NULL,
      currency TEXT DEFAULT 'GHS',
      description TEXT NOT NULL,
      frequency TEXT NOT NULL CHECK(frequency IN ('daily','weekly','biweekly','monthly','yearly')),
      next_date TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bill_reminders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      amount INTEGER,
      currency TEXT DEFAULT 'GHS',
      due_date TEXT NOT NULL,
      frequency TEXT CHECK(frequency IN ('once','weekly','monthly','yearly')),
      category_id TEXT REFERENCES categories(id),
      account_id TEXT REFERENCES accounts(id),
      is_paid INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS imported_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      raw_message TEXT NOT NULL,
      parsed_data TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','ignored','failed')),
      transaction_id TEXT REFERENCES transactions(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info' CHECK(type IN ('info','success','warning','error')),
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      key TEXT NOT NULL,
      value TEXT,
      UNIQUE(user_id, key)
    );
  `);

  // Create indexes (using separate exec calls for IF NOT EXISTS compatibility)
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date)',
    'CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id)',
    'CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id)',
    'CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_goals_user ON savings_goals(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_recurring_user ON recurring_transactions(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_reminders_user ON bill_reminders(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_messages_user ON imported_messages(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)'
  ];
  indexes.forEach(sql => db.exec(sql));
}

module.exports = { db, initDb };
