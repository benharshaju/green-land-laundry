<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Order;
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
            }
        }

        return response()->json(['status' => 'ok']);
    }
}
