require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { initDb } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json());

// Init DB
initDb();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/transfers', require('./routes/transfers'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/savings-goals', require('./routes/goals'));
app.use('/api/recurring', require('./routes/recurring'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`CediTrack server running on port ${PORT} listening on all network interfaces`);
});
