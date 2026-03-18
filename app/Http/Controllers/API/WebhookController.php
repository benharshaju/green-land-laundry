<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\N8nService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function whatsapp(Request $request)
    {
        Log::info('WhatsApp webhook', $request->all());

        $body = $request->input('Body', '');
        $from = $request->input('From', '');

        // Auto-respond to tracking queries
        if (str_contains(strtoupper($body), 'STATUS') || str_contains(strtoupper($body), 'ORDER')) {
            // Extract order number if present
            preg_match('/GLL-\d{8}-\d{4}/', $body, $matches);
            if (!empty($matches[0])) {
                $order = Order::where('order_number', $matches[0])->first();
                if ($order) {
                    // Send status via WhatsApp
                    Log::info("Auto-reply for order {$order->order_number} to {$from}");
                }
            }
        }

        return response()->xml('<Response></Response>', 200, ['Content-Type' => 'text/xml']);
    }

    public function payment(Request $request)
    {
        Log::info('Payment webhook', $request->all());

        $orderId = $request->input('order_id');
        $status  = $request->input('status');

        if ($orderId && $status === 'paid') {
            $order = Order::find($orderId);
            if ($order) {
                $order->update(['paid_at' => now(), 'payment_method' => $request->input('method', 'online')]);

                // Trigger n8n payment workflow
                app(N8nService::class)->triggerPaymentReceived($order);
            }
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Handle incoming webhooks from n8n.
     */
    public function n8n(Request $request)
    {
        Log::info('n8n webhook received', $request->all());

        // Verify webhook secret
        $secret = config('n8n.webhook_secret');
        if ($secret && $request->header('X-Webhook-Secret') !== $secret) {
            Log::warning('n8n webhook: invalid secret');
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $action = $request->input('action');

        return match ($action) {
            'update_order_status' => $this->n8nUpdateOrderStatus($request),
            'get_order'           => $this->n8nGetOrder($request),
            'get_daily_stats'     => $this->n8nGetDailyStats(),
            default               => response()->json([
                'status'  => 'ok',
                'message' => 'Webhook received',
            ]),
        };
    }

    private function n8nUpdateOrderStatus(Request $request)
    {
        $order = Order::where('order_number', $request->input('order_number'))->first();
        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        $order->update(['status' => $request->input('status')]);

        return response()->json([
            'status' => 'ok',
            'order'  => [
                'order_number' => $order->order_number,
                'status'       => $order->status,
            ],
        ]);
    }

    private function n8nGetOrder(Request $request)
    {
        $order = Order::with(['customer', 'items.service'])
            ->where('order_number', $request->input('order_number'))
            ->first();

        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        return response()->json(['order' => $order]);
    }

    private function n8nGetDailyStats()
    {
        $today = now()->toDateString();

        return response()->json([
            'date'           => $today,
            'orders_today'   => Order::whereDate('created_at', $today)->count(),
            'revenue_today'  => Order::whereDate('created_at', $today)->sum('total'),
            'pending_orders' => Order::where('status', 'pending')->count(),
            'ready_orders'   => Order::where('status', 'ready')->count(),
            'currency'       => config('app.currency', 'BHD'),
        ]);
    }
}
