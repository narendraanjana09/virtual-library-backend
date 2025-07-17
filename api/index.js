// api/index.js
const express = require('express');
const serverless = require('serverless-http');
const app = express();

app.get('/', (req, res) => {
  res.send('✅ Server is running via Vercel');
});

// Add more routes like this:
app.get('/hello', (req, res) => {
  res.json({ message: 'Hello from Express on Vercel!' });
});

module.exports.handler = serverless(app);
