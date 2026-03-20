#!/bin/bash
###############################################################################
# Green Land Laundry — VPS Deployment Script
# Target: masterkuttu.space (Ubuntu/Debian VPS)
#
# Usage: Run as root on your VPS:
#   curl -sSL <this-script-url> | bash
#   OR: bash deploy.sh
###############################################################################

set -euo pipefail

# ─── Configuration ──────────────────────────────────────────────────────────
DOMAIN="masterkuttu.space"
APP_DIR="/var/www/green-land-laundry"
REPO_URL="https://github.com/benharshaju/green-land-laundry.git"
BRANCH="claude/connect-remote-control-cfpwb"
DB_NAME="greenland_laundry"
DB_USER="greenland_user"
DB_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 20)
PHP_VERSION="8.2"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
info() { echo -e "${CYAN}[→]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Green Land Laundry — VPS Deployment                 ║${NC}"
echo -e "${GREEN}║     Domain: ${CYAN}${DOMAIN}${GREEN}                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ─── Check root ─────────────────────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
    err "Please run as root: sudo bash deploy.sh"
fi

# ─── 1. System Update & Dependencies ────────────────────────────────────────
info "Updating system packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq

info "Installing base dependencies..."
apt-get install -y -qq \
    software-properties-common \
    curl wget git unzip zip \
    nginx \
    mysql-server \
    certbot python3-certbot-nginx \
    supervisor \
    cron

# ─── 2. PHP 8.2 ─────────────────────────────────────────────────────────────
info "Installing PHP ${PHP_VERSION}..."
add-apt-repository -y ppa:ondrej/php 2>/dev/null || true
apt-get update -qq
apt-get install -y -qq \
    php${PHP_VERSION}-fpm \
    php${PHP_VERSION}-cli \
    php${PHP_VERSION}-mysql \
    php${PHP_VERSION}-mbstring \
    php${PHP_VERSION}-xml \
    php${PHP_VERSION}-curl \
    php${PHP_VERSION}-zip \
    php${PHP_VERSION}-gd \
    php${PHP_VERSION}-intl \
    php${PHP_VERSION}-bcmath \
    php${PHP_VERSION}-tokenizer \
    php${PHP_VERSION}-dom \
    php${PHP_VERSION}-fileinfo \
    php${PHP_VERSION}-redis

log "PHP ${PHP_VERSION} installed"

# ─── 3. Composer ─────────────────────────────────────────────────────────────
info "Installing Composer..."
if ! command -v composer &>/dev/null; then
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
fi
log "Composer ready"

# ─── 4. Node.js 20 LTS ──────────────────────────────────────────────────────
info "Installing Node.js 20 LTS..."
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -qq nodejs
fi
log "Node.js $(node -v) installed"

# ─── 5. MySQL Database ──────────────────────────────────────────────────────
info "Setting up MySQL database..."
systemctl start mysql
systemctl enable mysql

mysql -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -e "GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
log "MySQL database '${DB_NAME}' ready"

# ─── 6. Clone / Update Repository ───────────────────────────────────────────
info "Deploying application to ${APP_DIR}..."
if [ -d "${APP_DIR}/.git" ]; then
    cd "${APP_DIR}"
    git fetch origin "${BRANCH}"
    git checkout "${BRANCH}"
    git pull origin "${BRANCH}"
    log "Repository updated"
else
    rm -rf "${APP_DIR}"
    git clone -b "${BRANCH}" "${REPO_URL}" "${APP_DIR}"
    log "Repository cloned"
fi
cd "${APP_DIR}"

# ─── 7. Set Permissions ─────────────────────────────────────────────────────
info "Setting file permissions..."
chown -R www-data:www-data "${APP_DIR}"
find "${APP_DIR}" -type f -exec chmod 644 {} \;
find "${APP_DIR}" -type d -exec chmod 755 {} \;
chmod -R 775 "${APP_DIR}/storage"
chmod -R 775 "${APP_DIR}/bootstrap/cache"
log "Permissions set"

# ─── 8. Environment Configuration ───────────────────────────────────────────
info "Configuring environment..."
if [ ! -f .env ]; then
    cp .env.example .env
fi

# Update .env values
sed -i "s|APP_URL=.*|APP_URL=https://${DOMAIN}|" .env
sed -i "s|APP_ENV=.*|APP_ENV=production|" .env
sed -i "s|APP_DEBUG=.*|APP_DEBUG=false|" .env
sed -i "s|DB_DATABASE=.*|DB_DATABASE=${DB_NAME}|" .env
sed -i "s|DB_USERNAME=.*|DB_USERNAME=${DB_USER}|" .env
sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=${DB_PASS}|" .env
log "Environment configured"

# ─── 9. Composer Install ────────────────────────────────────────────────────
info "Installing PHP dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction 2>&1 | tail -3
log "Composer dependencies installed"

# ─── 10. Application Key ────────────────────────────────────────────────────
info "Generating application key..."
php artisan key:generate --force --no-interaction
log "App key generated"

# ─── 11. Build Frontend Assets ──────────────────────────────────────────────
info "Building frontend assets (React + Vite)..."
npm ci --silent 2>&1 | tail -3
npm run build 2>&1 | tail -5
log "Frontend assets built"

# ─── 12. Database Migration & Seeding ───────────────────────────────────────
info "Running database migrations..."
php artisan migrate --force --no-interaction
log "Migrations complete"

info "Seeding database..."
php artisan db:seed --force --no-interaction 2>/dev/null || warn "Seeder skipped (may already be seeded)"
log "Database ready"

# ─── 13. Laravel Optimization ───────────────────────────────────────────────
info "Optimizing Laravel..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link 2>/dev/null || true
log "Laravel optimized"

# ─── 14. Nginx Configuration ────────────────────────────────────────────────
info "Configuring Nginx..."

# First, set up HTTP-only config for Certbot
cat > /etc/nginx/sites-available/${DOMAIN} << 'NGINX_TEMP'
server {
    listen 80;
    server_name masterkuttu.space www.masterkuttu.space;
    root /var/www/green-land-laundry/public;
    index index.php index.html;

    client_max_body_size 20M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
NGINX_TEMP

ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/${DOMAIN}
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl restart nginx
log "Nginx configured"

# ─── 15. SSL Certificate (Let's Encrypt) ────────────────────────────────────
info "Obtaining SSL certificate..."
certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} \
    --non-interactive --agree-tos \
    --email admin@${DOMAIN} \
    --redirect 2>&1 | tail -5 || warn "Certbot failed — SSL can be configured later with: certbot --nginx -d ${DOMAIN}"

# Ensure auto-renewal
systemctl enable certbot.timer 2>/dev/null || true
log "SSL configured"

# ─── 16. PHP-FPM Tuning ─────────────────────────────────────────────────────
info "Tuning PHP-FPM..."
PHP_FPM_CONF="/etc/php/${PHP_VERSION}/fpm/pool.d/www.conf"
sed -i "s/^pm\.max_children.*/pm.max_children = 20/" ${PHP_FPM_CONF}
sed -i "s/^pm\.start_servers.*/pm.start_servers = 5/" ${PHP_FPM_CONF}
sed -i "s/^pm\.min_spare_servers.*/pm.min_spare_servers = 3/" ${PHP_FPM_CONF}
sed -i "s/^pm\.max_spare_servers.*/pm.max_spare_servers = 10/" ${PHP_FPM_CONF}

# Increase upload/memory limits
PHP_INI="/etc/php/${PHP_VERSION}/fpm/php.ini"
sed -i "s/upload_max_filesize.*/upload_max_filesize = 20M/" ${PHP_INI}
sed -i "s/post_max_size.*/post_max_size = 25M/" ${PHP_INI}
sed -i "s/memory_limit.*/memory_limit = 256M/" ${PHP_INI}

systemctl restart php${PHP_VERSION}-fpm
log "PHP-FPM tuned"

# ─── 17. Setup Cron for Laravel Scheduler ────────────────────────────────────
info "Setting up Laravel scheduler cron..."
CRON_LINE="* * * * * cd ${APP_DIR} && php artisan schedule:run >> /dev/null 2>&1"
(crontab -l 2>/dev/null | grep -v "schedule:run" ; echo "${CRON_LINE}") | crontab -
log "Cron scheduler ready"

# ─── 18. Setup Laravel Queue Worker (Supervisor) ────────────────────────────
info "Configuring queue worker..."
cat > /etc/supervisor/conf.d/greenland-worker.conf << SUPERVISOR
[program:greenland-worker]
process_name=%(program_name)s_%(process_num)02d
command=php ${APP_DIR}/artisan queue:work database --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=${APP_DIR}/storage/logs/worker.log
stopwaitsecs=3600
SUPERVISOR

supervisorctl reread
supervisorctl update
supervisorctl start greenland-worker:*
log "Queue worker running"

# ─── 19. Final Restart ──────────────────────────────────────────────────────
info "Restarting services..."
systemctl restart php${PHP_VERSION}-fpm
systemctl restart nginx
log "All services restarted"

# ─── 20. Final Permissions (again after all operations) ─────────────────────
chown -R www-data:www-data "${APP_DIR}/storage"
chown -R www-data:www-data "${APP_DIR}/bootstrap/cache"

# ─── Summary ────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              DEPLOYMENT COMPLETE!                       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${CYAN}Website:${NC}     https://${DOMAIN}"
echo -e "  ${CYAN}Admin:${NC}       https://${DOMAIN}/admin/dashboard"
echo -e "  ${CYAN}Staff:${NC}       https://${DOMAIN}/staff/dashboard"
echo -e "  ${CYAN}Developer:${NC}   https://${DOMAIN}/developer/dashboard"
echo -e "  ${CYAN}Machines:${NC}    https://${DOMAIN}/admin/machines"
echo ""
echo -e "  ${CYAN}App Path:${NC}    ${APP_DIR}"
echo -e "  ${CYAN}DB Name:${NC}     ${DB_NAME}"
echo -e "  ${CYAN}DB User:${NC}     ${DB_USER}"
echo -e "  ${CYAN}DB Password:${NC} ${DB_PASS}"
echo ""
echo -e "  ${YELLOW}IMPORTANT: Save the database password above!${NC}"
echo -e "  ${YELLOW}Edit ${APP_DIR}/.env to add Twilio & OpenAI keys.${NC}"
echo ""
log "Green Land Laundry is live at https://${DOMAIN}"
