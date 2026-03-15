#!/usr/bin/env bash
# Genspark-Superior — MCP Server Installer
# Run from the project root: bash install-mcp-servers.sh
set -euo pipefail

echo "Installing Genspark-Superior MCP servers..."

# ── Standard Anthropic MCP servers ─────────────────────────────────────────
echo "  [1/6] GitHub integration"
claude mcp add github -- npx -y @anthropic/mcp-server-github

echo "  [2/6] PostgreSQL database access"
claude mcp add postgres -- npx -y @anthropic/mcp-server-postgres

echo "  [3/6] Filesystem access (project root)"
claude mcp add filesystem -- npx -y @anthropic/mcp-server-filesystem .

echo "  [4/6] Brave web search"
claude mcp add brave -- npx -y @anthropic/mcp-server-brave

# ── Custom MCP servers ──────────────────────────────────────────────────────
echo "  [5/6] Phone server (Twilio)"
# Install runtime dependencies if node_modules is absent
if [ ! -d "node_modules/@modelcontextprotocol" ]; then
  echo "    Installing MCP SDK and Twilio..."
  npm install --save @modelcontextprotocol/sdk twilio
fi
claude mcp add phone -- node "$(pwd)/mcp-servers/phone-server.js"

echo "  [6/6] Stripe payment server"
if [ ! -d "node_modules/stripe" ]; then
  echo "    Installing Stripe..."
  npm install --save stripe
fi
claude mcp add stripe -- node "$(pwd)/mcp-servers/stripe-server.js"

echo ""
echo "All MCP servers installed."
echo ""
echo "Next: set the following environment variables before starting Claude Code:"
echo "  GITHUB_TOKEN        — GitHub personal access token"
echo "  DATABASE_URL        — PostgreSQL connection string"
echo "  BRAVE_API_KEY       — Brave Search API key"
echo "  TWILIO_SID          — Twilio Account SID"
echo "  TWILIO_TOKEN        — Twilio Auth Token"
echo "  STRIPE_SECRET_KEY   — Stripe secret key (sk_test_... or sk_live_...)"
