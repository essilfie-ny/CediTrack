const { v4: uuidv4 } = require('uuid');
const { db } = require('./database');
const { allDefaultCategories } = require('./defaultCategories');

function seedDemoData(userId) {
  try {
    db.exec('BEGIN TRANSACTION');

    // Ensure user has categories
    const existingCats = db.prepare('SELECT COUNT(*) as count FROM categories WHERE user_id = ?').get(userId);
    if (existingCats.count === 0) {
      const insertCat = db.prepare(`
        INSERT INTO categories (id, user_id, name, type, icon, color, is_default)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `);
      allDefaultCategories.forEach(cat => {
        insertCat.run(uuidv4(), userId, cat.name, cat.type, cat.icon, cat.color);
      });
    }

    const categories = db.prepare('SELECT id, name, type FROM categories WHERE user_id = ?').all(userId);
    const getCat = (name, type) => categories.find(c => c.name === name && c.type === type)?.id;

    // Accounts
    const cashId = uuidv4();
    const momoId = uuidv4();
    const bankId = uuidv4();
    const savingsId = uuidv4();

    const accounts = [
      { id: cashId, name: 'Cash', type: 'cash', icon: 'cash-stack', balance: 0, color: '#22c55e' },
      { id: momoId, name: 'Mobile Money', type: 'mobile_money', icon: 'phone', balance: 0, color: '#fbbf24' },
      { id: bankId, name: 'Bank Account', type: 'bank', icon: 'bank', balance: 0, color: '#3b82f6' },
      { id: savingsId, name: 'Savings Account', type: 'savings', icon: 'piggy-bank', balance: 0, color: '#8b5cf6' }
    ];

    const insertAccount = db.prepare(`
      INSERT INTO accounts (id, user_id, name, type, icon, balance, color) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    accounts.forEach(acc => insertAccount.run(acc.id, userId, acc.name, acc.type, acc.icon, acc.balance, acc.color));

    // Helper to create dated transactions
    const now = new Date();
    const thisMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = lastMonth.getFullYear() + '-' + String(lastMonth.getMonth() + 1).padStart(2, '0');

    const insertTx = db.prepare(`
      INSERT INTO transactions (id, user_id, account_id, category_id, type, amount, currency, description, merchant, date, time)
      VALUES (?, ?, ?, ?, ?, ?, 'GHS', ?, ?, ?, ?)
    `);
    const updateBalance = db.prepare(`UPDATE accounts SET balance = balance + ? WHERE id = ?`);

    function addTx(accountId, categoryName, categoryType, type, amountGHS, description, merchant, day, month, time) {
      const amount = Math.round(amountGHS * 100);
      const dateStr = month + '-' + String(day).padStart(2, '0');
      const catId = getCat(categoryName, categoryType) || categories[0].id;
      insertTx.run(uuidv4(), userId, accountId, catId, type, amount, description, merchant, dateStr, time || '12:00');
      const balanceChange = type === 'income' ? amount : -amount;
      updateBalance.run(balanceChange, accountId);
    }

    // ===== LAST MONTH TRANSACTIONS =====
    // Salary
    addTx(bankId, 'Salary', 'income', 'income', 4000, 'Monthly Salary', 'Employer Ltd', 25, lastMonthStr, '09:00');
    // Freelance
    addTx(momoId, 'Freelance', 'income', 'income', 600, 'Website Design Project', 'Client - Kofi', 15, lastMonthStr, '14:30');

    // Food expenses
    addTx(momoId, 'Food & Dining', 'expense', 'expense', 45, 'Lunch', 'Papaye Restaurant', 3, lastMonthStr, '12:30');
    addTx(cashId, 'Food & Dining', 'expense', 'expense', 28, 'Street food', 'Local vendor', 5, lastMonthStr, '13:00');
    addTx(momoId, 'Food & Dining', 'expense', 'expense', 55, 'Dinner', 'KFC Ghana', 8, lastMonthStr, '19:00');
    addTx(cashId, 'Food & Dining', 'expense', 'expense', 35, 'Groceries', 'Melcom', 12, lastMonthStr, '10:00');
    addTx(momoId, 'Food & Dining', 'expense', 'expense', 60, 'Weekend lunch', 'Burger King', 16, lastMonthStr, '13:30');
    addTx(cashId, 'Food & Dining', 'expense', 'expense', 40, 'Breakfast supplies', 'ShopRite', 20, lastMonthStr, '08:00');
    addTx(momoId, 'Food & Dining', 'expense', 'expense', 32, 'Snacks', 'MaxMart', 24, lastMonthStr, '15:00');

    // Transport
    addTx(cashId, 'Transport', 'expense', 'expense', 15, 'Uber ride', 'Uber', 2, lastMonthStr, '08:30');
    addTx(cashId, 'Transport', 'expense', 'expense', 20, 'Trotro', '', 7, lastMonthStr, '07:45');
    addTx(momoId, 'Transport', 'expense', 'expense', 25, 'Bolt ride', 'Bolt', 14, lastMonthStr, '18:00');
    addTx(cashId, 'Transport', 'expense', 'expense', 18, 'Fuel', 'Total Energies', 19, lastMonthStr, '16:00');
    addTx(cashId, 'Transport', 'expense', 'expense', 22, 'Uber ride', 'Uber', 22, lastMonthStr, '09:15');

    // Bills
    addTx(bankId, 'Bills & Utilities', 'expense', 'expense', 250, 'Internet Bill', 'Vodafone', 5, lastMonthStr, '10:00');
    addTx(bankId, 'Bills & Utilities', 'expense', 'expense', 150, 'Electricity', 'ECG', 10, lastMonthStr, '11:00');
    addTx(bankId, 'Rent', 'expense', 'expense', 1000, 'Monthly Rent', 'Landlord', 1, lastMonthStr, '09:00');

    // Shopping
    addTx(momoId, 'Shopping', 'expense', 'expense', 200, 'New headphones', 'Telefonika', 11, lastMonthStr, '14:00');
    addTx(cashId, 'Shopping', 'expense', 'expense', 85, 'Clothing', 'Accra Mall', 18, lastMonthStr, '16:30');

    // Entertainment
    addTx(momoId, 'Entertainment', 'expense', 'expense', 50, 'Movie night', 'Silverbird Cinema', 9, lastMonthStr, '20:00');
    addTx(momoId, 'Entertainment', 'expense', 'expense', 70, 'Concert ticket', 'Eventbrite', 21, lastMonthStr, '10:00');

    // Subscriptions & Data
    addTx(momoId, 'Mobile Data', 'expense', 'expense', 30, 'Monthly data bundle', 'MTN', 1, lastMonthStr, '08:00');
    addTx(momoId, 'Airtime', 'expense', 'expense', 15, 'Airtime top-up', 'MTN', 10, lastMonthStr, '09:30');
    addTx(momoId, 'Subscriptions', 'expense', 'expense', 45, 'Netflix subscription', 'Netflix', 3, lastMonthStr, '00:00');

    // ===== THIS MONTH TRANSACTIONS =====
    // Salary
    addTx(bankId, 'Salary', 'income', 'income', 4000, 'Monthly Salary', 'Employer Ltd', 1, thisMonth, '09:00');
    // Freelance
    addTx(momoId, 'Freelance', 'income', 'income', 800, 'Mobile App Design', 'Client - Ama', 10, thisMonth, '16:00');
    // Gift
    addTx(momoId, 'Gift', 'income', 'income', 200, 'Birthday gift', 'Uncle Kwame', 5, thisMonth, '11:00');

    // Food
    addTx(momoId, 'Food & Dining', 'expense', 'expense', 38, 'Lunch at work', 'Canteen', 2, thisMonth, '12:30');
    addTx(cashId, 'Food & Dining', 'expense', 'expense', 52, 'Weekend brunch', 'Vida e Caffé', 4, thisMonth, '10:30');
    addTx(momoId, 'Food & Dining', 'expense', 'expense', 25, 'Fruit & veg', 'Makola Market', 6, thisMonth, '07:30');
    addTx(momoId, 'Food & Dining', 'expense', 'expense', 65, 'Dinner out', 'Santoku Restaurant', 8, thisMonth, '19:30');
    addTx(cashId, 'Food & Dining', 'expense', 'expense', 42, 'Groceries', 'Game Store', 11, thisMonth, '11:00');
    addTx(momoId, 'Food & Dining', 'expense', 'expense', 30, 'Lunch', 'Chop Bar', 14, thisMonth, '13:00');
    addTx(cashId, 'Food & Dining', 'expense', 'expense', 48, 'Weekly groceries', 'Palace Mall', 17, thisMonth, '09:00');

    // Transport
    addTx(cashId, 'Transport', 'expense', 'expense', 12, 'Trotro fare', '', 1, thisMonth, '07:30');
    addTx(momoId, 'Transport', 'expense', 'expense', 28, 'Uber to meeting', 'Uber', 3, thisMonth, '09:00');
    addTx(cashId, 'Transport', 'expense', 'expense', 15, 'Taxi', '', 7, thisMonth, '17:00');
    addTx(momoId, 'Transport', 'expense', 'expense', 35, 'Bolt ride', 'Bolt', 12, thisMonth, '20:00');
    addTx(cashId, 'Transport', 'expense', 'expense', 20, 'Fuel', 'Shell', 15, thisMonth, '16:00');

    // Bills
    addTx(bankId, 'Bills & Utilities', 'expense', 'expense', 250, 'Internet Bill', 'Vodafone', 5, thisMonth, '10:00');
    addTx(bankId, 'Rent', 'expense', 'expense', 1000, 'Monthly Rent', 'Landlord', 1, thisMonth, '09:00');

    // Entertainment
    addTx(momoId, 'Entertainment', 'expense', 'expense', 60, 'Game purchase', 'Steam', 9, thisMonth, '22:00');
    addTx(momoId, 'Entertainment', 'expense', 'expense', 40, 'Bowling', 'Marina Mall', 13, thisMonth, '18:00');

    // Shopping
    addTx(momoId, 'Shopping', 'expense', 'expense', 150, 'New shoes', 'Nike Store', 6, thisMonth, '14:00');

    // Mobile & Data
    addTx(momoId, 'Mobile Data', 'expense', 'expense', 35, 'Monthly data bundle', 'MTN', 1, thisMonth, '08:00');
    addTx(momoId, 'Airtime', 'expense', 'expense', 10, 'Airtime', 'MTN', 8, thisMonth, '10:00');
    addTx(momoId, 'Subscriptions', 'expense', 'expense', 45, 'Netflix subscription', 'Netflix', 3, thisMonth, '00:00');

    // Health
    addTx(bankId, 'Health', 'expense', 'expense', 120, 'Doctor visit', 'Nyaho Medical', 7, thisMonth, '10:00');

    // Personal Care
    addTx(cashId, 'Personal Care', 'expense', 'expense', 50, 'Haircut', 'Barber Shop', 10, thisMonth, '11:00');

    // Set initial balances to reflect starting money + transactions
    // Cash: started at 500
    updateBalance.run(50000, cashId);
    // MoMo: started at 800
    updateBalance.run(80000, momoId);
    // Bank: started at 5000
    updateBalance.run(500000, bankId);
    // Savings: started at 2000
    updateBalance.run(200000, savingsId);

    // Budgets
    const budgets = [
      { id: uuidv4(), name: 'Food Budget', period: 'monthly', amount: 50000, catName: 'Food & Dining' },
      { id: uuidv4(), name: 'Transport Budget', period: 'monthly', amount: 30000, catName: 'Transport' },
      { id: uuidv4(), name: 'Entertainment Budget', period: 'monthly', amount: 20000, catName: 'Entertainment' },
      { id: uuidv4(), name: 'Shopping Budget', period: 'monthly', amount: 25000, catName: 'Shopping' }
    ];
    const insertBudget = db.prepare(`
      INSERT INTO budgets (id, user_id, name, period, amount, start_date) VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertBudgetCat = db.prepare(`
      INSERT INTO budget_categories (id, budget_id, category_id, amount) VALUES (?, ?, ?, ?)
    `);
    budgets.forEach(b => {
      insertBudget.run(b.id, userId, b.name, b.period, b.amount, thisMonth + '-01');
      const catId = getCat(b.catName, 'expense') || categories[0].id;
      insertBudgetCat.run(uuidv4(), b.id, catId, b.amount);
    });

    // Savings Goals
    const insertGoal = db.prepare(`
      INSERT INTO savings_goals (id, user_id, name, target_amount, current_amount, target_date, icon, color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertGoal.run(uuidv4(), userId, 'New Laptop', 800000, 320000, '2027-06-01', 'laptop', '#4f46e5');
    insertGoal.run(uuidv4(), userId, 'Emergency Fund', 500000, 150000, '2027-12-31', 'shield-check', '#10b981');
    insertGoal.run(uuidv4(), userId, 'Vacation to Cape Coast', 300000, 80000, '2027-03-01', 'airplane', '#06b6d4');

    // Recurring Transactions
    const insertRecurring = db.prepare(`
      INSERT INTO recurring_transactions (id, user_id, account_id, category_id, type, amount, description, frequency, next_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertRecurring.run(uuidv4(), userId, bankId, getCat('Rent', 'expense'), 'expense', 100000, 'Monthly Rent', 'monthly', thisMonth.replace(thisMonth.slice(-2), String(Math.min(now.getMonth() + 2, 12)).padStart(2, '0')) + '-01');
    insertRecurring.run(uuidv4(), userId, bankId, getCat('Bills & Utilities', 'expense'), 'expense', 25000, 'Internet Subscription', 'monthly', '2026-10-05');
    insertRecurring.run(uuidv4(), userId, momoId, getCat('Subscriptions', 'expense'), 'expense', 4500, 'Netflix', 'monthly', '2026-10-03');
    insertRecurring.run(uuidv4(), userId, bankId, getCat('Salary', 'income'), 'income', 400000, 'Monthly Salary', 'monthly', '2026-10-01');

    // Bill Reminders
    const insertReminder = db.prepare(`
      INSERT INTO bill_reminders (id, user_id, name, amount, due_date, frequency, category_id, is_paid)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `);
    const reminderDate1 = new Date(now);
    reminderDate1.setDate(now.getDate() + 5);
    const reminderDate2 = new Date(now);
    reminderDate2.setDate(now.getDate() + 12);
    const reminderDate3 = new Date(now);
    reminderDate3.setDate(now.getDate() + 20);

    const fmtDate = (d) => d.toISOString().split('T')[0];
    insertReminder.run(uuidv4(), userId, 'Rent', 100000, fmtDate(reminderDate1), 'monthly', getCat('Rent', 'expense'));
    insertReminder.run(uuidv4(), userId, 'Internet', 25000, fmtDate(reminderDate2), 'monthly', getCat('Bills & Utilities', 'expense'));
    insertReminder.run(uuidv4(), userId, 'Electricity', 15000, fmtDate(reminderDate3), 'monthly', getCat('Bills & Utilities', 'expense'));

    db.exec('COMMIT');
    console.log('Demo data seeded successfully for user:', userId);
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch(e) {}
    console.error('Error seeding demo data:', error);
    throw error;
  }
}

module.exports = { seedDemoData };
