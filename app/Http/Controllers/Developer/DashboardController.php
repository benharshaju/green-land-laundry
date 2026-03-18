<?php

namespace App\Http\Controllers\Developer;

use App\Http\Controllers\Controller;
use App\Services\AiImageService;
use App\Services\N8nService;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class DashboardController extends Controller
{
    public function __construct(
        private AiImageService $aiImage,
        private N8nService $n8n,
    ) {}

    public function index()
    {
        $stats = [
            'php_version'     => PHP_VERSION,
            'laravel_version' => app()->version(),
            'db_size'         => $this->getDatabaseSize(),
            'storage_used'    => $this->getStorageUsed(),
            'queue_jobs'      => \DB::table('jobs')->count(),
            'failed_jobs'     => \DB::table('failed_jobs')->count(),
            'cache_driver'    => config('cache.default'),
            'queue_driver'    => config('queue.default'),
        ];

        return view('developer.dashboard', compact('stats'));
    }

    public function logs()
    {
        $logFile = storage_path('logs/laravel.log');
        $logs    = [];

        if (File::exists($logFile)) {
            $content = File::get($logFile);
            $lines   = array_slice(explode("\n", $content), -100);
            $logs    = array_filter($lines);
        }

        return view('developer.logs', compact('logs'));
    }

    public function apiKeys()
    {
        $user = auth()->user();
        $tokens = $user->tokens()->latest()->get();
        return view('developer.api-keys', compact('tokens'));
    }

    public function regenerateApiKey(Request $request)
    {
        $user = auth()->user();
        $user->tokens()->delete();
        $token = $user->createToken('Developer API Key')->plainTextToken;

        return back()->with('success', "New API key: {$token}");
    }

    public function systemHealth()
    {
        $checks = [
            'database'   => $this->checkDatabase(),
            'cache'      => $this->checkCache(),
            'storage'    => $this->checkStorage(),
            'whatsapp'   => $this->checkWhatsApp(),
            'openai'     => $this->checkOpenAI(),
            'n8n'        => $this->n8n->healthCheck(),
            'queue'      => $this->checkQueue(),
        ];

        return view('developer.system-health', compact('checks'));
    }

    public function aiImages()
    {
        $services = Service::where('is_active', true)->get();
        return view('developer.ai-images', compact('services'));
    }

    public function generateAiImage(Request $request)
    {
        $request->validate([
            'service_id' => 'required|exists:services,id',
            'style'      => 'nullable|in:photorealistic,artistic,minimalist',
        ]);

        $service = Service::findOrFail($request->service_id);
        $path    = $this->aiImage->generateServiceImage($service, $request->style ?? 'photorealistic');

        if ($path) {
            return back()->with('success', "AI image generated for {$service->name}.");
        }

        return back()->with('error', 'Failed to generate AI image. Check OpenAI configuration.');
    }

    public function n8nWorkflows()
    {
        $health = $this->n8n->healthCheck();
        $workflows = config('n8n.workflows', []);
        $webhookUrl = config('n8n.webhook_url');

        return view('developer.n8n', compact('health', 'workflows', 'webhookUrl'));
    }

    public function n8nTest(Request $request)
    {
        $request->validate([
            'workflow' => 'required|string',
        ]);

        $health = $this->n8n->healthCheck();

        if ($health['status'] === 'ok') {
            return back()->with('success', 'n8n connection is healthy. Workflows are ready to trigger.');
        }

        return back()->with('error', "n8n health check failed: {$health['message']}");
    }

    private function getDatabaseSize(): string
    {
        try {
            $result = \DB::select("SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
                                   FROM information_schema.TABLES
                                   WHERE table_schema = DATABASE()");
            return ($result[0]->size_mb ?? 0) . ' MB';
        } catch (\Exception) {
            return 'N/A';
        }
    }

    private function getStorageUsed(): string
    {
        $bytes = 0;
        $path  = storage_path('app/public');
        if (is_dir($path)) {
            foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($path)) as $file) {
                $bytes += $file->getSize();
            }
        }
        return round($bytes / 1024 / 1024, 2) . ' MB';
    }

    private function checkDatabase(): array
    {
        try {
            \DB::connection()->getPdo();
            return ['status' => 'ok', 'message' => 'Connected'];
        } catch (\Exception $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    private function checkCache(): array
    {
        try {
            cache()->put('health_check', true, 10);
            cache()->get('health_check');
            return ['status' => 'ok', 'message' => config('cache.default') . ' working'];
        } catch (\Exception $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    private function checkStorage(): array
    {
        $writable = is_writable(storage_path());
        return [
            'status'  => $writable ? 'ok' : 'error',
            'message' => $writable ? 'Storage writable' : 'Storage not writable',
        ];
    }

    private function checkWhatsApp(): array
    {
        $configured = !empty(config('services.twilio.sid'));
        return [
            'status'  => $configured ? 'ok' : 'warning',
            'message' => $configured ? 'Twilio configured' : 'Twilio not configured',
        ];
    }

    private function checkOpenAI(): array
    {
        $configured = !empty(config('openai.api_key'));
        return [
            'status'  => $configured ? 'ok' : 'warning',
            'message' => $configured ? 'OpenAI configured' : 'OpenAI not configured',
        ];
    }

    private function checkQueue(): array
    {
        $failed = \DB::table('failed_jobs')->count();
        return [
            'status'  => $failed > 0 ? 'warning' : 'ok',
            'message' => $failed > 0 ? "{$failed} failed job(s)" : 'No failed jobs',
        ];
    }
}
