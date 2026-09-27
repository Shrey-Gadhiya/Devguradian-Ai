require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const analysisRoutes = require('./routes/analysis');
const repositoryRoutes = require('./routes/repository');
const reportsRoutes = require('./routes/reports');
const agentsRoutes = require('./routes/agents');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api/analysis', analysisRoutes);
app.use('/api/repository', repositoryRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/agents', agentsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// Serve built frontend if dist/ exists
const distPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback — send index.html for any non-API route
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  console.log(`Serving frontend from ${distPath}`);
}

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n  DevGuardian AI running on http://localhost:${PORT}`);
    console.log(`  API:      http://localhost:${PORT}/api/health`);
    if (fs.existsSync(distPath)) {
      console.log(`  Frontend: http://localhost:${PORT}`);
    }
    console.log('');
  });
}

module.exports = app;
