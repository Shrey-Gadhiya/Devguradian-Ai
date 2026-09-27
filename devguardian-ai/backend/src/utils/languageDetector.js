const fs = require('fs');
const path = require('path');

function detectProjectType(dirPath) {
  const files = new Set(fs.readdirSync(dirPath).map(f => f.toLowerCase()));

  const info = {
    primaryLanguage: 'Unknown',
    frameworks: [],
    packageManagers: [],
    testFrameworks: [],
    buildTools: [],
    hasDocker: files.has('dockerfile') || files.has('docker-compose.yml'),
    hasCI: files.has('.github') || files.has('.gitlab-ci.yml') || files.has('jenkinsfile'),
  };

  // Node / JavaScript / TypeScript
  if (files.has('package.json')) {
    info.packageManagers.push('npm');
    const pkg = JSON.parse(fs.readFileSync(path.join(dirPath, 'package.json'), 'utf8'));
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };
    info.primaryLanguage = allDeps.typescript || files.has('tsconfig.json') ? 'TypeScript' : 'JavaScript';
    if (allDeps.react || allDeps['react-dom']) info.frameworks.push('React');
    if (allDeps.vue) info.frameworks.push('Vue');
    if (allDeps.express) info.frameworks.push('Express');
    if (allDeps.next) info.frameworks.push('Next.js');
    if (allDeps.jest || allDeps['@jest/core']) info.testFrameworks.push('Jest');
    if (allDeps.mocha) info.testFrameworks.push('Mocha');
    if (allDeps.vitest) info.testFrameworks.push('Vitest');
  }

  // Python
  if (files.has('requirements.txt') || files.has('pyproject.toml') || files.has('setup.py')) {
    info.primaryLanguage = 'Python';
    info.packageManagers.push('pip');
    if (files.has('pyproject.toml')) info.packageManagers.push('poetry');
    if (files.has('pytest.ini') || files.has('conftest.py')) info.testFrameworks.push('pytest');
    try {
      const reqs = fs.readFileSync(path.join(dirPath, 'requirements.txt'), 'utf8');
      if (reqs.includes('django')) info.frameworks.push('Django');
      if (reqs.includes('flask')) info.frameworks.push('Flask');
      if (reqs.includes('fastapi')) info.frameworks.push('FastAPI');
    } catch {}
  }

  // Java
  if (files.has('pom.xml')) {
    info.primaryLanguage = 'Java';
    info.packageManagers.push('Maven');
    info.testFrameworks.push('JUnit');
    info.buildTools.push('Maven');
  }
  if (files.has('build.gradle') || files.has('build.gradle.kts')) {
    info.primaryLanguage = info.primaryLanguage === 'Unknown' ? 'Java' : info.primaryLanguage;
    info.buildTools.push('Gradle');
  }

  // Go
  if (files.has('go.mod')) {
    info.primaryLanguage = 'Go';
    info.packageManagers.push('Go modules');
  }

  // Rust
  if (files.has('cargo.toml')) {
    info.primaryLanguage = 'Rust';
    info.packageManagers.push('Cargo');
  }

  return info;
}

module.exports = { detectProjectType };
