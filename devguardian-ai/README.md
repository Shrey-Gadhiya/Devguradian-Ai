# DevGuardian AI

An autonomous software-engineering security and quality platform that analyzes any repository, identifies issues, generates fixes, creates regression tests, and produces detailed engineering reports.

## Features

- **6-Agent Pipeline** — Code Analyst, Security Agent, Test Agent, Debug Agent, Review Agent, Documentation Agent
- **OWASP Security Scanning** — 18 rules covering injection, auth failures, misconfigurations, secrets, and more
- **Dependency CVE Analysis** — npm and pip package vulnerability detection
- **Code Quality Analysis** — complexity, empty catches, deep nesting, duplicate code, TODO tracking
- **Test Coverage Estimation** — gap detection, quality scoring, auto-generated regression tests
- **AI-Powered Fix Suggestions** — remediation with before/after code diffs (OpenAI, Anthropic, or IBM watsonx)
- **Professional Dashboard** — 9 pages with detail drawers, charts, diffs, and agent activity
- **Export Reports** — Markdown and JSON report download
- **Safety First** — never auto-applies changes, all fixes require explicit approval

## Quick Start

### 1. Install dependencies

```bash
cd devguardian-ai
npm run install:all
```

Or install each piece separately:

```bash
# Root
npm install

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure environment (optional)

```bash
cp backend/.env.example backend/.env
# Edit backend/.env to add an AI provider API key (optional)
# Without a key, rule-based analysis runs with no AI enhancement
```

### 3. Start development servers

```bash
# From devguardian-ai/
npm run dev
# Backend → http://localhost:4000
# Frontend → http://localhost:3000
```

### 4. Run tests

```bash
npm test
# Runs 12 backend tests (2 suites)
```

### 5. Build frontend

```bash
npm run build
```

## Usage

1. Open http://localhost:3000
2. Go to **Repository** → click **Load Repository** (Demo is preloaded)
3. Click **Start Analysis**
4. Watch the 6-agent pipeline run in real time
5. Explore findings, security issues, test coverage, and fixes
6. Download reports from the **Reports** page

## AI Provider Configuration

Set `AI_PROVIDER` in `backend/.env` to one of:

| Value | Description |
|-------|-------------|
| `none` | Rule-based only (default, no API key needed) |
| `openai` | OpenAI GPT-4o |
| `anthropic` | Claude 3.5 Sonnet |
| `watsonx` | IBM watsonx Granite |

## Architecture

```
devguardian-ai/
├── backend/
│   ├── src/
│   │   ├── index.js              — Express server
│   │   ├── ai/aiProvider.js      — OpenAI/Anthropic/watsonx
│   │   ├── agents/
│   │   │   ├── orchestrator.js   — 6-agent pipeline
│   │   │   ├── fixAgent.js       — Fix generation
│   │   │   ├── testAgent.js      — Test generation
│   │   │   └── reportAgent.js    — Report generation
│   │   ├── analyzers/
│   │   │   ├── securityAnalyzer.js    — 18 OWASP rules
│   │   │   ├── codeQualityAnalyzer.js — Quality checks
│   │   │   ├── testAnalyzer.js        — Coverage analysis
│   │   │   ├── dependencyAnalyzer.js  — CVE checks
│   │   │   └── architectureAnalyzer.js — File map
│   │   └── routes/               — REST API routes
│   └── __tests__/                — Jest tests
├── frontend/
│   └── src/
│       ├── pages/                — 9 dashboard pages
│       ├── components/           — Shared UI components
│       ├── context/              — Analysis state
│       └── api/                  — Axios client
└── demo-repo/                    — Intentionally vulnerable app
```

## Demo Repository

The included `demo-repo` is an intentionally vulnerable Express.js application containing:

- SQL injection via string concatenation
- Command injection via `exec()`
- Path traversal in file download
- SSRF via user-supplied URL
- `eval()` with user input
- Hardcoded database credentials
- Weak JWT secret
- MD5/SHA1 password hashing
- Math.random() for security tokens
- Open redirect
- Wildcard CORS
- Vulnerable npm packages (lodash, jsonwebtoken, minimist, etc.)

## Safety

DevGuardian AI **never**:
- Modifies or deletes files without explicit approval
- Executes destructive shell commands
- Exposes or logs secrets
- Pushes code to any remote

All fix suggestions are read-only until manually applied.
