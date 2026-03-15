<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Order;
use App\Services\WhatsAppService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function __construct(private WhatsAppService $whatsApp) {}

    public function index()
    {
        $invoices = Invoice::with(['customer', 'order'])
            ->latest()
            ->paginate(20);

        return view('admin.invoices.index', compact('invoices'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
        ]);

        $order = Order::with(['items.service', 'customer'])->findOrFail($request->order_id);

        $invoice = Invoice::create([
            'order_id'    => $order->id,
            'customer_id' => $order->customer_id,
            'issue_date'  => today(),
            'due_date'    => today()->addDays(7),
            'subtotal'    => $order->subtotal,
            'vat_rate'    => $order->vat_rate,
            'vat_amount'  => $order->vat_amount,
            'total'       => $order->total,
            'currency'    => Order::CURRENCY,
            'status'      => Invoice::STATUS_DRAFT,
        ]);

        // Generate PDF
        $pdf  = Pdf::loadView('admin.invoices.pdf', compact('invoice', 'order'));
        $path = "invoices/{$invoice->invoice_number}.pdf";
        $pdf->save(storage_path("app/public/{$path}"));
        $invoice->update(['pdf_path' => $path]);

        return redirect()->route('admin.invoices.show', $invoice)
            ->with('success', "Invoice {$invoice->invoice_number} created.");
    }

    public function show(Invoice $invoice)
    {
        $invoice->load(['order.items.service', 'customer']);
        return view('admin.invoices.show', compact('invoice'));
    }

    public function downloadPdf(Invoice $invoice)
    {
        $invoice->load(['order.items.service', 'customer']);
        $pdf = Pdf::loadView('admin.invoices.pdf', compact('invoice'));
        return $pdf->download("{$invoice->invoice_number}.pdf");
    }

    public function destroy(Invoice $invoice)
    {
        $invoice->delete();
        return redirect()->route('admin.invoices.index')
            ->with('success', 'Invoice deleted.');
    }
}
