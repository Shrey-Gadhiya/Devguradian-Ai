const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '__pycache__',
  '.tox', 'venv', '.venv', 'coverage', '.nyc_output', 'vendor',
]);

const LANG_MAP = {
  '.js': 'JavaScript', '.jsx': 'JavaScript', '.mjs': 'JavaScript',
  '.ts': 'TypeScript', '.tsx': 'TypeScript',
  '.py': 'Python',
  '.java': 'Java',
  '.go': 'Go',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.cs': 'C#',
  '.cpp': 'C++', '.cc': 'C++', '.cxx': 'C++',
  '.c': 'C',
  '.rs': 'Rust',
  '.kt': 'Kotlin',
  '.swift': 'Swift',
  '.sh': 'Shell',
  '.yaml': 'YAML', '.yml': 'YAML',
  '.json': 'JSON',
  '.html': 'HTML',
  '.css': 'CSS', '.scss': 'CSS',
  '.sql': 'SQL',
  '.md': 'Markdown',
};

async function scanDirectory(dirPath, maxFiles = 2000) {
  const files = [];

  async function walk(current) {
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (files.length >= maxFiles) break;
      if (IGNORE_DIRS.has(entry.name)) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        const stat = fs.statSync(full);
        files.push({
          path: full,
          relativePath: path.relative(dirPath, full),
          name: entry.name,
          ext,
          size: stat.size,
          language: LANG_MAP[ext] || null,
        });
      }
    }
  }

  await walk(dirPath);
  return files;
}

function readFileSafe(filePath, maxBytes = 200000) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > maxBytes) return null;
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function detectLanguage(ext) {
  return LANG_MAP[ext] || null;
}

module.exports = { scanDirectory, readFileSafe, detectLanguage, LANG_MAP };
