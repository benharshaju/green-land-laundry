<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $invoice->invoice_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 13px; color: #1f2937; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #16a34a; padding-bottom: 20px; }
        .logo { font-size: 22px; font-weight: 700; color: #16a34a; }
        .logo-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
        .invoice-title { text-align: right; }
        .invoice-title h1 { font-size: 28px; font-weight: 700; color: #16a34a; }
        .invoice-title p { color: #6b7280; font-size: 12px; }
        .info-grid { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .info-box h3 { font-size: 11px; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.05em; margin-bottom: 8px; }
        .info-box p { margin-bottom: 3px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        thead th { background: #f0fdf4; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #bbf7d0; }
        tbody td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; }
        .totals { margin-left: auto; width: 280px; }
        .totals tr td { padding: 6px 0; }
        .totals tr td:first-child { color: #6b7280; }
        .totals tr td:last-child { text-align: right; font-weight: 500; }
        .totals .total-row td { font-size: 16px; font-weight: 700; color: #16a34a; border-top: 2px solid #16a34a; padding-top: 10px; }
        .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 11px; color: #9ca3af; text-align: center; }
        .vat-note { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px 16px; margin-bottom: 30px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="logo">Green Land Laundry</div>
            <div class="logo-sub">غرين لاند للغسيل</div>
            <div class="logo-sub" style="margin-top:8px">Manama, Kingdom of Bahrain</div>
            <div class="logo-sub">CR: 12345-6 | VAT Reg: BH-VAT-000001</div>
        </div>
        <div class="invoice-title">
            <h1>TAX INVOICE</h1>
            <p>{{ $invoice->invoice_number }}</p>
            <p>Date: {{ $invoice->issue_date->format('d M Y') }}</p>
            @if($invoice->due_date)
            <p>Due: {{ $invoice->due_date->format('d M Y') }}</p>
            @endif
        </div>
    </div>

    <div class="info-grid">
        <div class="info-box">
            <h3>Bill To</h3>
            <p><strong>{{ $invoice->customer->name }}</strong></p>
            @if($invoice->customer->name_arabic)
            <p>{{ $invoice->customer->name_arabic }}</p>
            @endif
            <p>{{ $invoice->customer->phone }}</p>
            @if($invoice->customer->area)<p>{{ $invoice->customer->area }}, Bahrain</p>@endif
        </div>
        <div class="info-box">
            <h3>Order Details</h3>
            <p>Order #: <strong>{{ $order->order_number }}</strong></p>
            <p>Currency: <strong>BHD (Bahraini Dinar)</strong></p>
            <p>Payment: {{ $order->payment_method ?? 'Pending' }}</p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Service</th>
                <th style="text-align:right">Qty</th>
                <th style="text-align:right">Unit Price (BHD)</th>
                <th style="text-align:right">Subtotal (BHD)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->items as $i => $item)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $item->description }}</td>
                <td style="text-align:right">{{ $item->quantity }}</td>
                <td style="text-align:right">{{ number_format($item->unit_price, 3) }}</td>
                <td style="text-align:right">{{ number_format($item->subtotal, 3) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr>
            <td>Subtotal</td>
            <td>BD {{ number_format($invoice->subtotal, 3) }}</td>
        </tr>
        <tr>
            <td>VAT ({{ number_format($invoice->vat_rate * 100, 0) }}%)</td>
            <td>BD {{ number_format($invoice->vat_amount, 3) }}</td>
        </tr>
        <tr class="total-row">
            <td>TOTAL DUE</td>
            <td>BD {{ number_format($invoice->total, 3) }}</td>
        </tr>
    </table>

    <div class="vat-note">
        <strong>VAT Note:</strong> This invoice includes {{ number_format($invoice->vat_rate * 100, 0) }}% Value Added Tax (VAT)
        in accordance with the Kingdom of Bahrain VAT Law (Law No. 48 of 2018).
        VAT Amount: BD {{ number_format($invoice->vat_amount, 3) }}
    </div>

    <div class="footer">
        <p>Green Land Laundry — Manama, Kingdom of Bahrain</p>
        <p>Thank you for your business! شكراً لتعاملكم معنا</p>
    </div>
</body>
</html>
