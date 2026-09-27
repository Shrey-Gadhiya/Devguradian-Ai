const path = require('path');
const { readFile } = require('../utils/fileUtils');
const { detectProjectType } = require('../utils/languageDetector');

async function analyzeArchitecture(dirPath, files) {
  const projectInfo = await detectProjectType(dirPath);

  // Build directory structure map
  const dirMap = {};
  for (const f of files) {
    const parts = f.path.split(path.sep).join('/').split('/');
    const dir = parts.length > 1 ? parts[0] : '(root)';
    if (!dirMap[dir]) dirMap[dir] = { count: 0, types: new Set(), files: [] };
    dirMap[dir].count++;
    dirMap[dir].types.add(f.ext);
    if (dirMap[dir].files.length < 5) dirMap[dir].files.push(f.path);
  }

  // Convert sets to arrays
  for (const dir of Object.values(dirMap)) {
    dir.types = [...dir.types];
  }

  // Detect entry points
  const entryPoints = [];
  const entryNames = ['index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts', 'server.js', 'main.py', 'app.py', 'main.go', 'main.rs'];
  for (const f of files) {
    const base = path.basename(f.path);
    if (entryNames.includes(base.toLowerCase())) {
      entryPoints.push(f.path);
    }
  }

  // Dependency analysis
  const dependencyRisks = [];
  const pkgFile = files.find(f => f.path === 'package.json' || f.path.endsWith('/package.json') && !f.path.includes('node_modules'));
  if (pkgFile) {
    try {
      const content = await readFile(pkgFile.absPath);
      const pkg = JSON.parse(content);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const riskyPatterns = ['eval', 'exec', 'shell', 'crypto', 'vm', 'child_process'];

      for (const [name, version] of Object.entries(deps)) {
        const lname = name.toLowerCase();
        if (riskyPatterns.some(r => lname.includes(r))) {
          dependencyRisks.push({ name, version, reason: 'Package name suggests privileged/unsafe capability' });
        }
      }
    } catch { /* ignore */ }
  }

  // Code metrics
  let totalLines = 0;
  let codeFiles = 0;
  const langStats = {};

  for (const f of files) {
    const lang = f.ext;
    if (!langStats[lang]) langStats[lang] = { files: 0, size: 0 };
    langStats[lang].files++;
    langStats[lang].size += f.size;
    codeFiles++;
    totalLines += Math.round(f.size / 35); // estimate
  }

  return {
    projectInfo,
    directoryMap: dirMap,
    entryPoints,
    dependencyRisks,
    metrics: {
      totalFiles: files.length,
      estimatedLinesOfCode: totalLines,
      byExtension: langStats
    }
  };
}

module.exports = { analyzeArchitecture };
