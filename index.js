const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json()); // To parse JSON in requests

// Sample route
app.get('/', (req, res) => {
  res.send('📚 Virtual Library Backend is running!');
});

app.listen(PORT, () => {
  console.log(`Server is listening at http://localhost:${PORT}`);
});
