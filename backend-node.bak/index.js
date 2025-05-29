const express = require('express');
const app = express();
app.use(express.json());
app.get('/api/status', (req, res) => res.json({ message: 'API is running' }));
app.listen(5000, () => console.log('Server running on http://localhost:5000'));
