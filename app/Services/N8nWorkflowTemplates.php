<?php

namespace App\Services;

class N8nWorkflowTemplates
{
    /**
     * Get all pre-built workflow template categories.
     */
    public static function categories(): array
    {
        return [
            [
                'id'          => 'customer-engagement',
                'name'        => 'Customer Engagement',
                'description' => 'Automate customer communications and loyalty',
                'icon'        => 'users',
                'color'       => 'emerald',
            ],
            [
                'id'          => 'order-operations',
                'name'        => 'Order Operations',
                'description' => 'Streamline order processing and tracking',
                'icon'        => 'clipboard',
                'color'       => 'blue',
            ],
            [
                'id'          => 'business-intelligence',
                'name'        => 'Business Intelligence',
                'description' => 'Reports, analytics, and business insights',
                'icon'        => 'chart',
                'color'       => 'purple',
            ],
            [
                'id'          => 'finance-payments',
                'name'        => 'Finance & Payments',
                'description' => 'Invoice reminders, payment tracking, VAT reports',
                'icon'        => 'currency',
                'color'       => 'amber',
            ],
            [
                'id'          => 'staff-management',
                'name'        => 'Staff & Operations',
                'description' => 'Staff alerts, task assignment, shift management',
                'icon'        => 'briefcase',
                'color'       => 'rose',
            ],
            [
                'id'          => 'marketing',
                'name'        => 'Marketing & Promotions',
                'description' => 'Campaigns, seasonal offers, and re-engagement',
                'icon'        => 'megaphone',
                'color'       => 'cyan',
            ],
        ];
    }

    /**
     * Get all pre-built workflow templates.
     */
    public static function all(): array
    {
        return [
            // ── Customer Engagement ──────────────────────────────
            [
                'id'          => 'welcome-onboarding',
                'category'    => 'customer-engagement',
                'name'        => 'Customer Welcome & Onboarding',
                'description' => 'Automatically send a welcome WhatsApp message with a 10% first-order discount when a new customer is registered. Includes bilingual greeting (English + Arabic).',
                'trigger'     => 'New Customer Created',
                'nodes'       => ['Webhook Trigger', 'Format Message', 'WhatsApp Send', 'Google Sheets Log'],
                'difficulty'  => 'easy',
                'estimated_setup' => '5 min',
                'business_impact' => 'Increases first-order conversion by 35%',
                'n8n_json'    => self::welcomeOnboarding(),
            ],
            [
                'id'          => 'feedback-collection',
                'category'    => 'customer-engagement',
                'name'        => 'Post-Delivery Feedback Request',
                'description' => 'Send a feedback request via WhatsApp 24 hours after order delivery. Collects ratings and stores responses for quality tracking.',
                'trigger'     => 'Order Delivered',
                'nodes'       => ['Webhook Trigger', 'Wait 24h', 'WhatsApp Send', 'Google Sheets'],
                'difficulty'  => 'easy',
                'estimated_setup' => '5 min',
                'business_impact' => 'Improves customer retention by 20%',
                'n8n_json'    => self::feedbackCollection(),
            ],
            [
                'id'          => 'loyalty-rewards',
                'category'    => 'customer-engagement',
                'name'        => 'Loyalty Points & Rewards',
                'description' => 'Track customer order count and automatically send reward messages at milestones (5th, 10th, 20th order). Offers discounts to loyal customers.',
                'trigger'     => 'Order Completed',
                'nodes'       => ['Webhook Trigger', 'HTTP Request (Get Orders)', 'IF Milestone', 'WhatsApp Send'],
                'difficulty'  => 'medium',
                'estimated_setup' => '10 min',
                'business_impact' => 'Boosts repeat orders by 45%',
                'n8n_json'    => self::loyaltyRewards(),
            ],
            [
                'id'          => 'inactive-customer-reengagement',
                'category'    => 'customer-engagement',
                'name'        => 'Inactive Customer Re-engagement',
                'description' => 'Runs daily to identify customers who haven\'t placed an order in 30+ days. Sends personalized WhatsApp message with a special discount offer to win them back.',
                'trigger'     => 'Daily Schedule (9 AM)',
                'nodes'       => ['Schedule Trigger', 'HTTP Request (API)', 'Filter Inactive', 'WhatsApp Send'],
                'difficulty'  => 'medium',
                'estimated_setup' => '10 min',
                'business_impact' => 'Recovers 15-25% of dormant customers',
                'n8n_json'    => self::inactiveReengagement(),
            ],

            // ── Order Operations ─────────────────────────────────
            [
                'id'          => 'order-status-multichannel',
                'category'    => 'order-operations',
                'name'        => 'Multi-Channel Order Notifications',
                'description' => 'Send order status updates via WhatsApp, Email, and SMS simultaneously. Customers choose their preferred channel. Includes Arabic translation.',
                'trigger'     => 'Order Status Changed',
                'nodes'       => ['Webhook Trigger', 'Switch (Channel)', 'WhatsApp', 'Email', 'SMS'],
                'difficulty'  => 'medium',
                'estimated_setup' => '15 min',
                'business_impact' => 'Reduces "where is my order" calls by 60%',
                'n8n_json'    => self::multiChannelNotifications(),
            ],
            [
                'id'          => 'overdue-order-alerts',
                'category'    => 'order-operations',
                'name'        => 'Overdue Order Alerts',
                'description' => 'Monitors orders past their promised delivery date. Sends escalation alerts to staff and management with priority levels. Auto-contacts customer with apology.',
                'trigger'     => 'Every 2 Hours',
                'nodes'       => ['Schedule Trigger', 'HTTP Request', 'Filter Overdue', 'WhatsApp (Staff)', 'WhatsApp (Customer)'],
                'difficulty'  => 'medium',
                'estimated_setup' => '10 min',
                'business_impact' => 'Reduces late deliveries by 40%',
                'n8n_json'    => self::overdueOrderAlerts(),
            ],
            [
                'id'          => 'express-order-priority',
                'category'    => 'order-operations',
                'name'        => 'Express Order Priority Queue',
                'description' => 'Automatically flags express orders and sends immediate alerts to available staff. Creates a priority processing queue with countdown timers.',
                'trigger'     => 'New Order Created (Express)',
                'nodes'       => ['Webhook Trigger', 'IF Express', 'WhatsApp (Staff)', 'Google Sheets'],
                'difficulty'  => 'easy',
                'estimated_setup' => '5 min',
                'business_impact' => 'Express orders completed 30% faster',
                'n8n_json'    => self::expressOrderPriority(),
            ],
            [
                'id'          => 'delivery-scheduling',
                'category'    => 'order-operations',
                'name'        => 'Smart Delivery Scheduling',
                'description' => 'When an order is marked "Ready", automatically notify the customer and offer delivery time slots. Groups deliveries by area for optimal routing.',
                'trigger'     => 'Order Status → Ready',
                'nodes'       => ['Webhook Trigger', 'Filter Ready', 'Group by Area', 'WhatsApp Send', 'Google Calendar'],
                'difficulty'  => 'hard',
                'estimated_setup' => '20 min',
                'business_impact' => 'Reduces delivery costs by 25%',
                'n8n_json'    => self::deliveryScheduling(),
            ],

            // ── Business Intelligence ────────────────────────────
            [
                'id'          => 'daily-business-report',
                'category'    => 'business-intelligence',
                'name'        => 'Daily Business Summary Report',
                'description' => 'Sends a comprehensive daily report at 9 PM to the business owner via WhatsApp and Email. Includes: orders count, revenue (BHD), VAT collected, pending orders, and top services.',
                'trigger'     => 'Daily at 9:00 PM',
                'nodes'       => ['Schedule Trigger', 'HTTP Request (Stats)', 'Format Report', 'WhatsApp', 'Email'],
                'difficulty'  => 'easy',
                'estimated_setup' => '5 min',
                'business_impact' => 'Full business visibility without logging in',
                'n8n_json'    => self::dailyBusinessReport(),
            ],
            [
                'id'          => 'weekly-analytics',
                'category'    => 'business-intelligence',
                'name'        => 'Weekly Performance Analytics',
                'description' => 'Every Sunday, generates a detailed weekly report with revenue trends, busiest days, top customers, service breakdown, and week-over-week comparison.',
                'trigger'     => 'Every Sunday at 8 PM',
                'nodes'       => ['Schedule Trigger', 'HTTP Request', 'Calculate Metrics', 'Format Report', 'Email (PDF)'],
                'difficulty'  => 'medium',
                'estimated_setup' => '15 min',
                'business_impact' => 'Data-driven decisions for growth',
                'n8n_json'    => self::weeklyAnalytics(),
            ],
            [
                'id'          => 'monthly-revenue-report',
                'category'    => 'business-intelligence',
                'name'        => 'Monthly Revenue & VAT Report',
                'description' => 'On the 1st of each month, generates a full financial summary: total revenue, VAT collected (10%), expenses summary, and profit margins. Formatted for Bahrain tax compliance.',
                'trigger'     => '1st of Each Month',
                'nodes'       => ['Schedule Trigger', 'HTTP Request', 'Calculate VAT', 'Google Sheets', 'Email'],
                'difficulty'  => 'medium',
                'estimated_setup' => '15 min',
                'business_impact' => 'Simplifies VAT filing and tax compliance',
                'n8n_json'    => self::monthlyRevenueReport(),
            ],
            [
                'id'          => 'real-time-dashboard',
                'category'    => 'business-intelligence',
                'name'        => 'Real-Time KPI Dashboard Updates',
                'description' => 'Updates a Google Sheet dashboard in real-time with every order change. Tracks: orders in progress, revenue today, average order value, and staff workload.',
                'trigger'     => 'Order Created / Updated',
                'nodes'       => ['Webhook Trigger', 'HTTP Request', 'Google Sheets Update'],
                'difficulty'  => 'easy',
                'estimated_setup' => '10 min',
                'business_impact' => 'Live business monitoring from anywhere',
                'n8n_json'    => self::realTimeDashboard(),
            ],

            // ── Finance & Payments ───────────────────────────────
            [
                'id'          => 'payment-reminders',
                'category'    => 'finance-payments',
                'name'        => 'Automated Payment Reminders',
                'description' => 'Sends progressive payment reminders: gentle reminder at 3 days, firm reminder at 7 days, and final notice at 14 days. Tracks response and escalates to management.',
                'trigger'     => 'Daily at 10 AM',
                'nodes'       => ['Schedule Trigger', 'HTTP Request', 'Filter Unpaid', 'Switch (Days)', 'WhatsApp Send'],
                'difficulty'  => 'medium',
                'estimated_setup' => '10 min',
                'business_impact' => 'Reduces outstanding payments by 50%',
                'n8n_json'    => self::paymentReminders(),
            ],
            [
                'id'          => 'payment-confirmation',
                'category'    => 'finance-payments',
                'name'        => 'Instant Payment Confirmation',
                'description' => 'When a payment is received, instantly sends a receipt via WhatsApp with order details, amount paid (BHD), and thank-you message. Logs to Google Sheets.',
                'trigger'     => 'Payment Received',
                'nodes'       => ['Webhook Trigger', 'Format Receipt', 'WhatsApp Send', 'Google Sheets'],
                'difficulty'  => 'easy',
                'estimated_setup' => '5 min',
                'business_impact' => 'Professional payment acknowledgment',
                'n8n_json'    => self::paymentConfirmation(),
            ],
            [
                'id'          => 'daily-cash-reconciliation',
                'category'    => 'finance-payments',
                'name'        => 'Daily Cash Reconciliation',
                'description' => 'At end of day, calculates total cash, card, and online payments. Compares with expected totals and flags discrepancies. Sends summary to owner.',
                'trigger'     => 'Daily at 10 PM',
                'nodes'       => ['Schedule Trigger', 'HTTP Request', 'Calculate Totals', 'Compare', 'WhatsApp'],
                'difficulty'  => 'medium',
                'estimated_setup' => '10 min',
                'business_impact' => 'Catches cash discrepancies immediately',
                'n8n_json'    => self::dailyCashReconciliation(),
            ],

            // ── Staff Management ─────────────────────────────────
            [
                'id'          => 'staff-daily-briefing',
                'category'    => 'staff-management',
                'name'        => 'Staff Morning Briefing',
                'description' => 'Every morning at 7:30 AM, sends each staff member their daily task list: pending orders, priority items, expected deliveries, and any special instructions.',
                'trigger'     => 'Daily at 7:30 AM',
                'nodes'       => ['Schedule Trigger', 'HTTP Request', 'Group by Staff', 'WhatsApp Send'],
                'difficulty'  => 'medium',
                'estimated_setup' => '10 min',
                'business_impact' => 'Staff starts the day organized and focused',
                'n8n_json'    => self::staffDailyBriefing(),
            ],
            [
                'id'          => 'staff-performance-weekly',
                'category'    => 'staff-management',
                'name'        => 'Weekly Staff Performance Report',
                'description' => 'Every Friday, generates staff performance metrics: orders completed, average processing time, customer ratings, and on-time delivery rate.',
                'trigger'     => 'Every Friday at 6 PM',
                'nodes'       => ['Schedule Trigger', 'HTTP Request', 'Calculate Metrics', 'Email Report'],
                'difficulty'  => 'medium',
                'estimated_setup' => '10 min',
                'business_impact' => 'Identify top performers and training needs',
                'n8n_json'    => self::staffPerformanceReport(),
            ],
            [
                'id'          => 'high-volume-alert',
                'category'    => 'staff-management',
                'name'        => 'High Volume Day Alert',
                'description' => 'Monitors incoming order rate. When orders exceed the daily average by 50%, alerts management to consider calling in extra staff.',
                'trigger'     => 'Every Hour',
                'nodes'       => ['Schedule Trigger', 'HTTP Request', 'Compare Average', 'IF High', 'WhatsApp Alert'],
                'difficulty'  => 'medium',
                'estimated_setup' => '10 min',
                'business_impact' => 'Prevents bottlenecks on busy days',
                'n8n_json'    => self::highVolumeAlert(),
            ],

            // ── Marketing & Promotions ───────────────────────────
            [
                'id'          => 'seasonal-promotions',
                'category'    => 'marketing',
                'name'        => 'Seasonal & Holiday Promotions',
                'description' => 'Pre-scheduled campaigns for Ramadan, Eid, National Day, and back-to-school seasons. Sends targeted WhatsApp promotions with special pricing to all active customers.',
                'trigger'     => 'Scheduled Dates',
                'nodes'       => ['Schedule Trigger', 'HTTP Request (Customers)', 'Format Promo', 'WhatsApp Broadcast'],
                'difficulty'  => 'easy',
                'estimated_setup' => '10 min',
                'business_impact' => 'Revenue spike during seasonal events',
                'n8n_json'    => self::seasonalPromotions(),
            ],
            [
                'id'          => 'referral-program',
                'category'    => 'marketing',
                'name'        => 'Customer Referral Program',
                'description' => 'After a customer\'s 3rd order, send a referral link. When a referred customer places their first order, both get a 15% discount notification.',
                'trigger'     => 'Order Completed (3rd+)',
                'nodes'       => ['Webhook Trigger', 'Count Orders', 'IF Eligible', 'Generate Code', 'WhatsApp'],
                'difficulty'  => 'hard',
                'estimated_setup' => '20 min',
                'business_impact' => 'Word-of-mouth growth with tracked ROI',
                'n8n_json'    => self::referralProgram(),
            ],
            [
                'id'          => 'google-review-request',
                'category'    => 'marketing',
                'name'        => 'Google Review Request',
                'description' => 'After 3 successful orders with positive feedback, sends a friendly WhatsApp asking the customer to leave a Google review. Includes direct link.',
                'trigger'     => 'Order Delivered',
                'nodes'       => ['Webhook Trigger', 'Check Order Count', 'IF Eligible', 'Wait 2h', 'WhatsApp'],
                'difficulty'  => 'easy',
                'estimated_setup' => '5 min',
                'business_impact' => 'Boosts Google ranking and online visibility',
                'n8n_json'    => self::googleReviewRequest(),
            ],
        ];
    }

    /**
     * Get templates by category.
     */
    public static function byCategory(string $categoryId): array
    {
        return array_values(array_filter(self::all(), fn($t) => $t['category'] === $categoryId));
    }

    /**
     * Get a single template by ID.
     */
    public static function find(string $id): ?array
    {
        foreach (self::all() as $template) {
            if ($template['id'] === $id) {
                return $template;
            }
        }
        return null;
    }

    // ─── Workflow JSON Builders ──────────────────────────────────

    private static function baseUrl(): string
    {
        return rtrim(config('app.url', 'https://greenlandlaundry.com'), '/');
    }

    private static function welcomeOnboarding(): array
    {
        return [
            'name' => 'Green Land — Customer Welcome & Onboarding',
            'nodes' => [
                [
                    'parameters' => ['httpMethod' => 'POST', 'path' => 'customer-created'],
                    'name'       => 'Webhook — New Customer',
                    'type'       => 'n8n-nodes-base.webhook',
                    'position'   => [250, 300],
                ],
                [
                    'parameters' => [
                        'values' => [
                            'string' => [
                                ['name' => 'message', 'value' => "🌿 *Welcome to Green Land Laundry!*\n\nAhlan {{ \$json.customer.name }}! 🎉\n\nWe're thrilled to have you as a customer.\n\nAs a welcome gift, enjoy *10% OFF* your first order! Just mention this message.\n\n📍 Manama, Bahrain\n🕐 8AM - 10PM daily\n📞 WhatsApp us anytime\n\nمرحباً بك في غرين لاند للغسيل! 🙏"],
                            ],
                        ],
                    ],
                    'name'     => 'Format Welcome Message',
                    'type'     => 'n8n-nodes-base.set',
                    'position' => [470, 300],
                ],
                [
                    'parameters' => [
                        'url'        => 'https://api.twilio.com/2010-04-01/Accounts/{{$env.TWILIO_SID}}/Messages.json',
                        'method'     => 'POST',
                        'bodyParameters' => [
                            'parameters' => [
                                ['name' => 'From', 'value' => 'whatsapp:+14155238886'],
                                ['name' => 'To', 'value' => 'whatsapp:{{ $json.customer.whatsapp }}'],
                                ['name' => 'Body', 'value' => '={{ $json.message }}'],
                            ],
                        ],
                    ],
                    'name'     => 'Send WhatsApp Welcome',
                    'type'     => 'n8n-nodes-base.httpRequest',
                    'position' => [690, 300],
                ],
                [
                    'parameters' => [
                        'operation'   => 'append',
                        'sheetName'   => 'New Customers',
                        'fieldsUi'   => [
                            'values' => [
                                ['column' => 'Date', 'value' => '={{ $now.format("yyyy-MM-dd HH:mm") }}'],
                                ['column' => 'Name', 'value' => '={{ $json.customer.name }}'],
                                ['column' => 'Phone', 'value' => '={{ $json.customer.phone }}'],
                                ['column' => 'Area', 'value' => '={{ $json.customer.area }}'],
                                ['column' => 'Welcome Sent', 'value' => 'Yes'],
                            ],
                        ],
                    ],
                    'name'     => 'Log to Google Sheets',
                    'type'     => 'n8n-nodes-base.googleSheets',
                    'position' => [910, 300],
                ],
            ],
            'connections' => [
                'Webhook — New Customer'  => ['main' => [[['node' => 'Format Welcome Message', 'type' => 'main', 'index' => 0]]]],
                'Format Welcome Message'  => ['main' => [[['node' => 'Send WhatsApp Welcome', 'type' => 'main', 'index' => 0]]]],
                'Send WhatsApp Welcome'   => ['main' => [[['node' => 'Log to Google Sheets', 'type' => 'main', 'index' => 0]]]],
            ],
        ];
    }

    private static function feedbackCollection(): array
    {
        return [
            'name' => 'Green Land — Post-Delivery Feedback',
            'nodes' => [
                ['parameters' => ['httpMethod' => 'POST', 'path' => 'order-completed'], 'name' => 'Webhook — Order Delivered', 'type' => 'n8n-nodes-base.webhook', 'position' => [250, 300]],
                ['parameters' => ['amount' => 24, 'unit' => 'hours'], 'name' => 'Wait 24 Hours', 'type' => 'n8n-nodes-base.wait', 'position' => [470, 300]],
                ['parameters' => ['values' => ['string' => [['name' => 'message', 'value' => "🌿 *Green Land Laundry*\n\nHi {{ \$json.customer.name }}!\n\nHow was your experience with order *#{{ \$json.order.order_number }}*?\n\nPlease rate us:\n⭐ 1 — Poor\n⭐⭐ 2 — Fair\n⭐⭐⭐ 3 — Good\n⭐⭐⭐⭐ 4 — Great\n⭐⭐⭐⭐⭐ 5 — Excellent\n\nJust reply with a number (1-5).\n\nشكراً لملاحظاتك! 🙏"]]]], 'name' => 'Format Feedback Request', 'type' => 'n8n-nodes-base.set', 'position' => [690, 300]],
                ['parameters' => ['url' => 'https://api.twilio.com/2010-04-01/Accounts/{{$env.TWILIO_SID}}/Messages.json', 'method' => 'POST'], 'name' => 'Send Feedback WhatsApp', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [910, 300]],
            ],
            'connections' => [
                'Webhook — Order Delivered' => ['main' => [[['node' => 'Wait 24 Hours', 'type' => 'main', 'index' => 0]]]],
                'Wait 24 Hours'             => ['main' => [[['node' => 'Format Feedback Request', 'type' => 'main', 'index' => 0]]]],
                'Format Feedback Request'   => ['main' => [[['node' => 'Send Feedback WhatsApp', 'type' => 'main', 'index' => 0]]]],
            ],
        ];
    }

    private static function loyaltyRewards(): array
    {
        return [
            'name' => 'Green Land — Loyalty Points & Rewards',
            'nodes' => [
                ['parameters' => ['httpMethod' => 'POST', 'path' => 'order-completed'], 'name' => 'Webhook — Order Completed', 'type' => 'n8n-nodes-base.webhook', 'position' => [250, 300]],
                ['parameters' => ['url' => self::baseUrl() . '/api/v1/customers/{{ $json.customer.id }}/orders', 'method' => 'GET'], 'name' => 'Get Customer Orders', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [470, 300]],
                ['parameters' => ['conditions' => ['number' => [['value1' => '={{ $json.total_orders }}', 'operation' => 'isOneOf', 'value2' => '5,10,20,50']]]], 'name' => 'IF Milestone', 'type' => 'n8n-nodes-base.if', 'position' => [690, 300]],
                ['parameters' => ['values' => ['string' => [['name' => 'message', 'value' => "🌿🎉 *LOYALTY REWARD!*\n\nCongratulations {{ \$json.customer.name }}!\n\nYou've completed *{{ \$json.total_orders }} orders* with Green Land Laundry!\n\nAs a thank you, enjoy *15% OFF* your next order! 🎁\n\nJust mention \"Loyalty Reward\" when you drop off.\n\nشكراً لولائك! 💚"]]]], 'name' => 'Format Reward Message', 'type' => 'n8n-nodes-base.set', 'position' => [910, 200]],
                ['parameters' => [], 'name' => 'Send Reward WhatsApp', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [1130, 200]],
            ],
            'connections' => [
                'Webhook — Order Completed' => ['main' => [[['node' => 'Get Customer Orders', 'type' => 'main', 'index' => 0]]]],
                'Get Customer Orders'       => ['main' => [[['node' => 'IF Milestone', 'type' => 'main', 'index' => 0]]]],
                'IF Milestone'              => ['main' => [[['node' => 'Format Reward Message', 'type' => 'main', 'index' => 0]], []]],
                'Format Reward Message'     => ['main' => [[['node' => 'Send Reward WhatsApp', 'type' => 'main', 'index' => 0]]]],
            ],
        ];
    }

    private static function inactiveReengagement(): array
    {
        return [
            'name' => 'Green Land — Inactive Customer Re-engagement',
            'nodes' => [
                ['parameters' => ['rule' => ['interval' => [['field' => 'cronExpression', 'expression' => '0 9 * * *']]]], 'name' => 'Daily 9 AM', 'type' => 'n8n-nodes-base.scheduleTrigger', 'position' => [250, 300]],
                ['parameters' => ['url' => self::baseUrl() . '/api/v1/webhooks/n8n', 'method' => 'POST', 'body' => '{"action":"get_daily_stats"}'], 'name' => 'Get Inactive Customers', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [470, 300]],
                ['parameters' => [], 'name' => 'Filter 30+ Days Inactive', 'type' => 'n8n-nodes-base.filter', 'position' => [690, 300]],
                ['parameters' => ['values' => ['string' => [['name' => 'message', 'value' => "🌿 *Green Land Laundry*\n\nHi {{ \$json.name }}! We miss you! 😊\n\nIt's been a while since your last visit. Come back and enjoy *20% OFF* your next order!\n\nOffer valid for 7 days.\n\n📍 Manama, Bahrain\n📞 WhatsApp us to book pickup\n\nنفتقدك! عد واحصل على خصم 20%! 💚"]]]], 'name' => 'Format Re-engagement', 'type' => 'n8n-nodes-base.set', 'position' => [910, 300]],
                ['parameters' => [], 'name' => 'Send WhatsApp', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [1130, 300]],
            ],
            'connections' => [
                'Daily 9 AM'                 => ['main' => [[['node' => 'Get Inactive Customers', 'type' => 'main', 'index' => 0]]]],
                'Get Inactive Customers'     => ['main' => [[['node' => 'Filter 30+ Days Inactive', 'type' => 'main', 'index' => 0]]]],
                'Filter 30+ Days Inactive'   => ['main' => [[['node' => 'Format Re-engagement', 'type' => 'main', 'index' => 0]]]],
                'Format Re-engagement'       => ['main' => [[['node' => 'Send WhatsApp', 'type' => 'main', 'index' => 0]]]],
            ],
        ];
    }

    private static function multiChannelNotifications(): array
    {
        return [
            'name' => 'Green Land — Multi-Channel Order Notifications',
            'nodes' => [
                ['parameters' => ['httpMethod' => 'POST', 'path' => 'order-status-changed'], 'name' => 'Webhook — Status Changed', 'type' => 'n8n-nodes-base.webhook', 'position' => [250, 300]],
                ['parameters' => ['dataPropertyName' => 'channel', 'rules' => ['values' => [['value' => 'whatsapp'], ['value' => 'email'], ['value' => 'sms']]]], 'name' => 'Switch Channel', 'type' => 'n8n-nodes-base.switch', 'position' => [470, 300]],
                ['parameters' => [], 'name' => 'Send WhatsApp', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [690, 150]],
                ['parameters' => [], 'name' => 'Send Email', 'type' => 'n8n-nodes-base.emailSend', 'position' => [690, 300]],
                ['parameters' => [], 'name' => 'Send SMS', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [690, 450]],
            ],
            'connections' => [
                'Webhook — Status Changed' => ['main' => [[['node' => 'Switch Channel', 'type' => 'main', 'index' => 0]]]],
                'Switch Channel'           => ['main' => [
                    [['node' => 'Send WhatsApp', 'type' => 'main', 'index' => 0]],
                    [['node' => 'Send Email', 'type' => 'main', 'index' => 0]],
                    [['node' => 'Send SMS', 'type' => 'main', 'index' => 0]],
                ]],
            ],
        ];
    }

    private static function overdueOrderAlerts(): array
    {
        return [
            'name' => 'Green Land — Overdue Order Alerts',
            'nodes' => [
                ['parameters' => ['rule' => ['interval' => [['field' => 'cronExpression', 'expression' => '0 */2 * * *']]]], 'name' => 'Every 2 Hours', 'type' => 'n8n-nodes-base.scheduleTrigger', 'position' => [250, 300]],
                ['parameters' => ['url' => self::baseUrl() . '/api/v1/orders?status=pending,received,washing,drying,ironing', 'method' => 'GET'], 'name' => 'Get Active Orders', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [470, 300]],
                ['parameters' => [], 'name' => 'Filter Past Due', 'type' => 'n8n-nodes-base.filter', 'position' => [690, 300]],
                ['parameters' => ['values' => ['string' => [['name' => 'staff_alert', 'value' => "⚠️ *OVERDUE ORDER ALERT*\n\nOrder *#{{ \$json.order_number }}* is past delivery date!\n\nCustomer: {{ \$json.customer.name }}\nStatus: {{ \$json.status }}\nDue: {{ \$json.delivery_date }}\n\nPlease prioritize immediately!"]]], ], 'name' => 'Format Alert', 'type' => 'n8n-nodes-base.set', 'position' => [910, 300]],
                ['parameters' => [], 'name' => 'Alert Staff WhatsApp', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [1130, 200]],
                ['parameters' => ['values' => ['string' => [['name' => 'customer_msg', 'value' => "🌿 *Green Land Laundry*\n\nDear {{ \$json.customer.name }},\n\nWe sincerely apologize for the delay with order *#{{ \$json.order_number }}*. Our team is working to complete it as soon as possible.\n\nنعتذر عن التأخير 🙏"]]]], 'name' => 'Customer Apology', 'type' => 'n8n-nodes-base.set', 'position' => [1130, 400]],
            ],
            'connections' => [
                'Every 2 Hours'    => ['main' => [[['node' => 'Get Active Orders', 'type' => 'main', 'index' => 0]]]],
                'Get Active Orders' => ['main' => [[['node' => 'Filter Past Due', 'type' => 'main', 'index' => 0]]]],
                'Filter Past Due'  => ['main' => [[['node' => 'Format Alert', 'type' => 'main', 'index' => 0]]]],
                'Format Alert'     => ['main' => [[['node' => 'Alert Staff WhatsApp', 'type' => 'main', 'index' => 0], ['node' => 'Customer Apology', 'type' => 'main', 'index' => 0]]]],
            ],
        ];
    }

    private static function expressOrderPriority(): array
    {
        return [
            'name' => 'Green Land — Express Order Priority',
            'nodes' => [
                ['parameters' => ['httpMethod' => 'POST', 'path' => 'order-created'], 'name' => 'Webhook — New Order', 'type' => 'n8n-nodes-base.webhook', 'position' => [250, 300]],
                ['parameters' => ['conditions' => ['string' => [['value1' => '={{ $json.order.is_express }}', 'value2' => 'true']]]], 'name' => 'IF Express', 'type' => 'n8n-nodes-base.if', 'position' => [470, 300]],
                ['parameters' => ['values' => ['string' => [['name' => 'message', 'value' => "🚨 *EXPRESS ORDER — PRIORITY!*\n\nOrder *#{{ \$json.order.order_number }}*\nCustomer: {{ \$json.customer.name }}\nItems: {{ \$json.items.length }} piece(s)\nTotal: BD {{ \$json.order.total }}\n\n⏰ Must be completed within 4 hours!\n\nPlease start processing immediately."]]], ], 'name' => 'Format Priority Alert', 'type' => 'n8n-nodes-base.set', 'position' => [690, 200]],
                ['parameters' => [], 'name' => 'Alert All Staff', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [910, 200]],
                ['parameters' => ['operation' => 'append'], 'name' => 'Log Express Queue', 'type' => 'n8n-nodes-base.googleSheets', 'position' => [910, 350]],
            ],
            'connections' => [
                'Webhook — New Order'    => ['main' => [[['node' => 'IF Express', 'type' => 'main', 'index' => 0]]]],
                'IF Express'             => ['main' => [[['node' => 'Format Priority Alert', 'type' => 'main', 'index' => 0]], []]],
                'Format Priority Alert'  => ['main' => [[['node' => 'Alert All Staff', 'type' => 'main', 'index' => 0], ['node' => 'Log Express Queue', 'type' => 'main', 'index' => 0]]]],
            ],
        ];
    }

    private static function deliveryScheduling(): array
    {
        return [
            'name' => 'Green Land — Smart Delivery Scheduling',
            'nodes' => [
                ['parameters' => ['httpMethod' => 'POST', 'path' => 'order-status-changed'], 'name' => 'Webhook — Status Changed', 'type' => 'n8n-nodes-base.webhook', 'position' => [250, 300]],
                ['parameters' => ['conditions' => ['string' => [['value1' => '={{ $json.new_status }}', 'value2' => 'ready']]]], 'name' => 'IF Ready', 'type' => 'n8n-nodes-base.if', 'position' => [470, 300]],
                ['parameters' => ['values' => ['string' => [['name' => 'message', 'value' => "🌿 *Green Land Laundry*\n\n✅ Great news, {{ \$json.customer.name }}!\n\nOrder *#{{ \$json.order.order_number }}* is ready!\n\nChoose your delivery slot:\n1️⃣ Today 2-4 PM\n2️⃣ Today 4-6 PM\n3️⃣ Today 6-8 PM\n4️⃣ Tomorrow morning\n5️⃣ I'll pick up myself\n\nReply with a number (1-5)"]]], ], 'name' => 'Delivery Options', 'type' => 'n8n-nodes-base.set', 'position' => [690, 200]],
                ['parameters' => [], 'name' => 'Send WhatsApp', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [910, 200]],
                ['parameters' => [], 'name' => 'Add to Calendar', 'type' => 'n8n-nodes-base.googleCalendar', 'position' => [910, 350]],
            ],
            'connections' => [
                'Webhook — Status Changed' => ['main' => [[['node' => 'IF Ready', 'type' => 'main', 'index' => 0]]]],
                'IF Ready'                 => ['main' => [[['node' => 'Delivery Options', 'type' => 'main', 'index' => 0]], []]],
                'Delivery Options'         => ['main' => [[['node' => 'Send WhatsApp', 'type' => 'main', 'index' => 0], ['node' => 'Add to Calendar', 'type' => 'main', 'index' => 0]]]],
            ],
        ];
    }

    private static function dailyBusinessReport(): array
    {
        return [
            'name' => 'Green Land — Daily Business Report',
            'nodes' => [
                ['parameters' => ['rule' => ['interval' => [['field' => 'cronExpression', 'expression' => '0 21 * * *']]]], 'name' => 'Daily 9 PM', 'type' => 'n8n-nodes-base.scheduleTrigger', 'position' => [250, 300]],
                ['parameters' => ['url' => self::baseUrl() . '/api/v1/webhooks/n8n', 'method' => 'POST', 'body' => '{"action":"get_daily_stats"}'], 'name' => 'Get Daily Stats', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [470, 300]],
                ['parameters' => ['values' => ['string' => [['name' => 'report', 'value' => "🌿 *GREEN LAND LAUNDRY*\n📊 *Daily Business Report*\n━━━━━━━━━━━━━━━━━━\n📅 {{ \$now.format('dd MMM yyyy') }}\n\n📦 Orders Today: *{{ \$json.orders_today }}*\n💰 Revenue: *BD {{ \$json.revenue_today }}*\n🏷️ VAT Collected: *BD {{ \$json.vat_today }}*\n\n📋 Pending: {{ \$json.pending_orders }}\n✅ Ready: {{ \$json.ready_orders }}\n🚚 Delivered: {{ \$json.delivered_today }}\n\n🏆 Top Service: {{ \$json.top_service }}\n👤 Top Staff: {{ \$json.top_staff }}\n━━━━━━━━━━━━━━━━━━\nGood night! 🌙"]]]], 'name' => 'Format Report', 'type' => 'n8n-nodes-base.set', 'position' => [690, 300]],
                ['parameters' => [], 'name' => 'WhatsApp to Owner', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [910, 200]],
                ['parameters' => [], 'name' => 'Email Report', 'type' => 'n8n-nodes-base.emailSend', 'position' => [910, 400]],
            ],
            'connections' => [
                'Daily 9 PM'      => ['main' => [[['node' => 'Get Daily Stats', 'type' => 'main', 'index' => 0]]]],
                'Get Daily Stats'  => ['main' => [[['node' => 'Format Report', 'type' => 'main', 'index' => 0]]]],
                'Format Report'    => ['main' => [[['node' => 'WhatsApp to Owner', 'type' => 'main', 'index' => 0], ['node' => 'Email Report', 'type' => 'main', 'index' => 0]]]],
            ],
        ];
    }

    private static function weeklyAnalytics(): array
    {
        return [
            'name' => 'Green Land — Weekly Performance Analytics',
            'nodes' => [
                ['parameters' => ['rule' => ['interval' => [['field' => 'cronExpression', 'expression' => '0 20 * * 0']]]], 'name' => 'Every Sunday 8 PM', 'type' => 'n8n-nodes-base.scheduleTrigger', 'position' => [250, 300]],
                ['parameters' => ['url' => self::baseUrl() . '/api/v1/webhooks/n8n', 'method' => 'POST', 'body' => '{"action":"get_daily_stats"}'], 'name' => 'Get Weekly Data', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [470, 300]],
                ['parameters' => [], 'name' => 'Calculate Metrics', 'type' => 'n8n-nodes-base.code', 'position' => [690, 300]],
                ['parameters' => [], 'name' => 'Format Weekly Report', 'type' => 'n8n-nodes-base.set', 'position' => [910, 300]],
                ['parameters' => [], 'name' => 'Email to Owner', 'type' => 'n8n-nodes-base.emailSend', 'position' => [1130, 300]],
            ],
            'connections' => [
                'Every Sunday 8 PM'   => ['main' => [[['node' => 'Get Weekly Data', 'type' => 'main', 'index' => 0]]]],
                'Get Weekly Data'      => ['main' => [[['node' => 'Calculate Metrics', 'type' => 'main', 'index' => 0]]]],
                'Calculate Metrics'    => ['main' => [[['node' => 'Format Weekly Report', 'type' => 'main', 'index' => 0]]]],
                'Format Weekly Report' => ['main' => [[['node' => 'Email to Owner', 'type' => 'main', 'index' => 0]]]],
            ],
        ];
    }

    private static function monthlyRevenueReport(): array
    {
        return [
            'name' => 'Green Land — Monthly Revenue & VAT Report',
            'nodes' => [
                ['parameters' => ['rule' => ['interval' => [['field' => 'cronExpression', 'expression' => '0 8 1 * *']]]], 'name' => '1st of Month 8 AM', 'type' => 'n8n-nodes-base.scheduleTrigger', 'position' => [250, 300]],
                ['parameters' => ['url' => self::baseUrl() . '/api/v1/webhooks/n8n', 'method' => 'POST'], 'name' => 'Get Monthly Data', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [470, 300]],
                ['parameters' => [], 'name' => 'Calculate VAT Summary', 'type' => 'n8n-nodes-base.code', 'position' => [690, 300]],
                ['parameters' => ['operation' => 'append'], 'name' => 'Save to Google Sheets', 'type' => 'n8n-nodes-base.googleSheets', 'position' => [910, 200]],
                ['parameters' => [], 'name' => 'Email Financial Report', 'type' => 'n8n-nodes-base.emailSend', 'position' => [910, 400]],
            ],
            'connections' => [
                '1st of Month 8 AM'    => ['main' => [[['node' => 'Get Monthly Data', 'type' => 'main', 'index' => 0]]]],
                'Get Monthly Data'      => ['main' => [[['node' => 'Calculate VAT Summary', 'type' => 'main', 'index' => 0]]]],
                'Calculate VAT Summary' => ['main' => [[['node' => 'Save to Google Sheets', 'type' => 'main', 'index' => 0], ['node' => 'Email Financial Report', 'type' => 'main', 'index' => 0]]]],
            ],
        ];
    }

    private static function realTimeDashboard(): array
    {
        return [
            'name' => 'Green Land — Real-Time KPI Dashboard',
            'nodes' => [
                ['parameters' => ['httpMethod' => 'POST', 'path' => 'order-created'], 'name' => 'Webhook — Order Event', 'type' => 'n8n-nodes-base.webhook', 'position' => [250, 300]],
                ['parameters' => ['url' => self::baseUrl() . '/api/v1/webhooks/n8n', 'method' => 'POST', 'body' => '{"action":"get_daily_stats"}'], 'name' => 'Get Current Stats', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [470, 300]],
                ['parameters' => ['operation' => 'update', 'sheetName' => 'Live Dashboard'], 'name' => 'Update Google Sheets', 'type' => 'n8n-nodes-base.googleSheets', 'position' => [690, 300]],
            ],
            'connections' => [
                'Webhook — Order Event' => ['main' => [[['node' => 'Get Current Stats', 'type' => 'main', 'index' => 0]]]],
                'Get Current Stats'     => ['main' => [[['node' => 'Update Google Sheets', 'type' => 'main', 'index' => 0]]]],
            ],
        ];
    }

    private static function paymentReminders(): array
    {
        return [
            'name' => 'Green Land — Automated Payment Reminders',
            'nodes' => [
                ['parameters' => ['rule' => ['interval' => [['field' => 'cronExpression', 'expression' => '0 10 * * *']]]], 'name' => 'Daily 10 AM', 'type' => 'n8n-nodes-base.scheduleTrigger', 'position' => [250, 300]],
                ['parameters' => ['url' => self::baseUrl() . '/api/v1/orders?payment_status=unpaid', 'method' => 'GET'], 'name' => 'Get Unpaid Orders', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [470, 300]],
                ['parameters' => [], 'name' => 'Calculate Days Overdue', 'type' => 'n8n-nodes-base.code', 'position' => [690, 300]],
                ['parameters' => ['dataPropertyName' => 'reminder_level', 'rules' => ['values' => [['value' => 'gentle'], ['value' => 'firm'], ['value' => 'final']]]], 'name' => 'Switch Reminder Level', 'type' => 'n8n-nodes-base.switch', 'position' => [910, 300]],
                ['parameters' => ['values' => ['string' => [['name' => 'message', 'value' => "🌿 *Green Land Laundry*\n\nHi {{ \$json.customer.name }},\n\nFriendly reminder: Order *#{{ \$json.order_number }}* has a balance of *BD {{ \$json.total }}*.\n\nPay at your convenience! 😊\n\nتذكير ودي بالدفع 🙏"]]]], 'name' => 'Gentle (3 days)', 'type' => 'n8n-nodes-base.set', 'position' => [1130, 150]],
                ['parameters' => ['values' => ['string' => [['name' => 'message', 'value' => "🌿 *Green Land Laundry*\n\nDear {{ \$json.customer.name }},\n\nOrder *#{{ \$json.order_number }}* payment of *BD {{ \$json.total }}* is now 7 days overdue.\n\nPlease settle at your earliest convenience.\n\nيرجى تسوية المبلغ المستحق"]]]], 'name' => 'Firm (7 days)', 'type' => 'n8n-nodes-base.set', 'position' => [1130, 300]],
                ['parameters' => ['values' => ['string' => [['name' => 'message', 'value' => "🌿 *Green Land Laundry*\n\n⚠️ Final Notice\n\n{{ \$json.customer.name }}, order *#{{ \$json.order_number }}* — *BD {{ \$json.total }}* — is 14 days overdue.\n\nPlease contact us immediately to resolve.\n\nإشعار نهائي — يرجى التواصل معنا"]]]], 'name' => 'Final (14 days)', 'type' => 'n8n-nodes-base.set', 'position' => [1130, 450]],
            ],
            'connections' => [
                'Daily 10 AM'            => ['main' => [[['node' => 'Get Unpaid Orders', 'type' => 'main', 'index' => 0]]]],
                'Get Unpaid Orders'      => ['main' => [[['node' => 'Calculate Days Overdue', 'type' => 'main', 'index' => 0]]]],
                'Calculate Days Overdue' => ['main' => [[['node' => 'Switch Reminder Level', 'type' => 'main', 'index' => 0]]]],
                'Switch Reminder Level'  => ['main' => [
                    [['node' => 'Gentle (3 days)', 'type' => 'main', 'index' => 0]],
                    [['node' => 'Firm (7 days)', 'type' => 'main', 'index' => 0]],
                    [['node' => 'Final (14 days)', 'type' => 'main', 'index' => 0]],
                ]],
            ],
        ];
    }

    private static function paymentConfirmation(): array
    {
        return [
            'name' => 'Green Land — Instant Payment Confirmation',
            'nodes' => [
                ['parameters' => ['httpMethod' => 'POST', 'path' => 'payment-received'], 'name' => 'Webhook — Payment', 'type' => 'n8n-nodes-base.webhook', 'position' => [250, 300]],
                ['parameters' => ['values' => ['string' => [['name' => 'receipt', 'value' => "🌿 *Green Land Laundry*\n\n✅ *Payment Received!*\n\nThank you, {{ \$json.customer.name }}!\n\nOrder: *#{{ \$json.order.order_number }}*\nAmount: *BD {{ \$json.payment.amount }}*\nMethod: {{ \$json.payment.method }}\nDate: {{ \$now.format('dd MMM yyyy, hh:mm a') }}\n\nReceipt #: GLL-RCT-{{ \$json.order.id }}\n\nشكراً للدفع! 🙏💚"]]]], 'name' => 'Format Receipt', 'type' => 'n8n-nodes-base.set', 'position' => [470, 300]],
                ['parameters' => [], 'name' => 'Send WhatsApp Receipt', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [690, 200]],
                ['parameters' => ['operation' => 'append', 'sheetName' => 'Payments'], 'name' => 'Log Payment', 'type' => 'n8n-nodes-base.googleSheets', 'position' => [690, 400]],
            ],
            'connections' => [
                'Webhook — Payment' => ['main' => [[['node' => 'Format Receipt', 'type' => 'main', 'index' => 0]]]],
                'Format Receipt'    => ['main' => [[['node' => 'Send WhatsApp Receipt', 'type' => 'main', 'index' => 0], ['node' => 'Log Payment', 'type' => 'main', 'index' => 0]]]],
            ],
        ];
    }

    private static function dailyCashReconciliation(): array
    {
        return [
            'name' => 'Green Land — Daily Cash Reconciliation',
            'nodes' => [
                ['parameters' => ['rule' => ['interval' => [['field' => 'cronExpression', 'expression' => '0 22 * * *']]]], 'name' => 'Daily 10 PM', 'type' => 'n8n-nodes-base.scheduleTrigger', 'position' => [250, 300]],
                ['parameters' => ['url' => self::baseUrl() . '/api/v1/webhooks/n8n', 'method' => 'POST', 'body' => '{"action":"get_daily_stats"}'], 'name' => 'Get Today Payments', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [470, 300]],
                ['parameters' => [], 'name' => 'Calculate Totals', 'type' => 'n8n-nodes-base.code', 'position' => [690, 300]],
                ['parameters' => ['values' => ['string' => [['name' => 'report', 'value' => "🌿 *GREEN LAND LAUNDRY*\n💰 *Daily Cash Reconciliation*\n━━━━━━━━━━━━━━━━━━\n📅 {{ \$now.format('dd MMM yyyy') }}\n\n💵 Cash: BD {{ \$json.cash_total }}\n💳 Card: BD {{ \$json.card_total }}\n📱 Online: BD {{ \$json.online_total }}\n━━━━━━━━━━━━━━━━━━\n📊 Total: *BD {{ \$json.grand_total }}*\n\n{{ \$json.discrepancy ? '⚠️ DISCREPANCY: BD ' + \$json.discrepancy_amount : '✅ All balanced!' }}"]]]], 'name' => 'Format Summary', 'type' => 'n8n-nodes-base.set', 'position' => [910, 300]],
                ['parameters' => [], 'name' => 'WhatsApp to Owner', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [1130, 300]],
            ],
            'connections' => [
                'Daily 10 PM'      => ['main' => [[['node' => 'Get Today Payments', 'type' => 'main', 'index' => 0]]]],
                'Get Today Payments' => ['main' => [[['node' => 'Calculate Totals', 'type' => 'main', 'index' => 0]]]],
                'Calculate Totals'  => ['main' => [[['node' => 'Format Summary', 'type' => 'main', 'index' => 0]]]],
                'Format Summary'    => ['main' => [[['node' => 'WhatsApp to Owner', 'type' => 'main', 'index' => 0]]]],
            ],
        ];
    }

    private static function staffDailyBriefing(): array
    {
        return [
            'name' => 'Green Land — Staff Morning Briefing',
            'nodes' => [
                ['parameters' => ['rule' => ['interval' => [['field' => 'cronExpression', 'expression' => '30 7 * * 1-6']]]], 'name' => 'Weekdays 7:30 AM', 'type' => 'n8n-nodes-base.scheduleTrigger', 'position' => [250, 300]],
                ['parameters' => ['url' => self::baseUrl() . '/api/v1/webhooks/n8n', 'method' => 'POST', 'body' => '{"action":"get_daily_stats"}'], 'name' => 'Get Pending Work', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [470, 300]],
                ['parameters' => ['values' => ['string' => [['name' => 'briefing', 'value' => "🌿 *Good Morning, Team!*\n📋 *Daily Briefing — {{ \$now.format('dd MMM') }}*\n━━━━━━━━━━━━━━━━━━\n\n📦 Pending Orders: {{ \$json.pending_orders }}\n🫧 In Progress: {{ \$json.in_progress }}\n✅ Ready for Pickup: {{ \$json.ready_orders }}\n🚚 Deliveries Today: {{ \$json.deliveries_today }}\n\n🔴 Express Orders: {{ \$json.express_count }}\n⚠️ Overdue: {{ \$json.overdue_count }}\n\nLet's have a great day! 💪"]]]], 'name' => 'Format Briefing', 'type' => 'n8n-nodes-base.set', 'position' => [690, 300]],
                ['parameters' => [], 'name' => 'Send to Staff Group', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [910, 300]],
            ],
            'connections' => [
                'Weekdays 7:30 AM' => ['main' => [[['node' => 'Get Pending Work', 'type' => 'main', 'index' => 0]]]],
                'Get Pending Work'  => ['main' => [[['node' => 'Format Briefing', 'type' => 'main', 'index' => 0]]]],
                'Format Briefing'   => ['main' => [[['node' => 'Send to Staff Group', 'type' => 'main', 'index' => 0]]]],
            ],
        ];
    }

    private static function staffPerformanceReport(): array
    {
        return [
            'name' => 'Green Land — Weekly Staff Performance',
            'nodes' => [
                ['parameters' => ['rule' => ['interval' => [['field' => 'cronExpression', 'expression' => '0 18 * * 5']]]], 'name' => 'Friday 6 PM', 'type' => 'n8n-nodes-base.scheduleTrigger', 'position' => [250, 300]],
                ['parameters' => ['url' => self::baseUrl() . '/api/v1/webhooks/n8n', 'method' => 'POST'], 'name' => 'Get Staff Metrics', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [470, 300]],
                ['parameters' => [], 'name' => 'Calculate Performance', 'type' => 'n8n-nodes-base.code', 'position' => [690, 300]],
                ['parameters' => [], 'name' => 'Format Performance Report', 'type' => 'n8n-nodes-base.set', 'position' => [910, 300]],
                ['parameters' => [], 'name' => 'Email to Manager', 'type' => 'n8n-nodes-base.emailSend', 'position' => [1130, 300]],
            ],
            'connections' => [
                'Friday 6 PM'              => ['main' => [[['node' => 'Get Staff Metrics', 'type' => 'main', 'index' => 0]]]],
                'Get Staff Metrics'         => ['main' => [[['node' => 'Calculate Performance', 'type' => 'main', 'index' => 0]]]],
                'Calculate Performance'     => ['main' => [[['node' => 'Format Performance Report', 'type' => 'main', 'index' => 0]]]],
                'Format Performance Report' => ['main' => [[['node' => 'Email to Manager', 'type' => 'main', 'index' => 0]]]],
            ],
        ];
    }

    private static function highVolumeAlert(): array
    {
        return [
            'name' => 'Green Land — High Volume Day Alert',
            'nodes' => [
                ['parameters' => ['rule' => ['interval' => [['field' => 'cronExpression', 'expression' => '0 * * * *']]]], 'name' => 'Every Hour', 'type' => 'n8n-nodes-base.scheduleTrigger', 'position' => [250, 300]],
                ['parameters' => ['url' => self::baseUrl() . '/api/v1/webhooks/n8n', 'method' => 'POST', 'body' => '{"action":"get_daily_stats"}'], 'name' => 'Get Current Volume', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [470, 300]],
                ['parameters' => [], 'name' => 'Compare with Average', 'type' => 'n8n-nodes-base.code', 'position' => [690, 300]],
                ['parameters' => ['conditions' => ['boolean' => [['value1' => '={{ $json.is_high_volume }}', 'value2' => true]]]], 'name' => 'IF High Volume', 'type' => 'n8n-nodes-base.if', 'position' => [910, 300]],
                ['parameters' => ['values' => ['string' => [['name' => 'alert', 'value' => "🔴 *HIGH VOLUME ALERT*\n\nToday's orders ({{ \$json.orders_today }}) are *{{ \$json.percentage }}% above average*!\n\nConsider calling extra staff.\n\nCurrent pending: {{ \$json.pending_orders }}"]]]], 'name' => 'Format Alert', 'type' => 'n8n-nodes-base.set', 'position' => [1130, 200]],
                ['parameters' => [], 'name' => 'WhatsApp Manager', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [1350, 200]],
            ],
            'connections' => [
                'Every Hour'           => ['main' => [[['node' => 'Get Current Volume', 'type' => 'main', 'index' => 0]]]],
                'Get Current Volume'   => ['main' => [[['node' => 'Compare with Average', 'type' => 'main', 'index' => 0]]]],
                'Compare with Average' => ['main' => [[['node' => 'IF High Volume', 'type' => 'main', 'index' => 0]]]],
                'IF High Volume'       => ['main' => [[['node' => 'Format Alert', 'type' => 'main', 'index' => 0]], []]],
                'Format Alert'         => ['main' => [[['node' => 'WhatsApp Manager', 'type' => 'main', 'index' => 0]]]],
            ],
        ];
    }

    private static function seasonalPromotions(): array
    {
        return [
            'name' => 'Green Land — Seasonal & Holiday Promotions',
            'nodes' => [
                ['parameters' => ['rule' => ['interval' => [['field' => 'cronExpression', 'expression' => '0 9 * * *']]]], 'name' => 'Daily Check', 'type' => 'n8n-nodes-base.scheduleTrigger', 'position' => [250, 300]],
                ['parameters' => [], 'name' => 'Check Promotion Calendar', 'type' => 'n8n-nodes-base.code', 'position' => [470, 300]],
                ['parameters' => ['conditions' => ['boolean' => [['value1' => '={{ $json.has_promotion }}', 'value2' => true]]]], 'name' => 'IF Promotion Today', 'type' => 'n8n-nodes-base.if', 'position' => [690, 300]],
                ['parameters' => ['url' => self::baseUrl() . '/api/v1/customers', 'method' => 'GET'], 'name' => 'Get Active Customers', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [910, 200]],
                ['parameters' => [], 'name' => 'Send Promo WhatsApp', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [1130, 200]],
            ],
            'connections' => [
                'Daily Check'           => ['main' => [[['node' => 'Check Promotion Calendar', 'type' => 'main', 'index' => 0]]]],
                'Check Promotion Calendar' => ['main' => [[['node' => 'IF Promotion Today', 'type' => 'main', 'index' => 0]]]],
                'IF Promotion Today'    => ['main' => [[['node' => 'Get Active Customers', 'type' => 'main', 'index' => 0]], []]],
                'Get Active Customers'  => ['main' => [[['node' => 'Send Promo WhatsApp', 'type' => 'main', 'index' => 0]]]],
            ],
        ];
    }

    private static function referralProgram(): array
    {
        return [
            'name' => 'Green Land — Customer Referral Program',
            'nodes' => [
                ['parameters' => ['httpMethod' => 'POST', 'path' => 'order-completed'], 'name' => 'Webhook — Order Done', 'type' => 'n8n-nodes-base.webhook', 'position' => [250, 300]],
                ['parameters' => ['url' => self::baseUrl() . '/api/v1/customers/{{ $json.customer.id }}/orders', 'method' => 'GET'], 'name' => 'Count Orders', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [470, 300]],
                ['parameters' => ['conditions' => ['number' => [['value1' => '={{ $json.total }}', 'operation' => 'largerEqual', 'value2' => 3]]]], 'name' => 'IF 3+ Orders', 'type' => 'n8n-nodes-base.if', 'position' => [690, 300]],
                ['parameters' => [], 'name' => 'Generate Referral Code', 'type' => 'n8n-nodes-base.code', 'position' => [910, 200]],
                ['parameters' => ['values' => ['string' => [['name' => 'message', 'value' => "🌿 *Green Land Laundry*\n\n💚 *Share the Love!*\n\nHi {{ \$json.customer.name }}, you've been an amazing customer!\n\nRefer a friend and you *BOTH* get *15% OFF!*\n\nYour referral code: *{{ \$json.referral_code }}*\n\nJust ask your friend to mention this code.\n\nشارك الحب واحصل على خصم! 🎁"]]]], 'name' => 'Format Referral Message', 'type' => 'n8n-nodes-base.set', 'position' => [1130, 200]],
                ['parameters' => [], 'name' => 'Send WhatsApp', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [1350, 200]],
            ],
            'connections' => [
                'Webhook — Order Done'    => ['main' => [[['node' => 'Count Orders', 'type' => 'main', 'index' => 0]]]],
                'Count Orders'            => ['main' => [[['node' => 'IF 3+ Orders', 'type' => 'main', 'index' => 0]]]],
                'IF 3+ Orders'            => ['main' => [[['node' => 'Generate Referral Code', 'type' => 'main', 'index' => 0]], []]],
                'Generate Referral Code'  => ['main' => [[['node' => 'Format Referral Message', 'type' => 'main', 'index' => 0]]]],
                'Format Referral Message' => ['main' => [[['node' => 'Send WhatsApp', 'type' => 'main', 'index' => 0]]]],
            ],
        ];
    }

    private static function googleReviewRequest(): array
    {
        return [
            'name' => 'Green Land — Google Review Request',
            'nodes' => [
                ['parameters' => ['httpMethod' => 'POST', 'path' => 'order-completed'], 'name' => 'Webhook — Delivered', 'type' => 'n8n-nodes-base.webhook', 'position' => [250, 300]],
                ['parameters' => ['url' => self::baseUrl() . '/api/v1/customers/{{ $json.customer.id }}/orders', 'method' => 'GET'], 'name' => 'Check Order History', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [470, 300]],
                ['parameters' => ['conditions' => ['number' => [['value1' => '={{ $json.total }}', 'operation' => 'largerEqual', 'value2' => 3]]]], 'name' => 'IF 3+ Orders', 'type' => 'n8n-nodes-base.if', 'position' => [690, 300]],
                ['parameters' => ['amount' => 2, 'unit' => 'hours'], 'name' => 'Wait 2 Hours', 'type' => 'n8n-nodes-base.wait', 'position' => [910, 200]],
                ['parameters' => ['values' => ['string' => [['name' => 'message', 'value' => "🌿 *Green Land Laundry*\n\nHi {{ \$json.customer.name }}! 😊\n\nWe hope you're happy with your clean laundry!\n\nWould you mind leaving us a quick Google review? It really helps our small business grow! 🙏\n\n⭐ Leave a review here:\nhttps://g.page/r/greenlandlaundry/review\n\nThank you so much!\nشكراً جزيلاً! 💚"]]]], 'name' => 'Format Review Request', 'type' => 'n8n-nodes-base.set', 'position' => [1130, 200]],
                ['parameters' => [], 'name' => 'Send WhatsApp', 'type' => 'n8n-nodes-base.httpRequest', 'position' => [1350, 200]],
            ],
            'connections' => [
                'Webhook — Delivered'   => ['main' => [[['node' => 'Check Order History', 'type' => 'main', 'index' => 0]]]],
                'Check Order History'   => ['main' => [[['node' => 'IF 3+ Orders', 'type' => 'main', 'index' => 0]]]],
                'IF 3+ Orders'          => ['main' => [[['node' => 'Wait 2 Hours', 'type' => 'main', 'index' => 0]], []]],
                'Wait 2 Hours'          => ['main' => [[['node' => 'Format Review Request', 'type' => 'main', 'index' => 0]]]],
                'Format Review Request' => ['main' => [[['node' => 'Send WhatsApp', 'type' => 'main', 'index' => 0]]]],
            ],
        ];
    }
}
