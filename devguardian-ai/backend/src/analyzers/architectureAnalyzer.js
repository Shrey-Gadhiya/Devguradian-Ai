/**
 * Architecture Analyzer — directory map, entry points, metrics
 */
const path = require('path');
const fs = require('fs');
const { detectProjectType } = require('../utils/languageDetector');

async function analyzeArchitecture(dirPath, files) {
  const projectInfo = detectProjectType(dirPath);

  // Build directory tree (2 levels deep)
  const tree = buildTree(dirPath, dirPath, 0, 2);

  // Metrics
  const byExtension = {};
  const byLanguage = {};
  let totalLines = 0;
  let totalSize = 0;
  let codeFiles = 0;
  let testFiles = 0;

  for (const file of files) {
    byExtension[file.ext] = (byExtension[file.ext] || 0) + 1;
    if (file.language) {
      byLanguage[file.language] = (byLanguage[file.language] || 0) + 1;
    }
    totalSize += file.size;

    const isTest = /\.(test|spec)\.(js|ts|jsx|tsx|py|java|go|rb)$/.test(file.name) ||
                   file.relativePath.includes('__tests__') ||
                   file.relativePath.includes('/test/') ||
                   file.relativePath.includes('/tests/');
    if (isTest) testFiles++;
    else codeFiles++;
  }

  // Entry points
  const entryPoints = detectEntryPoints(dirPath, files);

  // Key config files
  const configFiles = files
    .filter(f => /^(package\.json|requirements\.txt|pom\.xml|go\.mod|cargo\.toml|dockerfile|docker-compose\.yml|\.github)$/i.test(f.name))
    .map(f => f.relativePath);

  return {
    projectInfo,
    tree,
    entryPoints,
    configFiles,
    metrics: {
      totalFiles: files.length,
      codeFiles,
      testFiles,
      totalSize,
      byExtension,
      byLanguage,
    },
  };
}

function buildTree(root, dirPath, depth, maxDepth) {
  const result = { name: path.basename(dirPath), type: 'dir', children: [] };
  if (depth >= maxDepth) return result;

  const IGNORE = new Set(['node_modules', '.git', 'dist', 'build', '__pycache__', 'coverage']);
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return result;
  }

  for (const entry of entries) {
    if (IGNORE.has(entry.name)) continue;
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      result.children.push(buildTree(root, full, depth + 1, maxDepth));
    } else {
      result.children.push({ name: entry.name, type: 'file' });
    }
  }
  return result;
}

function detectEntryPoints(dirPath, files) {
  const candidates = [
    'src/index.js', 'src/index.ts', 'index.js', 'index.ts',
    'src/main.js', 'src/main.ts', 'main.py', 'app.py',
    'src/app.js', 'src/app.ts', 'app.js', 'manage.py',
    'cmd/main.go', 'main.go',
  ];
  return candidates
    .filter(c => fs.existsSync(path.join(dirPath, c)))
    .map(c => c);
}

module.exports = { analyzeArchitecture };
