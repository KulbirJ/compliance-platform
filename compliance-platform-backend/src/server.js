require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');

const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = server;
