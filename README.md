# Green Land Laundry Management System v3

Full-stack Laravel 10 + React 18 laundry management system for **Green Land Laundry, Bahrain**.

## Features

- **Staff Portal** — Order intake, status updates, QR scanning
- **Admin Panel** — Full order/customer/invoice management, reports
- **Developer Portal** — System health, logs, AI image generation, API keys
- **BHD Pricing** — Bahraini Dinar with 3 decimal places
- **10% VAT** — Automatic VAT calculation on all invoices (Bahrain Law No. 48 of 2018)
- **WhatsApp Automation** — Order confirmations & status updates via Twilio
- **AI Image Generation** — DALL-E 3 product images for services
- **PDF Invoices** — Tax invoices with Arabic/English support
- **Hostinger Ready** — Optimized for shared hosting deployment

## Tech Stack

| Layer    | Technology              |
|----------|------------------------|
| Backend  | Laravel 10 (PHP 8.1+)  |
| Frontend | React 18 + Vite        |
| Styling  | Tailwind CSS 3         |
| Auth     | Laravel Sanctum        |
| Roles    | Spatie Permission      |
| PDF      | DomPDF                 |
| WhatsApp | Twilio SDK             |
| AI       | OpenAI DALL-E 3        |
| Charts   | Recharts               |

## Quick Start

```bash
# Install dependencies
composer install
npm install

# Configure environment
cp .env.example .env
php artisan key:generate

# Setup database
php artisan migrate --seed

# Build assets
npm run build
```

## Default Credentials

| Role       | Email                          | Password        |
|------------|-------------------------------|-----------------|
| Super Admin | admin@greenlandlaundry.com   | GreenLand@2024! |
| Admin       | manager@greenlandlaundry.com | Manager@2024!   |
| Staff       | staff@greenlandlaundry.com   | Staff@2024!     |
| Developer   | dev@greenlandlaundry.com     | Dev@2024!       |

## Portals

- **Admin**: `/admin/dashboard`
- **Staff**: `/staff/dashboard`
- **Developer**: `/developer/dashboard`

## Hostinger Deployment

1. Upload files via FTP/Git
2. Set document root to `/public`
3. Copy `.env.example` to `.env` and configure
4. Run `php artisan migrate --seed` via SSH
5. Run `npm run build` and upload `/public/build`

## VAT Configuration

VAT rate is configured in `.env`:
```
VAT_RATE=0.10
CURRENCY=BHD
```

---

**Green Land Laundry** — Manama, Kingdom of Bahrain
غرين لاند للغسيل — المنامة، مملكة البحرين
