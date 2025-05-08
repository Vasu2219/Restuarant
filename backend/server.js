require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://v0-college-event-og3ksk0k1-vasus-projects-920d16c2.vercel.app',
    'https://v0-college-event-og3ksk0k1-vasus-projects-920d16c2.vercel.app/'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// API Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to the Restaurant API',
    status: 'success',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api',
      '/api/health'
    ]
  });
});

app.get('/api', (req, res) => {
  res.json({ 
    message: 'Welcome to the Restaurant API',
    status: 'success',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server only when not in Vercel environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export the Express API for Vercel Serverless Functions
module.exports = app;
