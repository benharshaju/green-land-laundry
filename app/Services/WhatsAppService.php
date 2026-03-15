<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Customer;
use Twilio\Rest\Client;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    private Client $client;
    private string $from;

    public function __construct()
    {
        $this->client = new Client(
            config('services.twilio.sid'),
            config('services.twilio.token')
        );
        $this->from = config('services.twilio.whatsapp_from');
    }

    public function sendOrderConfirmation(Order $order): bool
    {
        $customer = $order->customer;
        $message  = $this->buildOrderConfirmationMessage($order, $customer);
        return $this->send($customer->whats_app_number, $message);
    }

    public function sendStatusUpdate(Order $order): bool
    {
        $customer = $order->customer;
        $message  = $this->buildStatusUpdateMessage($order, $customer);
        return $this->send($customer->whats_app_number, $message);
    }

    public function sendReadyForPickup(Order $order): bool
    {
        $customer = $order->customer;
        $message  = $this->buildReadyMessage($order, $customer);
        return $this->send($customer->whats_app_number, $message);
    }

    public function sendInvoice(Order $order): bool
    {
        $customer = $order->customer;
        $message  = $this->buildInvoiceMessage($order, $customer);
        return $this->send($customer->whats_app_number, $message);
    }

    private function send(string $to, string $message): bool
    {
        try {
            $this->client->messages->create(
                'whatsapp:' . $to,
                [
                    'from' => $this->from,
                    'body' => $message,
                ]
            );

            Log::info('WhatsApp sent', ['to' => $to]);
            return true;
        } catch (\Exception $e) {
            Log::error('WhatsApp failed', ['to' => $to, 'error' => $e->getMessage()]);
            return false;
        }
    }

    private function buildOrderConfirmationMessage(Order $order, Customer $customer): string
    {
        return "🌿 *Green Land Laundry*\n\n"
            . "Ahlan {$customer->name}! ✅\n"
            . "Order *#{$order->order_number}* confirmed.\n\n"
            . "📅 Pickup: " . $order->pickup_date->format('D, d M Y') . "\n"
            . "📦 Items: " . $order->items->count() . " piece(s)\n"
            . "💰 Total: {$order->formatted_total} (incl. 10% VAT)\n\n"
            . "Track your order: " . route('track', $order->order_number) . "\n\n"
            . "شكراً لاختيارك غرين لاند للغسيل 🙏";
    }

    private function buildStatusUpdateMessage(Order $order, Customer $customer): string
    {
        $statusLabels = [
            'received' => '📥 Received',
            'washing'  => '🫧 Being Washed',
            'drying'   => '💨 Drying',
            'ironing'  => '👔 Being Ironed',
            'ready'    => '✅ Ready for Pickup',
            'delivered' => '🎉 Delivered',
        ];

        $statusLabel = $statusLabels[$order->status] ?? ucfirst($order->status);

        return "🌿 *Green Land Laundry*\n\n"
            . "Hi {$customer->name}!\n"
            . "Order *#{$order->order_number}* update:\n\n"
            . "Status: *{$statusLabel}*\n\n"
            . "Questions? Reply to this message. 😊";
    }

    private function buildReadyMessage(Order $order, Customer $customer): string
    {
        return "🌿 *Green Land Laundry*\n\n"
            . "🎉 Great news, {$customer->name}!\n"
            . "Order *#{$order->order_number}* is *READY* for pickup!\n\n"
            . "📍 Location: Manama, Bahrain\n"
            . "🕐 Hours: 8AM - 10PM\n"
            . "💰 Amount due: {$order->formatted_total}\n\n"
            . "See you soon! 🙏";
    }

    private function buildInvoiceMessage(Order $order, Customer $customer): string
    {
        return "🌿 *Green Land Laundry*\n\n"
            . "Invoice for {$customer->name}\n"
            . "Order: *#{$order->order_number}*\n\n"
            . "Subtotal: BD " . number_format($order->subtotal, 3) . "\n"
            . "VAT (10%): BD " . number_format($order->vat_amount, 3) . "\n"
            . "─────────────────\n"
            . "*Total: BD " . number_format($order->total, 3) . "*\n\n"
            . "Download invoice: " . route('invoices.download', $order->invoice) . "\n\n"
            . "Thank you! شكراً 🙏";
    }
}
