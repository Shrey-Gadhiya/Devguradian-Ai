const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const tmp = require('tmp');
const AdmZip = require('adm-zip');
const simpleGit = require('simple-git');

const upload = multer({ dest: tmp.dirSync({ unsafeCleanup: true }).name });
const activeRepos = new Map();

// GET /api/repository/demo
router.get('/demo', (req, res) => {
  const demoPath = path.resolve(__dirname, '../../../demo-repo');
  if (!fs.existsSync(demoPath)) return res.status(404).json({ error: 'Demo repo not found' });
  const repoId = 'demo';
  activeRepos.set(repoId, { path: demoPath, name: 'demo-vulnerable-app', type: 'demo' });
  res.json({ repoId, path: demoPath, name: 'demo-vulnerable-app', type: 'demo' });
});

// POST /api/repository/upload  (zip file)
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const tmpDir = tmp.dirSync({ unsafeCleanup: true });
    const zip = new AdmZip(req.file.path);
    zip.extractAllTo(tmpDir.name, true);
    const repoId = Date.now().toString();
    const repoPath = findRootDir(tmpDir.name);
    activeRepos.set(repoId, { path: repoPath, name: req.file.originalname, type: 'upload' });
    res.json({ repoId, path: repoPath, name: req.file.originalname, type: 'upload' });
  } catch (err) {
    res.status(500).json({ error: `Failed to extract zip: ${err.message}` });
  }
});

// POST /api/repository/clone  (git URL)
router.post('/clone', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });
  const tmpDir = tmp.dirSync({ unsafeCleanup: true });
  try {
    await simpleGit().clone(url, tmpDir.name, ['--depth', '1']);
    const repoId = Date.now().toString();
    activeRepos.set(repoId, { path: tmpDir.name, name: path.basename(url, '.git'), type: 'git' });
    res.json({ repoId, path: tmpDir.name, name: path.basename(url, '.git'), type: 'git' });
  } catch (err) {
    res.status(500).json({ error: `Failed to clone: ${err.message}` });
  }
});

// POST /api/repository/path  (local path)
router.post('/path', (req, res) => {
  const { repoPath } = req.body;
  if (!repoPath) return res.status(400).json({ error: 'repoPath is required' });
  if (!fs.existsSync(repoPath)) return res.status(400).json({ error: 'Path does not exist' });
  const repoId = Date.now().toString();
  activeRepos.set(repoId, { path: repoPath, name: path.basename(repoPath), type: 'local' });
  res.json({ repoId, path: repoPath, name: path.basename(repoPath), type: 'local' });
});

// GET /api/repository/active
router.get('/active', (req, res) => {
  const list = Array.from(activeRepos.entries()).map(([id, r]) => ({ repoId: id, ...r }));
  res.json(list);
});

function findRootDir(dir) {
  const entries = fs.readdirSync(dir);
  if (entries.length === 1) {
    const sub = path.join(dir, entries[0]);
    if (fs.statSync(sub).isDirectory()) return sub;
  }
  return dir;
}

module.exports = router;
