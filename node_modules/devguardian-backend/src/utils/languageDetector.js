const path = require('path');
const fs = require('fs-extra');

const MANIFEST_FILES = {
  'package.json': 'Node.js',
  'requirements.txt': 'Python',
  'setup.py': 'Python',
  'Pipfile': 'Python',
  'pyproject.toml': 'Python',
  'pom.xml': 'Java',
  'build.gradle': 'Java/Kotlin',
  'build.gradle.kts': 'Kotlin',
  'Cargo.toml': 'Rust',
  'go.mod': 'Go',
  'composer.json': 'PHP',
  'Gemfile': 'Ruby',
  'Package.swift': 'Swift',
  '.csproj': 'C#',
  'mix.exs': 'Elixir',
  'pubspec.yaml': 'Dart/Flutter'
};

async function detectProjectType(dirPath) {
  const result = {
    primaryLanguage: 'unknown',
    languages: [],
    frameworks: [],
    packageManagers: [],
    hasTests: false,
    testFrameworks: [],
    manifestFiles: []
  };

  const entries = await fs.readdir(dirPath).catch(() => []);
  const entrySet = new Set(entries.map(e => e.toLowerCase()));

  for (const [file, lang] of Object.entries(MANIFEST_FILES)) {
    if (entrySet.has(file.toLowerCase())) {
      result.manifestFiles.push(file);
      if (!result.languages.includes(lang)) result.languages.push(lang);
    }
  }

  // Package manager detection
  if (entrySet.has('package.json')) result.packageManagers.push('npm/yarn');
  if (entrySet.has('yarn.lock')) result.packageManagers.push('yarn');
  if (entrySet.has('pnpm-lock.yaml')) result.packageManagers.push('pnpm');
  if (entrySet.has('requirements.txt') || entrySet.has('pipfile')) result.packageManagers.push('pip');
  if (entrySet.has('cargo.toml')) result.packageManagers.push('cargo');
  if (entrySet.has('go.mod')) result.packageManagers.push('go modules');
  if (entrySet.has('composer.json')) result.packageManagers.push('composer');
  if (entrySet.has('gemfile')) result.packageManagers.push('bundler');

  // Framework detection from package.json
  if (entrySet.has('package.json')) {
    try {
      const pkgPath = path.join(dirPath, 'package.json');
      const pkg = await fs.readJson(pkgPath);
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (allDeps.react) result.frameworks.push('React');
      if (allDeps.vue) result.frameworks.push('Vue');
      if (allDeps['@angular/core']) result.frameworks.push('Angular');
      if (allDeps.express) result.frameworks.push('Express');
      if (allDeps.fastify) result.frameworks.push('Fastify');
      if (allDeps.next) result.frameworks.push('Next.js');
      if (allDeps.nuxt) result.frameworks.push('Nuxt');
      if (allDeps.jest) result.testFrameworks.push('Jest');
      if (allDeps.mocha) result.testFrameworks.push('Mocha');
      if (allDeps.vitest) result.testFrameworks.push('Vitest');
      if (allDeps.cypress) result.testFrameworks.push('Cypress');
      if (allDeps.playwright) result.testFrameworks.push('Playwright');
    } catch { /* ignore */ }
  }

  // Test directory detection
  const testDirs = ['test', 'tests', '__tests__', 'spec', 'specs', 'e2e'];
  result.hasTests = testDirs.some(d => entrySet.has(d));
  if (result.testFrameworks.length > 0) result.hasTests = true;

  result.primaryLanguage = result.languages[0] || 'unknown';
  result.languages = [...new Set(result.languages)];
  result.packageManagers = [...new Set(result.packageManagers)];

  return result;
}

module.exports = { detectProjectType };
