'use strict';

/**
 * Genspark-Superior — Stripe MCP Server
 *
 * Exposes payment processing capabilities via the Model Context Protocol.
 * Uses Stripe under the hood. Set this environment variable:
 *   STRIPE_SECRET_KEY — Stripe secret key (sk_live_... or sk_test_...)
 *
 * Tools exposed:
 *   create_customer(email, name, metadata)
 *   create_payment_intent(amount, currency, customerId, description)
 *   list_invoices(customerId, status, limit)
 *   send_invoice(invoiceId)
 *   get_subscription(subscriptionId)
 *   cancel_subscription(subscriptionId)
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

function getStripe() {
  const Stripe = require('stripe');
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY environment variable is required.');
  return new Stripe(key, { apiVersion: '2024-11-20.acacia' });
}

const TOOLS = [
  {
    name: 'create_customer',
    description: 'Create a new Stripe customer.',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        name: { type: 'string' },
        metadata: { type: 'object', additionalProperties: { type: 'string' } },
      },
      required: ['email'],
    },
  },
  {
    name: 'create_payment_intent',
    description: 'Create a PaymentIntent to charge a customer.',
    inputSchema: {
      type: 'object',
      properties: {
        amount: { type: 'integer', description: 'Amount in smallest currency unit (e.g. cents).' },
        currency: { type: 'string', description: 'ISO 4217 currency code, e.g. "usd".' },
        customerId: { type: 'string', description: 'Stripe customer ID.' },
        description: { type: 'string' },
      },
      required: ['amount', 'currency'],
    },
  },
  {
    name: 'list_invoices',
    description: 'List invoices for a customer, optionally filtered by status.',
    inputSchema: {
      type: 'object',
      properties: {
        customerId: { type: 'string' },
        status: {
          type: 'string',
          enum: ['draft', 'open', 'paid', 'uncollectible', 'void'],
        },
        limit: { type: 'integer', default: 10 },
      },
    },
  },
  {
    name: 'send_invoice',
    description: 'Finalize and send an open invoice to the customer.',
    inputSchema: {
      type: 'object',
      properties: {
        invoiceId: { type: 'string' },
      },
      required: ['invoiceId'],
    },
  },
  {
    name: 'get_subscription',
    description: 'Retrieve details of a Stripe subscription.',
    inputSchema: {
      type: 'object',
      properties: {
        subscriptionId: { type: 'string' },
      },
      required: ['subscriptionId'],
    },
  },
  {
    name: 'cancel_subscription',
    description: 'Cancel a Stripe subscription at period end.',
    inputSchema: {
      type: 'object',
      properties: {
        subscriptionId: { type: 'string' },
        immediately: {
          type: 'boolean',
          description: 'If true, cancel immediately rather than at period end.',
          default: false,
        },
      },
      required: ['subscriptionId'],
    },
  },
];

const server = new Server(
  { name: 'stripe-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const stripe = getStripe();

    if (name === 'create_customer') {
      const customer = await stripe.customers.create({
        email: args.email,
        name: args.name,
        metadata: args.metadata,
      });
      return { content: [{ type: 'text', text: JSON.stringify({ id: customer.id, email: customer.email }) }] };
    }

    if (name === 'create_payment_intent') {
      const pi = await stripe.paymentIntents.create({
        amount: args.amount,
        currency: args.currency,
        customer: args.customerId,
        description: args.description,
        automatic_payment_methods: { enabled: true },
      });
      return {
        content: [
          { type: 'text', text: JSON.stringify({ id: pi.id, status: pi.status, clientSecret: pi.client_secret }) },
        ],
      };
    }

    if (name === 'list_invoices') {
      const params = { limit: args.limit || 10 };
      if (args.customerId) params.customer = args.customerId;
      if (args.status) params.status = args.status;
      const invoices = await stripe.invoices.list(params);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              invoices.data.map((inv) => ({
                id: inv.id,
                status: inv.status,
                amount_due: inv.amount_due,
                customer: inv.customer,
                due_date: inv.due_date,
              }))
            ),
          },
        ],
      };
    }

    if (name === 'send_invoice') {
      const invoice = await stripe.invoices.sendInvoice(args.invoiceId);
      return { content: [{ type: 'text', text: JSON.stringify({ id: invoice.id, status: invoice.status }) }] };
    }

    if (name === 'get_subscription') {
      const sub = await stripe.subscriptions.retrieve(args.subscriptionId);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              id: sub.id,
              status: sub.status,
              current_period_end: sub.current_period_end,
              plan: sub.items.data[0]?.price?.nickname,
            }),
          },
        ],
      };
    }

    if (name === 'cancel_subscription') {
      const sub = args.immediately
        ? await stripe.subscriptions.cancel(args.subscriptionId)
        : await stripe.subscriptions.update(args.subscriptionId, { cancel_at_period_end: true });
      return { content: [{ type: 'text', text: JSON.stringify({ id: sub.id, status: sub.status }) }] };
    }

    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  } catch (err) {
    return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[stripe-server] Running on stdio');
}

main().catch((err) => {
  console.error('[stripe-server] Fatal:', err);
  process.exit(1);
});
