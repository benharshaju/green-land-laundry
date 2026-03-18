<?php

return [
    /*
    |--------------------------------------------------------------------------
    | n8n Workflow Automation Configuration
    |--------------------------------------------------------------------------
    |
    | n8n integration for automating laundry workflows such as order
    | notifications, customer follow-ups, reporting, and more.
    |
    */

    'api_key' => env('N8N_API_KEY'),

    'base_url' => env('N8N_BASE_URL', 'https://greenlandlaundry.app.n8n.cloud'),

    'webhook_url' => env('N8N_WEBHOOK_URL', 'https://greenlandlaundry.app.n8n.cloud/webhook'),

    // Secret used to verify incoming webhooks from n8n
    'webhook_secret' => env('N8N_WEBHOOK_SECRET'),

    // Enable/disable n8n integration
    'enabled' => env('N8N_ENABLED', true),

    // Workflow webhook paths (appended to webhook_url)
    'workflows' => [
        'order_created'        => env('N8N_WORKFLOW_ORDER_CREATED', '/order-created'),
        'order_status_changed' => env('N8N_WORKFLOW_ORDER_STATUS', '/order-status-changed'),
        'order_completed'      => env('N8N_WORKFLOW_ORDER_COMPLETED', '/order-completed'),
        'customer_created'     => env('N8N_WORKFLOW_CUSTOMER_CREATED', '/customer-created'),
        'daily_report'         => env('N8N_WORKFLOW_DAILY_REPORT', '/daily-report'),
        'payment_received'     => env('N8N_WORKFLOW_PAYMENT_RECEIVED', '/payment-received'),
    ],

    // Timeout for HTTP requests to n8n (seconds)
    'timeout' => env('N8N_TIMEOUT', 10),
];
