<?php

return [
    'mailgun' => [
        'domain'   => env('MAILGUN_DOMAIN'),
        'secret'   => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme'   => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key'    => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    // Twilio WhatsApp
    'twilio' => [
        'sid'            => env('TWILIO_SID'),
        'token'          => env('TWILIO_AUTH_TOKEN'),
        'whatsapp_from'  => env('TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886'),
    ],

    // n8n Workflow Automation
    'n8n' => [
        'api_key'        => env('N8N_API_KEY'),
        'base_url'       => env('N8N_BASE_URL', 'https://greenlandlaundry.app.n8n.cloud'),
        'webhook_url'    => env('N8N_WEBHOOK_URL', 'https://greenlandlaundry.app.n8n.cloud/webhook'),
        'webhook_secret' => env('N8N_WEBHOOK_SECRET'),
        'enabled'        => env('N8N_ENABLED', true),
    ],
];
