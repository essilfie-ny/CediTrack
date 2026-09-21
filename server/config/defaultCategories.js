const { v4: uuidv4 } = require('uuid');

const defaultExpenseCategories = [
  { name: 'Food & Dining', icon: 'egg-fried', color: '#f97316' },
  { name: 'Transport', icon: 'bus-front', color: '#3b82f6' },
  { name: 'Bills & Utilities', icon: 'receipt', color: '#8b5cf6' },
  { name: 'Rent', icon: 'house', color: '#ec4899' },
  { name: 'Shopping', icon: 'bag', color: '#14b8a6' },
  { name: 'Entertainment', icon: 'controller', color: '#f43f5e' },
  { name: 'Education', icon: 'book', color: '#6366f1' },
  { name: 'Health', icon: 'heart-pulse', color: '#ef4444' },
  { name: 'Family', icon: 'people', color: '#a855f7' },
  { name: 'Subscriptions', icon: 'credit-card', color: '#0ea5e9' },
  { name: 'Mobile Data', icon: 'phone', color: '#22c55e' },
  { name: 'Airtime', icon: 'telephone', color: '#eab308' },
  { name: 'Utilities', icon: 'lightning', color: '#f59e0b' },
  { name: 'Travel', icon: 'airplane', color: '#06b6d4' },
  { name: 'Personal Care', icon: 'droplet', color: '#d946ef' },
  { name: 'Other', icon: 'three-dots', color: '#64748b' }
].map(cat => ({ id: uuidv4(), type: 'expense', is_default: 1, ...cat }));

const defaultIncomeCategories = [
  { name: 'Salary', icon: 'briefcase', color: '#10b981' },
  { name: 'Business', icon: 'shop', color: '#22c55e' },
  { name: 'Freelance', icon: 'laptop', color: '#14b8a6' },
  { name: 'Gift', icon: 'gift', color: '#f472b6' },
  { name: 'Allowance', icon: 'cash-stack', color: '#34d399' },
  { name: 'Investment', icon: 'graph-up-arrow', color: '#0ea5e9' },
  { name: 'Refund', icon: 'arrow-return-left', color: '#a3e635' },
  { name: 'Other', icon: 'three-dots', color: '#64748b' }
].map(cat => ({ id: uuidv4(), type: 'income', is_default: 1, ...cat }));

module.exports = {
  defaultExpenseCategories,
  defaultIncomeCategories,
  allDefaultCategories: [...defaultExpenseCategories, ...defaultIncomeCategories]
};
