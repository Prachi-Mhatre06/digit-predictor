const express = require('express');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const { createTables } = require('./scripts/initDb');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.use('/api', apiRoutes);

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('Initializing database...');
    await createTables();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on http://0.0.0.0:${PORT}`);
      console.log(`Database: ${process.env.DB_NAME || process.env.PGDATABASE || 'railway'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
