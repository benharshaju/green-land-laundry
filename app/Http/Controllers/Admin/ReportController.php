<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    public function index()
    {
        $summary = [
            'revenue'   => Order::where('status', Order::STATUS_DELIVERED)->whereMonth('created_at', now()->month)->sum('total'),
            'vat'       => Order::where('status', Order::STATUS_DELIVERED)->whereMonth('created_at', now()->month)->sum('vat_amount'),
            'orders'    => Order::where('status', Order::STATUS_DELIVERED)->whereMonth('created_at', now()->month)->count(),
            'avg_order' => Order::where('status', Order::STATUS_DELIVERED)->whereMonth('created_at', now()->month)->avg('total'),
        ];

        $revenue = Order::where('status', Order::STATUS_DELIVERED)
            ->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total) as revenue'), DB::raw('SUM(vat_amount) as vat'))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $byService = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('services', 'order_items.service_id', '=', 'services.id')
            ->where('orders.status', Order::STATUS_DELIVERED)
            ->whereMonth('orders.created_at', now()->month)
            ->select('services.name', DB::raw('SUM(order_items.subtotal) as value'))
            ->groupBy('services.name')
            ->orderByDesc('value')
            ->limit(6)
            ->get();

        return view('admin.reports.index', compact('summary', 'revenue', 'byService'));
    }

    public function export()
    {
        // Simple CSV export
        $orders = Order::with(['customer', 'items'])
            ->where('status', Order::STATUS_DELIVERED)
            ->whereMonth('created_at', now()->month)
            ->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="greenland_report_' . now()->format('Y_m') . '.csv"',
        ];

        $callback = function () use ($orders) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Order #', 'Customer', 'Date', 'Subtotal (BHD)', 'VAT 10% (BHD)', 'Total (BHD)', 'Status']);
            foreach ($orders as $o) {
                fputcsv($file, [
                    $o->order_number,
                    $o->customer->name ?? '',
                    $o->created_at->format('Y-m-d'),
                    number_format($o->subtotal, 3),
                    number_format($o->vat_amount, 3),
                    number_format($o->total, 3),
                    $o->status,
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
