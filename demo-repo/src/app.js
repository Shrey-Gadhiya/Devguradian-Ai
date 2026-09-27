const express = require('express');
const app = express();

// WARNING: This app contains intentional security vulnerabilities for demo purposes
// DO NOT use this code in production

app.use(express.json());
app.use(require('cors')()); // Wildcard CORS - SEC014

const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Demo app on port ${PORT}`));

module.exports = app;
