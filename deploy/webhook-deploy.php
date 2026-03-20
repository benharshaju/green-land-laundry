<?php
/**
 * Green Land Laundry — Webhook Deploy Script
 *
 * Upload this to your server's web-accessible directory.
 * Trigger: https://masterkuttu.space/webhook-deploy.php?token=YOUR_SECRET_TOKEN
 *
 * Set your secret token below before uploading.
 */

// ─── Configuration ──────────────────────────────────────────────────────────
$secret_token = getenv('DEPLOY_TOKEN') ?: 'greenland-deploy-2026';
$app_dir      = '/var/www/green-land-laundry';
$branch       = 'claude/connect-remote-control-cfpwb';
$log_file     = $app_dir . '/storage/logs/deploy.log';

// ─── Auth Check ─────────────────────────────────────────────────────────────
header('Content-Type: text/plain');

$token = $_GET['token'] ?? $_SERVER['HTTP_X_DEPLOY_TOKEN'] ?? '';
if ($token !== $secret_token) {
    http_response_code(403);
    die('Unauthorized');
}

// ─── Deploy ─────────────────────────────────────────────────────────────────
$commands = [
    "cd {$app_dir}",
    "git fetch origin {$branch} 2>&1",
    "git checkout {$branch} 2>&1",
    "git pull origin {$branch} 2>&1",
    "composer install --no-dev --optimize-autoloader --no-interaction 2>&1",
    "npm ci 2>&1",
    "npm run build 2>&1",
    "php artisan migrate --force 2>&1",
    "php artisan config:cache 2>&1",
    "php artisan route:cache 2>&1",
    "php artisan view:cache 2>&1",
    "php artisan storage:link 2>&1 || true",
    "sudo systemctl restart php8.2-fpm 2>&1 || true",
    "sudo supervisorctl restart greenland-worker:* 2>&1 || true",
];

$output = "=== Deploy started at " . date('Y-m-d H:i:s') . " ===\n\n";

foreach ($commands as $cmd) {
    $output .= "$ {$cmd}\n";
    $result = shell_exec($cmd);
    $output .= $result . "\n";
}

$output .= "\n=== Deploy finished at " . date('Y-m-d H:i:s') . " ===\n";

// Log
file_put_contents($log_file, $output, FILE_APPEND);

echo $output;
echo "\n✅ Deployment complete!";
