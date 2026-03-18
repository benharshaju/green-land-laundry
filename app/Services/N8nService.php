<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Customer;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class N8nService
{
    private string $webhookUrl;
    private string $apiKey;
    private int $timeout;

    public function __construct()
    {
        $this->webhookUrl = rtrim(config('n8n.webhook_url'), '/');
        $this->apiKey = config('n8n.api_key') ?? '';
        $this->timeout = config('n8n.timeout', 10);
    }

    public function isEnabled(): bool
    {
        return config('n8n.enabled', false) && !empty($this->apiKey);
    }

    /**
     * Trigger workflow when a new order is created.
     */
    public function triggerOrderCreated(Order $order): bool
    {
        $order->load(['customer', 'items.service', 'staff']);

        return $this->triggerWorkflow('order_created', [
            'event'      => 'order.created',
            'order'      => $this->formatOrder($order),
            'customer'   => $this->formatCustomer($order->customer),
            'items'      => $order->items->map(fn($item) => [
                'service'    => $item->service->name ?? $item->description,
                'quantity'   => $item->quantity,
                'unit_price' => $item->unit_price,
                'subtotal'   => $item->subtotal,
            ])->toArray(),
            'timestamp'  => now()->toIso8601String(),
        ]);
    }

    /**
     * Trigger workflow when an order status changes.
     */
    public function triggerOrderStatusChanged(Order $order, string $previousStatus): bool
    {
        $order->load(['customer']);

        return $this->triggerWorkflow('order_status_changed', [
            'event'           => 'order.status_changed',
            'order'           => $this->formatOrder($order),
            'customer'        => $this->formatCustomer($order->customer),
            'previous_status' => $previousStatus,
            'new_status'      => $order->status,
            'timestamp'       => now()->toIso8601String(),
        ]);
    }

    /**
     * Trigger workflow when an order is completed (delivered).
     */
    public function triggerOrderCompleted(Order $order): bool
    {
        $order->load(['customer', 'items.service', 'invoice']);

        return $this->triggerWorkflow('order_completed', [
            'event'    => 'order.completed',
            'order'    => $this->formatOrder($order),
            'customer' => $this->formatCustomer($order->customer),
            'invoice'  => $order->invoice ? [
                'number'     => $order->invoice->invoice_number,
                'total'      => $order->invoice->total,
                'vat_amount' => $order->invoice->vat_amount,
                'status'     => $order->invoice->status,
            ] : null,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Trigger workflow when a new customer is created.
     */
    public function triggerCustomerCreated(Customer $customer): bool
    {
        return $this->triggerWorkflow('customer_created', [
            'event'     => 'customer.created',
            'customer'  => $this->formatCustomer($customer),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Trigger workflow for daily report generation.
     */
    public function triggerDailyReport(array $reportData): bool
    {
        return $this->triggerWorkflow('daily_report', [
            'event'     => 'report.daily',
            'data'      => $reportData,
            'currency'  => config('app.currency', 'BHD'),
            'vat_rate'  => config('app.vat_rate', 0.10),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Trigger workflow when payment is received.
     */
    public function triggerPaymentReceived(Order $order): bool
    {
        $order->load(['customer']);

        return $this->triggerWorkflow('payment_received', [
            'event'    => 'payment.received',
            'order'    => $this->formatOrder($order),
            'customer' => $this->formatCustomer($order->customer),
            'payment'  => [
                'method' => $order->payment_method,
                'amount' => $order->total,
                'currency' => config('app.currency', 'BHD'),
            ],
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Check if n8n instance is reachable.
     */
    public function healthCheck(): array
    {
        if (!$this->isEnabled()) {
            return [
                'status'  => 'warning',
                'message' => 'n8n not configured',
            ];
        }

        try {
            $response = Http::withHeaders([
                'X-N8N-API-KEY' => $this->apiKey,
            ])->timeout(5)->get(rtrim(config('n8n.base_url'), '/') . '/api/v1/workflows?limit=1');

            if ($response->successful()) {
                return [
                    'status'  => 'ok',
                    'message' => 'n8n connected',
                ];
            }

            return [
                'status'  => 'error',
                'message' => 'n8n returned HTTP ' . $response->status(),
            ];
        } catch (\Exception $e) {
            return [
                'status'  => 'error',
                'message' => 'n8n unreachable: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Send a payload to a named n8n workflow webhook.
     */
    private function triggerWorkflow(string $workflowName, array $payload): bool
    {
        if (!$this->isEnabled()) {
            return false;
        }

        $path = config("n8n.workflows.{$workflowName}");
        if (!$path) {
            Log::warning("n8n workflow not configured: {$workflowName}");
            return false;
        }

        $url = $this->webhookUrl . $path;

        try {
            $response = Http::withHeaders([
                'Content-Type'   => 'application/json',
                'X-N8N-API-KEY'  => $this->apiKey,
                'X-Webhook-Source' => 'green-land-laundry',
            ])->timeout($this->timeout)->post($url, $payload);

            if ($response->successful()) {
                Log::info("n8n workflow triggered: {$workflowName}", ['url' => $url]);
                return true;
            }

            Log::warning("n8n workflow failed: {$workflowName}", [
                'url'    => $url,
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            return false;
        } catch (\Exception $e) {
            Log::error("n8n workflow error: {$workflowName}", [
                'url'   => $url,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    private function formatOrder(Order $order): array
    {
        return [
            'id'            => $order->id,
            'order_number'  => $order->order_number,
            'status'        => $order->status,
            'pickup_date'   => $order->pickup_date?->toDateString(),
            'delivery_date' => $order->delivery_date?->toDateString(),
            'subtotal'      => $order->subtotal,
            'vat_amount'    => $order->vat_amount,
            'total'         => $order->total,
            'currency'      => config('app.currency', 'BHD'),
            'notes'         => $order->notes,
        ];
    }

    private function formatCustomer(Customer $customer): array
    {
        return [
            'id'       => $customer->id,
            'name'     => $customer->name,
            'phone'    => $customer->phone,
            'whatsapp' => $customer->whats_app_number,
            'email'    => $customer->email,
            'area'     => $customer->area,
        ];
    }
}
