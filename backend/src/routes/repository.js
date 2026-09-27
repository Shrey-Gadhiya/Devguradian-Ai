const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const { execFile } = require('child_process');
const multer = require('multer');
const tmp = require('tmp');
const AdmZip = require('adm-zip');
const simpleGit = require('simple-git');
const axios = require('axios');
const { scanDirectory, detectLanguage } = require('../utils/fileUtils');
const { detectProjectType } = require('../utils/languageDetector');

/**
 * Returns a promise that resolves to true if `git` is on PATH, false otherwise.
 */
function isGitAvailable() {
  return new Promise(resolve => {
    execFile('git', ['--version'], { timeout: 5000 }, (err) => resolve(!err));
  });
}

/**
 * Build the ZIP download URL for a public repo using the hosting platform's archive API.
 * No authentication or Git installation needed for public repos.
 */
function getArchiveUrl(url) {
  // GitHub: /archive/HEAD.zip resolves the symbolic HEAD ref regardless of default branch name
  // (works for master, main, or any custom default branch)
  const gh = url.match(/^https:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/);
  if (gh) return `https://github.com/${gh[1]}/archive/HEAD.zip`;

  // GitLab: /-/archive/HEAD/<repo>-HEAD.zip — HEAD resolves to the default branch
  const gl = url.match(/^https:\/\/gitlab\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (gl) return `https://gitlab.com/${gl[1]}/${gl[2]}/-/archive/HEAD/${gl[2]}-HEAD.zip`;

  // Bitbucket: /get/HEAD.zip — HEAD resolves to the default branch
  const bb = url.match(/^https:\/\/bitbucket\.org\/([^/]+\/[^/]+?)(?:\.git)?$/);
  if (bb) return `https://bitbucket.org/${bb[1]}/get/HEAD.zip`;

  return null;
}

/**
 * Download a ZIP from `archiveUrl` into `destPath` using axios (no git needed).
 */
async function downloadRepoZip(archiveUrl, destPath) {
  const response = await axios.get(archiveUrl, {
    responseType: 'arraybuffer',
    timeout: 120000,
    maxContentLength: 500 * 1024 * 1024,
    headers: { 'User-Agent': 'DevGuardian-AI/1.0' },
    // follow redirects (axios does by default, max 5)
    maxRedirects: 10,
  });
  await fs.writeFile(destPath, response.data);
}

const upload = multer({ dest: path.join(__dirname, '../../uploads/'), limits: { fileSize: 500 * 1024 * 1024 } });

// Store active repos in memory for session
const activeRepos = new Map();

// GET /api/repository/demo — load built-in demo repo
router.get('/demo', async (req, res) => {
  try {
    const demoPath = path.join(__dirname, '../../../demo-repo');
    const exists = await fs.pathExists(demoPath);
    if (!exists) {
      return res.status(404).json({ error: 'Demo repository not found' });
    }
    const files = await scanDirectory(demoPath);
    const projectInfo = await detectProjectType(demoPath);
    const repoId = 'demo';
    activeRepos.set(repoId, { path: demoPath, name: 'demo-vulnerable-app' });
    res.json({ repoId, path: demoPath, name: 'demo-vulnerable-app', files: files.length, projectInfo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/repository/upload — upload zip archive
router.post('/upload', upload.single('repo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const tmpDir = tmp.dirSync({ unsafeCleanup: true });
    const zip = new AdmZip(req.file.path);
    zip.extractAllTo(tmpDir.name, true);
    await fs.remove(req.file.path);

    // Find root of extracted project
    const entries = await fs.readdir(tmpDir.name);
    const repoPath = entries.length === 1
      ? path.join(tmpDir.name, entries[0])
      : tmpDir.name;

    const files = await scanDirectory(repoPath);
    const projectInfo = await detectProjectType(repoPath);
    const repoId = Date.now().toString();
    activeRepos.set(repoId, { path: repoPath, name: req.file.originalname.replace('.zip', '') });

    res.json({ repoId, path: repoPath, name: req.file.originalname, files: files.length, projectInfo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/repository/clone — clone git repo
router.post('/clone', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  // Basic URL validation - only allow git URLs
  const allowedPatterns = [/^https:\/\/github\.com\//, /^https:\/\/gitlab\.com\//, /^https:\/\/bitbucket\.org\//];
  if (!allowedPatterns.some(p => p.test(url))) {
    return res.status(400).json({ error: 'Only GitHub, GitLab, and Bitbucket URLs are supported' });
  }

  const repoName = url.split('/').pop().replace(/\.git$/, '');
  const tmpDir = tmp.dirSync({ unsafeCleanup: true });

  // ── Try native git clone first ──────────────────────────────────────
  const gitFound = await isGitAvailable();

  if (gitFound) {
    try {
      const git = simpleGit();
      await git.clone(url, tmpDir.name, ['--depth', '1']);

      const files = await scanDirectory(tmpDir.name);
      const projectInfo = await detectProjectType(tmpDir.name);
      const repoId = Date.now().toString();
      activeRepos.set(repoId, { path: tmpDir.name, name: repoName });
      return res.json({ repoId, path: tmpDir.name, name: repoName, files: files.length, projectInfo });
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Authentication failed') || msg.includes('could not read Username')) {
        return res.status(401).json({ error: 'Authentication failed. Make sure the repository is public, or use a personal access token in the URL.' });
      }
      if (msg.includes('Repository not found') || msg.includes('does not exist')) {
        return res.status(404).json({ error: 'Repository not found. Check the URL and make sure the repo is public.' });
      }
      // Any other git error — fall through to ZIP download below
    }
  }

  // ── Fallback: download archive ZIP via platform API (no git needed) ──
  const archiveUrl = getArchiveUrl(url);
  if (!archiveUrl) {
    return res.status(400).json({ error: 'Could not determine archive URL for this host. Only GitHub, GitLab, and Bitbucket are supported.' });
  }

  try {
    const zipPath = path.join(tmpDir.name, '_repo.zip');
    const extractDir = path.join(tmpDir.name, '_extracted');
    await fs.ensureDir(extractDir);

    await downloadRepoZip(archiveUrl, zipPath);

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractDir, true);
    await fs.remove(zipPath);

    // Hosting platforms wrap contents in a top-level folder — unwrap it
    const entries = await fs.readdir(extractDir);
    const repoPath = entries.length === 1
      ? path.join(extractDir, entries[0])
      : extractDir;

    const files = await scanDirectory(repoPath);
    const projectInfo = await detectProjectType(repoPath);
    const repoId = Date.now().toString();
    activeRepos.set(repoId, { path: repoPath, name: repoName });

    return res.json({ repoId, path: repoPath, name: repoName, files: files.length, projectInfo });
  } catch (err) {
    const msg = err.message || '';
    const status = err.response?.status;
    if (status === 404 || msg.includes('404')) {
      return res.status(404).json({ error: 'Repository not found. Check the URL and make sure the repo is public.' });
    }
    if (status === 401 || status === 403) {
      return res.status(401).json({ error: 'Repository is private. Only public repositories can be loaded without Git credentials.' });
    }
    return res.status(500).json({ error: `Failed to fetch repository archive: ${msg}` });
  }
});

// POST /api/repository/path — use local path (dev only)
router.post('/path', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Local path loading disabled in production' });
  }
  const { dirPath } = req.body;
  if (!dirPath) return res.status(400).json({ error: 'dirPath is required' });

  try {
    const absPath = path.resolve(dirPath);
    const exists = await fs.pathExists(absPath);
    if (!exists) return res.status(404).json({ error: 'Path does not exist' });

    const files = await scanDirectory(absPath);
    const projectInfo = await detectProjectType(absPath);
    const repoId = Date.now().toString();
    const name = path.basename(absPath);
    activeRepos.set(repoId, { path: absPath, name });

    res.json({ repoId, path: absPath, name, files: files.length, projectInfo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/repository/:repoId
router.get('/:repoId', async (req, res) => {
  const repo = activeRepos.get(req.params.repoId);
  if (!repo) return res.status(404).json({ error: 'Repository not found' });
  try {
    const files = await scanDirectory(repo.path);
    const projectInfo = await detectProjectType(repo.path);
    res.json({ ...repo, files: files.length, projectInfo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/repository/:repoId/files
router.get('/:repoId/files', async (req, res) => {
  const repo = activeRepos.get(req.params.repoId);
  if (!repo) return res.status(404).json({ error: 'Repository not found' });
  try {
    const files = await scanDirectory(repo.path);
    const langMap = {};
    for (const f of files) langMap[f.path] = detectLanguage(f.path);
    res.json({ files: files.map(f => ({ path: f.path, size: f.size, ext: f.ext, language: langMap[f.path] })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.activeRepos = activeRepos;
