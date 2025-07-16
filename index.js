const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('📚 Virtual Library API is working!');
});

app.get('/books', (req, res) => {
  res.json([
    { id: 1, title: 'Wings of Fire', author: 'A.P.J. Abdul Kalam' },
    { id: 2, title: 'Bhagavad Gita', author: 'Vyasa' },
    { id: 3, title: 'The Alchemist', author: 'Paulo Coelho' },
  ]);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
