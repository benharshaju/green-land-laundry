#!/usr/bin/env bash
# Genspark-Superior — Skill Validation Tests
# Run from the project root: bash test-skill.sh
set -euo pipefail

PASS=0
FAIL=0

run_test() {
  local name="$1"
  local cmd="$2"
  echo -n "  TEST: ${name} ... "
  if eval "$cmd" &>/dev/null; then
    echo "PASS"
    PASS=$((PASS + 1))
  else
    echo "FAIL"
    FAIL=$((FAIL + 1))
  fi
}

echo "Genspark-Superior Skill — Validation Suite"
echo "============================================"

# ── File structure checks ──────────────────────────────────────────────────
echo ""
echo "1. File Structure"
run_test "skill.md exists"               "test -f .claude/skills/genspark-superior/skill.md"
run_test "orchestrator.json exists"      "test -f .claude/skills/genspark-superior/orchestrator.json"
run_test "quality-assurance.md exists"   "test -f .claude/skills/genspark-superior/quality-assurance.md"
run_test "error-handler.js exists"       "test -f .claude/skills/genspark-superior/error-handler.js"
run_test "fullstack-architect.md exists" "test -f .claude/agents/fullstack-architect.md"
run_test "security-auditor.md exists"    "test -f .claude/agents/security-auditor.md"
run_test "devops-engineer.md exists"     "test -f .claude/agents/devops-engineer.md"
run_test "settings.json exists"          "test -f .claude/settings.json"
run_test "track-performance.js exists"   "test -f scripts/track-performance.js"
run_test "inject-knowledge.js exists"    "test -f scripts/inject-knowledge.js"
run_test "phone-server.js exists"                    "test -f mcp-servers/phone-server.js"
run_test "stripe-server.js exists"                   "test -f mcp-servers/stripe-server.js"
run_test "email-server.js exists"                    "test -f mcp-servers/email-server.js"
run_test "web-scraper.md exists"                     "test -f .claude/agents/web-scraper.md"
run_test "database-migration.md exists"              "test -f .claude/agents/database-migration.md"
run_test "code-reviewer.md exists"                   "test -f .claude/agents/code-reviewer.md"

# ── JSON validation ────────────────────────────────────────────────────────
echo ""
echo "2. JSON Validity"
run_test "orchestrator.json is valid JSON" \
  "node -e \"require('./.claude/skills/genspark-superior/orchestrator.json')\""
run_test "settings.json is valid JSON" \
  "node -e \"require('./.claude/settings.json')\""

# ── Script syntax checks ───────────────────────────────────────────────────
echo ""
echo "3. Script Syntax"
run_test "error-handler.js syntax OK" \
  "node --check .claude/skills/genspark-superior/error-handler.js"
run_test "track-performance.js syntax OK" \
  "node --check scripts/track-performance.js"
run_test "inject-knowledge.js syntax OK" \
  "node --check scripts/inject-knowledge.js"
run_test "phone-server.js syntax OK" \
  "node --check mcp-servers/phone-server.js"
run_test "stripe-server.js syntax OK" \
  "node --check mcp-servers/stripe-server.js"
run_test "email-server.js syntax OK" \
  "node --check mcp-servers/email-server.js"

# ── Performance tracker functional test ───────────────────────────────────
echo ""
echo "4. Performance Tracker"
run_test "track-performance.js runs without error" \
  "node scripts/track-performance.js TestTool 0 /tmp/test.js"
run_test "performance-log.json created" \
  "test -f .claude/performance-log.json"

# ── Summary ────────────────────────────────────────────────────────────────
echo ""
echo "============================================"
echo "Results: ${PASS} passed, ${FAIL} failed"
if [ "$FAIL" -gt 0 ]; then
  echo "Some tests failed. Review the output above."
  exit 1
else
  echo "All tests passed."
fi
