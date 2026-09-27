const fs = require('fs-extra');
const path = require('path');
const { glob } = require('glob');

const SKIP_DIRS = ['node_modules', '.git', '.svn', 'dist', 'build', '__pycache__', '.venv', 'venv', 'vendor', 'target', '.gradle', '.idea', '.vscode'];
const SKIP_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.pdf', '.zip', '.tar', '.gz', '.exe', '.dll', '.so', '.dylib', '.bin', '.lock'];

const TEXT_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs', '.c', '.cpp', '.h', '.hpp',
  '.cs', '.rb', '.php', '.swift', '.kt', '.scala', '.sh', '.bash', '.zsh', '.fish',
  '.html', '.css', '.scss', '.sass', '.less', '.json', '.xml', '.yaml', '.yml',
  '.toml', '.ini', '.cfg', '.conf', '.env', '.md', '.txt', '.sql', '.graphql',
  '.proto', '.tf', '.hcl', '.dockerfile', '.Dockerfile'
]);

async function scanDirectory(dirPath, maxFileSizeMB = 10) {
  const maxBytes = maxFileSizeMB * 1024 * 1024;
  const files = [];

  const pattern = '**/*';
  const allFiles = await glob(pattern, {
    cwd: dirPath,
    nodir: true,
    ignore: SKIP_DIRS.map(d => `**/${d}/**`),
    absolute: false,
    dot: false
  });

  for (const relPath of allFiles) {
    const ext = path.extname(relPath).toLowerCase();
    if (SKIP_EXTENSIONS.includes(ext)) continue;
    if (!TEXT_EXTENSIONS.has(ext) && ext !== '') continue;

    const absPath = path.join(dirPath, relPath);
    try {
      const stat = await fs.stat(absPath);
      if (stat.size > maxBytes) continue;
      files.push({
        path: relPath,
        absPath,
        size: stat.size,
        ext: ext || path.basename(relPath)
      });
    } catch { /* skip unreadable */ }
  }
  return files;
}

async function readFile(absPath) {
  try {
    return await fs.readFile(absPath, 'utf8');
  } catch {
    return null;
  }
}

async function readFileLines(absPath) {
  const content = await readFile(absPath);
  if (!content) return [];
  return content.split('\n');
}

function detectLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath).toLowerCase();
  const langMap = {
    '.js': 'javascript', '.jsx': 'javascript', '.mjs': 'javascript', '.cjs': 'javascript',
    '.ts': 'typescript', '.tsx': 'typescript',
    '.py': 'python',
    '.java': 'java',
    '.go': 'golang',
    '.rs': 'rust',
    '.c': 'c', '.h': 'c',
    '.cpp': 'cpp', '.hpp': 'cpp', '.cc': 'cpp',
    '.cs': 'csharp',
    '.rb': 'ruby',
    '.php': 'php',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.scala': 'scala',
    '.sh': 'shell', '.bash': 'shell', '.zsh': 'shell',
    '.html': 'html',
    '.css': 'css', '.scss': 'css', '.sass': 'css',
    '.json': 'json',
    '.xml': 'xml',
    '.yaml': 'yaml', '.yml': 'yaml',
    '.sql': 'sql',
    '.tf': 'terraform', '.hcl': 'terraform',
    '.dockerfile': 'dockerfile'
  };
  if (base === 'dockerfile') return 'dockerfile';
  return langMap[ext] || 'unknown';
}

module.exports = { scanDirectory, readFile, readFileLines, detectLanguage, TEXT_EXTENSIONS };
