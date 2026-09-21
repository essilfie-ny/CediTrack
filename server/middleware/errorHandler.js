function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ error: 'Resource already exists' });
  }
  if (err.message && err.message.includes('NOT NULL constraint failed')) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = errorHandler;
