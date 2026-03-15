<?php

namespace App\Services;

use OpenAI\Laravel\Facades\OpenAI;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Models\Service;

class AiImageService
{
    /**
     * Generate an AI product image for a laundry service using DALL-E 3.
     */
    public function generateServiceImage(Service $service, string $style = 'photorealistic'): ?string
    {
        $prompt = $this->buildPrompt($service, $style);

        try {
            $response = OpenAI::images()->create([
                'model'           => 'dall-e-3',
                'prompt'          => $prompt,
                'n'               => 1,
                'size'            => '1024x1024',
                'quality'         => 'hd',
                'response_format' => 'url',
            ]);

            $imageUrl = $response->data[0]->url;

            // Download and store locally
            $localPath = $this->downloadAndStore($imageUrl, "services/{$service->id}");

            if ($localPath) {
                $service->update(['ai_image_url' => Storage::url($localPath)]);
                return $localPath;
            }

            return $imageUrl;
        } catch (\Exception $e) {
            Log::error('AI image generation failed', [
                'service_id' => $service->id,
                'error'      => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Generate a marketing banner for Green Land Laundry.
     */
    public function generateMarketingBanner(string $occasion): ?string
    {
        $prompt = "Professional marketing banner for 'Green Land Laundry' in Bahrain. "
                . "Occasion: {$occasion}. "
                . "Modern, clean design with green and gold color scheme. "
                . "Arabic and English text elements. High-quality photorealistic style.";

        try {
            $response = OpenAI::images()->create([
                'model'   => 'dall-e-3',
                'prompt'  => $prompt,
                'n'       => 1,
                'size'    => '1792x1024',
                'quality' => 'hd',
            ]);

            return $response->data[0]->url;
        } catch (\Exception $e) {
            Log::error('Marketing banner generation failed', ['error' => $e->getMessage()]);
            return null;
        }
    }

    private function buildPrompt(Service $service, string $style): string
    {
        $category = Service::CATEGORIES[$service->category] ?? $service->category;

        return "Professional product photo of laundry service: '{$service->name}' ({$category}). "
             . "Clean white background, soft studio lighting, {$style} style. "
             . "High-end laundry and dry cleaning aesthetic. "
             . "Green Land Laundry brand in Bahrain. No text overlay.";
    }

    private function downloadAndStore(string $url, string $path): ?string
    {
        try {
            $contents = file_get_contents($url);
            if ($contents === false) {
                return null;
            }

            $filename = $path . '/' . uniqid('ai_', true) . '.png';
            Storage::put("public/{$filename}", $contents);

            return "public/{$filename}";
        } catch (\Exception $e) {
            Log::error('Failed to store AI image', ['error' => $e->getMessage()]);
            return null;
        }
    }
}
