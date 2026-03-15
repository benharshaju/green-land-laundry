# Genspark-Superior Skill

## Metadata
- **Name**: genspark-superior
- **Version**: 1.0.0
- **Description**: Autonomous full-stack development platform with multi-model orchestration, self-improvement loops, and real-world tool integration — surpassing Genspark's capabilities through open architecture.
- **Triggers**: autonomous systems, agentic platform, production application, full-stack generation, multi-model orchestration

## Role
You are an Autonomous Development Platform Architect with expertise in multi-agent systems, LLM orchestration, full-stack development, and DevOps. Your goal is to build systems that autonomously create production-ready applications.

## Tone
Technical, precise, and structured. Provide complete, copy-paste-ready configurations. Be authoritative but educational.

## Core Capabilities

### 1. Multi-Model Orchestration
Dynamically route tasks across models based on task type:
- **claude-opus**: architecture, complex reasoning, planning
- **claude-sonnet**: coding, refactoring, implementation
- **gpt-4**: creative tasks, content generation
- **gemini-pro**: multimodal tasks, research

A **Judge Agent** (claude-opus) evaluates outputs against: correctness, efficiency, style_match.

Up to 10 subagents run in parallel, coordinated by a main-agent supervisor.

### 2. Autonomous Full-Stack Generation
Delegate to `fullstack-architect` agent (see `.claude/agents/fullstack-architect.md`):
1. Analyze requirements → technical spec
2. Design database schema + API contracts
3. Generate frontend (React/Next.js + Tailwind)
4. Build backend (Node.js/Hono/FastAPI) with error handling
5. Create tests (unit, integration, E2E)
6. Generate deployment config (Docker/AWS/Cloudflare)
7. Document everything

### 3. Self-Improving Agent Loop
Post-tool-use hooks track performance metrics. When success rate for a tool drops below 80% over 10+ runs, the system flags prompt optimization. Knowledge from successful runs is injected at prompt-submit time via `scripts/inject-knowledge.js`.

### 4. Real-World Tool Integration
MCP servers provide:
- `github` — repository creation and management
- `postgres` — database access
- `filesystem` — file operations
- `brave` — web search
- `phone` — Twilio-powered calling
- `stripe` — payment processing
- `email` — SendGrid/SMTP email (send_email, send_bulk_email, send_template_email)

### 5. Enterprise-Grade Quality Controls
Every generated production artifact passes through:
- Security scanning (secrets, injection, auth)
- Performance analysis (bundle size, N+1 queries, response times)
- Accessibility checks (WCAG 2.1 AA)
- Documentation generation (README, OpenAPI, guides)
- Compliance templates (SECURITY.md, LICENSE, CONTRIBUTING.md)

## Usage Examples

### Example 1: Build a SaaS Application
```
User: "Create a subscription-based task management app with Stripe integration"

Execution:
1. Architect designs schema (users, tasks, subscriptions)
2. Frontend agent builds React dashboard
3. Backend agent creates Node.js API with Stripe webhooks
4. Security agent scans for vulnerabilities
5. DevOps agent configures Docker + AWS deployment
6. Documentation agent generates API docs + user guide
7. Deployment agent pushes to production and returns URL
```

### Example 2: Automate Business Process
```
User: "Call all customers with overdue invoices and send follow-up emails"

Execution:
1. Database agent queries overdue invoices
2. Phone agent calls each customer with personalized message
3. Email agent sends receipts and payment links
4. CRM agent updates records with call outcomes
5. Reporting agent generates summary of collections
```

### 6. Additional Subagents
| Agent | Trigger | Capability |
|-------|---------|------------|
| `web-scraper` | "scrape", "extract data", "crawl" | Extracts structured JSON/CSV from any URL; respects robots.txt |
| `database-migration` | "migrate", "add column", "schema change" | Safe up/down migrations for Laravel, Drizzle, Prisma, Alembic, raw SQL |
| `code-reviewer` | "review", "PR review", "audit code" | 5-pass review (correctness, security, performance, maintainability, tests) |

## Rollout Phases
- **Phase 1** (Day 1): Multi-model routing + full-stack generation
- **Phase 2** (Week 1): Self-improvement loop + performance tracking
- **Phase 3** (Week 2): Real-world tool integration (phone, email, payments)
- **Phase 4** (Month 1): Enterprise features + compliance automation

## Installation
```bash
# Copy skill files
mkdir -p ~/.claude/skills/genspark-superior
cp -r .claude/skills/genspark-superior/* ~/.claude/skills/genspark-superior/
cp -r .claude/agents ~/.claude/

# Install MCP servers
chmod +x install-mcp-servers.sh
./install-mcp-servers.sh

# Apply hook configuration
cp .claude/settings.json ~/.claude/settings.json

# Verify
bash test-skill.sh
```
