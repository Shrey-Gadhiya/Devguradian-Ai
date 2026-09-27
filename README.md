# DevGuardian AI 🛡️

Autonomous software engineering security and quality platform. Given any Git/code repository, DevGuardian analyzes the codebase, identifies security/testing/code-quality issues, generates fix suggestions, creates regression tests, and produces a final engineering report.

---

## Features

- **Repository ingestion** — local path, Git URL clone, ZIP upload, or built-in demo repo
- **Automatic project/language detection** — Node.js, Python, Java, Go, Rust, and more
- **File & architecture map** — directory structure, entry points, dependency graph
- **Security scan** — 18 OWASP-aligned rules covering injection, XSS, secrets, weak crypto, path traversal, SSRF, auth issues
- **Dependency risk analysis** — CVE checks against known-vulnerable packages
- **Test coverage analysis** — source↔test file pairing, quality scoring, untested file detection
- **Code quality analysis** — complexity, error handling, dead code, style issues
- **Prioritized findings** — Critical / High / Medium / Low with file + line + evidence
- **AI-generated remediation** — fix suggestions with code examples (optional AI provider)
- **Regression test generation** — auto-generated Jest test templates
- **Before/after metrics** — security score, quality score, coverage estimate
- **Export reports** — Markdown and JSON formats, downloadable from the dashboard
- **6 autonomous agents** — Code Analyst, Security Agent, Test Agent, Debug Agent, Review Agent, Documentation Agent
- **Professional dashboard** — dark-mode React UI with 9 pages

---

## Architecture

```
devguardian-ai/
├── backend/                  # Express API server (Node.js)
│   ├── src/
│   │   ├── agents/           # Agent implementations
│   │   │   ├── orchestrator.js   # Multi-agent pipeline coordinator
│   │   │   ├── fixAgent.js       # Fix suggestion generator
│   │   │   ├── testAgent.js      # Test template generator
│   │   │   └── reportAgent.js    # Markdown/JSON report generator
│   │   ├── analyzers/        # Core analysis engines
│   │   │   ├── architectureAnalyzer.js
│   │   │   ├── securityAnalyzer.js
│   │   │   ├── codeQualityAnalyzer.js
│   │   │   ├── testAnalyzer.js
│   │   │   └── dependencyAnalyzer.js
│   │   ├── ai/               # AI provider abstraction
│   │   │   └── aiProvider.js     # OpenAI / Anthropic / IBM watsonx
│   │   ├── routes/           # REST API routes
│   │   │   ├── repository.js
│   │   │   ├── analysis.js
│   │   │   ├── reports.js
│   │   │   └── agents.js
│   │   ├── utils/
│   │   │   ├── fileUtils.js
│   │   │   └── languageDetector.js
│   │   └── index.js          # Express app entry point
│   └── __tests__/            # Backend tests (Jest)
├── frontend/                 # React dashboard (Vite + Tailwind)
│   └── src/
│       ├── pages/            # 9 dashboard pages
│       ├── components/       # Shared UI components
│       ├── context/          # AnalysisContext (global state)
│       └── api/client.js     # Axios API client
└── demo-repo/                # Intentionally vulnerable demo app
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### 1. Clone / open the project

```bash
cd devguardian-ai
```

### 2. Install dependencies

```bash
# Install all workspaces
npm install --workspace=backend
npm install --workspace=frontend
```

### 3. Configure environment (optional — AI features)

```bash
cp .env.example backend/.env
# Edit backend/.env — add your AI provider key if you want AI-enhanced fix suggestions
```

### 4. Start development servers

```bash
# In one terminal — backend
cd backend && npm run dev

# In another terminal — frontend
cd frontend && npm run dev
```

Open **http://localhost:3000** in your browser.

The backend runs on port 4000. The frontend proxies `/api` requests to it automatically.

---

## Usage

1. **Load Repository** — Go to the Repository page. Choose:
   - *Demo Repo* — built-in vulnerable Node.js app (fastest way to test)
   - *Local Path* — type an absolute path to a project on disk (dev only)
   - *Git URL* — paste a GitHub/GitLab/Bitbucket HTTPS URL to clone

2. **Start Analysis** — Click *Start Analysis*. The 6 agents run in sequence.

3. **View Results** — Navigate the dashboard:
   - **Overview** — scores, charts, key metrics
   - **Findings** — filterable list of all issues with evidence
   - **Security** — OWASP findings, dependency CVEs
   - **Testing** — coverage estimate, test quality, generated tests
   - **Agents** — live agent activity log
   - **Fixes** — AI-generated fix suggestions (review before applying)
   - **Validation** — post-analysis checklist
   - **Reports** — export Markdown or JSON report

4. **Export** — Download the report from the Reports page.

---

## AI Provider Configuration

DevGuardian works without an AI key (all analysis is rule-based). With an AI key, fix suggestions are enhanced.

| Provider | Env Var | Notes |
|----------|---------|-------|
| OpenAI | `OPENAI_API_KEY` | `AI_PROVIDER=openai`, `AI_MODEL=gpt-4o` |
| Anthropic | `ANTHROPIC_API_KEY` | `AI_PROVIDER=anthropic`, `AI_MODEL=claude-3-5-sonnet-20241022` |
| IBM watsonx | `WATSONX_API_KEY` + `WATSONX_PROJECT_ID` | `AI_PROVIDER=ibm-watsonx`, `AI_MODEL=ibm/granite-13b-instruct-v2` |

---

## Running Tests

```bash
cd backend
npm test
# or with coverage:
npm run test:coverage
```

Tests cover:
- API endpoint integration (health, agents, repository, analysis lifecycle)
- Security analyzer unit tests (eval detection, secret detection, MD5, CORS, etc.)

---

## Demo Repository

`demo-repo/` contains a deliberately vulnerable Express.js application with 15+ intentional vulnerabilities including:

- **SEC001** `eval()` remote code execution
- **SEC002** Command injection via `exec()`
- **SEC003/004** SQL injection via string concatenation
- **SEC006** Hardcoded database password
- **SEC008** MD5 password hashing
- **SEC009** `Math.random()` for security tokens
- **SEC010** Path traversal in file serving
- **SEC011** SSRF via user-controlled URL
- **DEP001** Outdated vulnerable npm packages

**⚠️ Never deploy demo-repo to production.**

---

## Safety

- DevGuardian **never automatically applies** fix suggestions. All fixes require explicit human review and approval.
- Git clone is restricted to `github.com`, `gitlab.com`, and `bitbucket.org` only.
- Local path loading is **disabled in production** (`NODE_ENV=production`).
- No secrets are logged or exposed in reports.
- No destructive commands are executed without user action.

---

## Production Build

```bash
cd frontend && npm run build
# Built files land in frontend/dist/
# Backend serves them when NODE_ENV=production
cd backend && NODE_ENV=production npm start
```

---

## License

MIT
