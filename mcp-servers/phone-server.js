'use strict';

/**
 * Genspark-Superior — Phone MCP Server
 *
 * Exposes phone-calling capabilities via the Model Context Protocol.
 * Uses Twilio under the hood. Set these environment variables:
 *   TWILIO_SID      — Twilio Account SID
 *   TWILIO_TOKEN    — Twilio Auth Token
 *   PHONE_SERVER_PORT — Port to listen on (default: 3001)
 *
 * Tools exposed:
 *   make_call(to, from, message)  — Place an outbound call with a TTS message
 *   send_sms(to, from, body)      — Send an SMS
 *   get_call_status(callSid)      — Retrieve the status of a call
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

// Lazy-load Twilio so the server can start without the package if only
// listing tools or during testing.
function getTwilioClient() {
  const twilio = require('twilio');
  const sid = process.env.TWILIO_SID;
  const token = process.env.TWILIO_TOKEN;
  if (!sid || !token) {
    throw new Error('TWILIO_SID and TWILIO_TOKEN environment variables are required.');
  }
  return twilio(sid, token);
}

const TOOLS = [
  {
    name: 'make_call',
    description: 'Place an outbound phone call and speak a message using text-to-speech.',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'E.164 destination phone number, e.g. +12125551234' },
        from: { type: 'string', description: 'E.164 Twilio source number, e.g. +18005559999' },
        message: { type: 'string', description: 'Text to speak on the call.' },
      },
      required: ['to', 'from', 'message'],
    },
  },
  {
    name: 'send_sms',
    description: 'Send an SMS message via Twilio.',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'E.164 destination phone number.' },
        from: { type: 'string', description: 'E.164 Twilio source number.' },
        body: { type: 'string', description: 'SMS body text (max 1600 chars).' },
      },
      required: ['to', 'from', 'body'],
    },
  },
  {
    name: 'get_call_status',
    description: 'Retrieve the current status of a Twilio call.',
    inputSchema: {
      type: 'object',
      properties: {
        callSid: { type: 'string', description: 'Twilio call SID returned by make_call.' },
      },
      required: ['callSid'],
    },
  },
];

const server = new Server(
  { name: 'phone-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const client = getTwilioClient();

    if (name === 'make_call') {
      const { to, from, message } = args;
      const call = await client.calls.create({
        twiml: `<Response><Say voice="Polly.Joanna">${message}</Say></Response>`,
        to,
        from,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify({ callSid: call.sid, status: call.status }) }],
      };
    }

    if (name === 'send_sms') {
      const { to, from, body } = args;
      const msg = await client.messages.create({ body, to, from });
      return {
        content: [{ type: 'text', text: JSON.stringify({ messageSid: msg.sid, status: msg.status }) }],
      };
    }

    if (name === 'get_call_status') {
      const { callSid } = args;
      const call = await client.calls(callSid).fetch();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ callSid: call.sid, status: call.status, duration: call.duration }),
          },
        ],
      };
    }

    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  } catch (err) {
    return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[phone-server] Running on stdio');
}

main().catch((err) => {
  console.error('[phone-server] Fatal:', err);
  process.exit(1);
});
