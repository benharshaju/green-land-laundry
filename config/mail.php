<?php

return [
    'default' => env('MAIL_MAILER', 'smtp'),

    'mailers' => [
        'smtp' => [
            'transport'  => 'smtp',
            'scheme'     => env('MAIL_SCHEME'),
            'url'        => env('MAIL_URL'),
            'host'       => env('MAIL_HOST', 'smtp.mailgun.org'),
            'port'       => env('MAIL_PORT', 587),
            'encryption' => env('MAIL_ENCRYPTION', 'tls'),
            'username'   => env('MAIL_USERNAME'),
            'password'   => env('MAIL_PASSWORD'),
            'timeout'    => null,
        ],
        'log' => [
            'transport' => 'log',
            'channel'   => env('MAIL_LOG_CHANNEL'),
        ],
        'array'  => ['transport' => 'array'],
        'failover' => [
            'transport' => 'failover',
            'mailers'   => ['smtp', 'log'],
        ],
        'roundrobin' => [
            'transport' => 'roundrobin',
            'mailers'   => ['ses', 'smtp'],
        ],
    ],

    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'info@greenlandlaundry.com'),
        'name'    => env('MAIL_FROM_NAME', 'Green Land Laundry'),
    ],
];
