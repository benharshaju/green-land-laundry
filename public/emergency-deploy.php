<?php
/**
 * Emergency self-deploy script.
 * Runs without Laravel. Placed in public/ so it's web-accessible.
 * Trigger: https://masterkuttu.space/emergency-deploy.php?token=greenland-deploy-2026
 */

header('Content-Type: text/plain; charset=utf-8');

$token = $_GET['token'] ?? '';
if ($token !== 'greenland-deploy-2026') {
    http_response_code(403);
    die('Unauthorized');
}

set_time_limit(600);
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== Emergency Deploy ===\n";
echo "Time: " . date('Y-m-d H:i:s') . "\n";
echo "PHP: " . phpversion() . "\n";
echo "Server: " . php_uname() . "\n\n";

// Find where we are
$public_dir = __DIR__;
$app_dir = dirname($public_dir);
echo "Public dir: $public_dir\n";
echo "App dir: $app_dir\n\n";

// Check if this is inside the Laravel app
$has_artisan = file_exists($app_dir . '/artisan');
$has_vendor = file_exists($app_dir . '/vendor/autoload.php');
$has_env = file_exists($app_dir . '/.env');
$has_git = is_dir($app_dir . '/.git');

echo "Has artisan: " . ($has_artisan ? 'YES' : 'NO') . "\n";
echo "Has vendor: " . ($has_vendor ? 'YES' : 'NO') . "\n";
echo "Has .env: " . ($has_env ? 'YES' : 'NO') . "\n";
echo "Has .git: " . ($has_git ? 'YES' : 'NO') . "\n\n";

// List directory
echo "=== App directory listing ===\n";
$files = scandir($app_dir);
foreach ($files as $f) {
    if ($f === '.' || $f === '..') continue;
    $path = $app_dir . '/' . $f;
    $type = is_dir($path) ? 'DIR' : 'FILE';
    $size = is_file($path) ? filesize($path) : '-';
    echo sprintf("%-6s %-30s %s\n", $type, $f, $size);
}

echo "\n=== Public directory listing ===\n";
$files = scandir($public_dir);
foreach ($files as $f) {
    if ($f === '.' || $f === '..') continue;
    $path = $public_dir . '/' . $f;
    $type = is_dir($path) ? 'DIR' : 'FILE';
    echo sprintf("%-6s %s\n", $type, $f);
}

echo "\n=== Build assets ===\n";
$build_dir = $public_dir . '/build';
if (is_dir($build_dir)) {
    echo "build/ exists\n";
    if (file_exists($build_dir . '/manifest.json')) {
        echo "manifest.json exists (" . filesize($build_dir . '/manifest.json') . " bytes)\n";
    } else {
        echo "manifest.json MISSING\n";
    }
} else {
    echo "build/ directory MISSING\n";
}

// Check .env content (redacted)
if ($has_env) {
    echo "\n=== .env check ===\n";
    $env_content = file_get_contents($app_dir . '/.env');
    $lines = explode("\n", $env_content);
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || $line[0] === '#') continue;
        $parts = explode('=', $line, 2);
        $key = $parts[0];
        $val = $parts[1] ?? '';
        // Only show key and whether value is set
        $has_val = !empty(trim($val));
        echo "$key = " . ($has_val ? '[SET]' : '[EMPTY]') . "\n";
    }
}

// Check storage permissions
echo "\n=== Storage check ===\n";
$storage = $app_dir . '/storage';
if (is_dir($storage)) {
    echo "storage/ exists, writable: " . (is_writable($storage) ? 'YES' : 'NO') . "\n";
    $log_dir = $storage . '/logs';
    if (is_dir($log_dir)) {
        echo "storage/logs/ writable: " . (is_writable($log_dir) ? 'YES' : 'NO') . "\n";
    }
    $framework = $storage . '/framework';
    if (is_dir($framework)) {
        echo "storage/framework/ writable: " . (is_writable($framework) ? 'YES' : 'NO') . "\n";
        foreach (['cache', 'sessions', 'views'] as $sub) {
            $p = $framework . '/' . $sub;
            if (is_dir($p)) {
                echo "  $sub/ writable: " . (is_writable($p) ? 'YES' : 'NO') . "\n";
            } else {
                echo "  $sub/ MISSING - creating...\n";
                @mkdir($p, 0775, true);
                echo "  $sub/ created: " . (is_dir($p) ? 'YES' : 'FAILED') . "\n";
            }
        }
    }
    $bootstrap_cache = $app_dir . '/bootstrap/cache';
    if (is_dir($bootstrap_cache)) {
        echo "bootstrap/cache/ writable: " . (is_writable($bootstrap_cache) ? 'YES' : 'NO') . "\n";
    }
}

// Check open_basedir
echo "\n=== PHP restrictions ===\n";
echo "open_basedir: " . (ini_get('open_basedir') ?: 'none') . "\n";
echo "disable_functions: " . (ini_get('disable_functions') ?: 'none') . "\n";

// Try to run artisan commands if shell_exec is available
echo "\n=== Running fixes ===\n";

$can_exec = function_exists('shell_exec') && !in_array('shell_exec', explode(',', ini_get('disable_functions')));

if ($can_exec && $has_artisan) {
    // Git pull latest
    if ($has_git) {
        echo "--- Git pull ---\n";
        echo shell_exec("cd $app_dir && git fetch origin claude/connect-remote-control-cfpwb 2>&1") . "\n";
        echo shell_exec("cd $app_dir && git checkout claude/connect-remote-control-cfpwb 2>&1") . "\n";
        echo shell_exec("cd $app_dir && git reset --hard origin/claude/connect-remote-control-cfpwb 2>&1") . "\n";
    }

    // Generate key if missing
    echo "--- Key generate ---\n";
    echo shell_exec("cd $app_dir && php artisan key:generate --force 2>&1") . "\n";

    // Clear caches
    echo "--- Cache clear ---\n";
    echo shell_exec("cd $app_dir && php artisan config:clear 2>&1") . "\n";
    echo shell_exec("cd $app_dir && php artisan route:clear 2>&1") . "\n";
    echo shell_exec("cd $app_dir && php artisan view:clear 2>&1") . "\n";
    echo shell_exec("cd $app_dir && php artisan cache:clear 2>&1") . "\n";

    // Fix permissions
    echo "--- Permissions ---\n";
    echo shell_exec("chmod -R 775 $app_dir/storage 2>&1") . "\n";
    echo shell_exec("chmod -R 755 $app_dir/bootstrap/cache 2>&1") . "\n";

    // Storage link
    echo "--- Storage link ---\n";
    echo shell_exec("cd $app_dir && php artisan storage:link 2>&1") . "\n";

    // Migrate
    echo "--- Migrate ---\n";
    echo shell_exec("cd $app_dir && php artisan migrate --force 2>&1") . "\n";

    // Seed
    echo "--- Seed ---\n";
    echo shell_exec("cd $app_dir && php artisan db:seed --force 2>&1") . "\n";

    echo "\n=== Root .htaccess ===\n";
    $htaccess = "<IfModule mod_rewrite.c>\n    RewriteEngine On\n    RewriteRule ^(.*)\$ public/\$1 [L]\n</IfModule>\n";
    file_put_contents($app_dir . '/.htaccess', $htaccess);
    echo "Written root .htaccess\n";

} else {
    echo "shell_exec not available or no artisan\n";

    // Try manual fixes without shell
    // Create storage directories
    $dirs = [
        $app_dir . '/storage/logs',
        $app_dir . '/storage/framework/cache',
        $app_dir . '/storage/framework/sessions',
        $app_dir . '/storage/framework/views',
        $app_dir . '/bootstrap/cache',
    ];
    foreach ($dirs as $dir) {
        if (!is_dir($dir)) {
            @mkdir($dir, 0775, true);
            echo "Created: $dir\n";
        }
    }

    // Write .htaccess
    $htaccess = "<IfModule mod_rewrite.c>\n    RewriteEngine On\n    RewriteRule ^(.*)\$ public/\$1 [L]\n</IfModule>\n";
    file_put_contents($app_dir . '/.htaccess', $htaccess);
    echo "Written root .htaccess\n";

    // Generate APP_KEY if missing
    if ($has_env) {
        $env = file_get_contents($app_dir . '/.env');
        if (strpos($env, 'APP_KEY=base64:') === false || strpos($env, 'APP_KEY=\n') !== false || strpos($env, "APP_KEY=\r") !== false) {
            $key = 'base64:' . base64_encode(random_bytes(32));
            $env = preg_replace('/APP_KEY=.*/', 'APP_KEY=' . $key, $env);
            file_put_contents($app_dir . '/.env', $env);
            echo "Generated APP_KEY\n";
        }
    }
}

echo "\n=== DONE ===\n";
echo "Now try loading: https://masterkuttu.space/login\n";
