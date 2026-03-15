'use strict';

/**
 * Genspark-Superior — Email MCP Server
 *
 * Exposes email capabilities via the Model Context Protocol.
 * Supports SendGrid (preferred) with SMTP fallback.
 *
 * Environment variables:
 *   SENDGRID_API_KEY   — SendGrid API key (sg_...)  [preferred]
 *   SMTP_HOST          — SMTP hostname              [fallback]
 *   SMTP_PORT          — SMTP port (default: 587)   [fallback]
 *   SMTP_USER          — SMTP username              [fallback]
 *   SMTP_PASS          — SMTP password              [fallback]
 *   EMAIL_FROM         — Default "from" address
 *
 * Tools exposed:
 *   send_email(to, subject, body, [from], [cc], [bcc], [html])
 *   send_bulk_email(recipients, subject, body, [from])
 *   send_template_email(to, templateId, dynamicData, [from])
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

// ── Transport selection ───────────────────────────────────────────────────

function getTransport() {
  if (process.env.SENDGRID_API_KEY) {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    return { type: 'sendgrid', client: sgMail };
  }

  if (process.env.SMTP_HOST) {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return { type: 'smtp', client: transporter };
  }

  throw new Error(
    'No email transport configured. Set SENDGRID_API_KEY or SMTP_HOST + SMTP_USER + SMTP_PASS.'
  );
}

const DEFAULT_FROM = process.env.EMAIL_FROM || 'noreply@example.com';

// ── Tool definitions ──────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'send_email',
    description: 'Send a single email via SendGrid or SMTP.',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient email address.' },
        subject: { type: 'string' },
        body: { type: 'string', description: 'Plain-text body.' },
        html: { type: 'string', description: 'Optional HTML body (overrides plain text in HTML clients).' },
        from: { type: 'string', description: 'Sender address. Defaults to EMAIL_FROM env var.' },
        cc: { type: 'string', description: 'CC address (single address).' },
        bcc: { type: 'string', description: 'BCC address (single address).' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'send_bulk_email',
    description: 'Send the same email to multiple recipients (one send per recipient, no cross-leakage).',
    inputSchema: {
      type: 'object',
      properties: {
        recipients: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of recipient email addresses.',
        },
        subject: { type: 'string' },
        body: { type: 'string', description: 'Plain-text body. Use {{name}} as a placeholder if names provided.' },
        from: { type: 'string', description: 'Sender address. Defaults to EMAIL_FROM env var.' },
      },
      required: ['recipients', 'subject', 'body'],
    },
  },
  {
    name: 'send_template_email',
    description: 'Send an email using a SendGrid dynamic template.',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string' },
        templateId: { type: 'string', description: 'SendGrid template ID (d-xxxxxxxx).' },
        dynamicData: {
          type: 'object',
          description: 'Key-value pairs injected into the template.',
          additionalProperties: true,
        },
        from: { type: 'string', description: 'Sender address. Defaults to EMAIL_FROM env var.' },
      },
      required: ['to', 'templateId', 'dynamicData'],
    },
  },
];

// ── Send helpers ──────────────────────────────────────────────────────────

async function sendViaSendGrid(client, msg) {
  const [response] = await client.send(msg);
  return { statusCode: response.statusCode, messageId: response.headers['x-message-id'] || null };
}

async function sendViaSmtp(client, msg) {
  const info = await client.sendMail(msg);
  return { messageId: info.messageId, accepted: info.accepted };
}

async function dispatchEmail(transport, msg) {
  if (transport.type === 'sendgrid') return sendViaSendGrid(transport.client, msg);
  return sendViaSmtp(transport.client, msg);
}

// ── MCP server ────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'email-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const transport = getTransport();

    if (name === 'send_email') {
      const msg = {
        to: args.to,
        from: args.from || DEFAULT_FROM,
        subject: args.subject,
        text: args.body,
        ...(args.html && { html: args.html }),
        ...(args.cc && { cc: args.cc }),
        ...(args.bcc && { bcc: args.bcc }),
      };
      const result = await dispatchEmail(transport, msg);
      return { content: [{ type: 'text', text: JSON.stringify({ sent: true, ...result }) }] };
    }

    if (name === 'send_bulk_email') {
      const results = [];
      for (const recipient of args.recipients) {
        const msg = {
          to: recipient,
          from: args.from || DEFAULT_FROM,
          subject: args.subject,
          text: args.body,
        };
        try {
          const result = await dispatchEmail(transport, msg);
          results.push({ to: recipient, sent: true, ...result });
        } catch (err) {
          results.push({ to: recipient, sent: false, error: err.message });
        }
      }
      const summary = {
        total: results.length,
        sent: results.filter((r) => r.sent).length,
        failed: results.filter((r) => !r.sent).length,
        results,
      };
      return { content: [{ type: 'text', text: JSON.stringify(summary) }] };
    }

    if (name === 'send_template_email') {
      if (transport.type !== 'sendgrid') {
        return {
          content: [{ type: 'text', text: 'Error: send_template_email requires SendGrid (SENDGRID_API_KEY).' }],
          isError: true,
        };
      }
      const msg = {
        to: args.to,
        from: args.from || DEFAULT_FROM,
        templateId: args.templateId,
        dynamicTemplateData: args.dynamicData,
      };
      const result = await sendViaSendGrid(transport.client, msg);
      return { content: [{ type: 'text', text: JSON.stringify({ sent: true, ...result }) }] };
    }

    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  } catch (err) {
    return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[email-server] Running on stdio');
}

main().catch((err) => {
  console.error('[email-server] Fatal:', err);
  process.exit(1);
});
