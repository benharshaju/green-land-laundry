# Enterprise Quality Assurance

When generating any production code, always apply the following checks before delivering output.

## Security Checks
- Run `npm audit` / `pip-audit` / `composer audit` on dependencies
- Scan for hardcoded secrets — use environment variables instead
- Validate input sanitization: prevent SQL injection, XSS, command injection
- Verify authentication and authorization are properly implemented
- Confirm HTTPS enforcement and secure HTTP headers (CSP, HSTS, X-Frame-Options)
- Check CORS policy is restrictive and intentional

## Performance Checks
- Analyze frontend bundle size — warn if uncompressed JS exceeds 200 KB
- Detect N+1 query patterns in database access code
- Verify caching strategy is in place (Redis, CDN, HTTP cache headers)
- API response time target: < 200 ms p95
- Ensure database indexes exist for common query patterns

## Accessibility Checks
- Use semantic HTML elements (nav, main, article, section, header, footer)
- Verify ARIA labels on all interactive elements without visible text
- Check color contrast meets WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large)
- Confirm keyboard navigation works for all interactive components
- Ensure focus indicators are visible
- Provide alt text for all images

## Documentation Requirements
Every generated project must include:
- `README.md` — project overview, prerequisites, setup steps, usage
- `docs/api.yaml` — OpenAPI 3.0 specification for all endpoints
- Inline comments for non-obvious logic
- `docs/deployment.md` — step-by-step deployment guide

## Compliance Templates
Auto-generate these files for every new project:
- `SECURITY.md` — vulnerability disclosure process
- `LICENSE` — default to MIT unless otherwise specified
- `CONTRIBUTING.md` — contribution guidelines
- `CODE_OF_CONDUCT.md` — based on Contributor Covenant 2.1
- `.env.example` — all required environment variables with descriptions, no real values

## Quality Gate — Block Delivery If
- Any `npm audit` critical or high severity vulnerability is unfixed
- Hardcoded API keys or passwords are detected
- No authentication on endpoints that access user data
- Zero test coverage on business logic
- README is missing or empty
