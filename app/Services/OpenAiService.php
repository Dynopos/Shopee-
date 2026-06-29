<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class OpenAiService
{
    public function generateListing(string $base64Image, string $mimeType): array
    {
        $prompt = 'Analisis gambar produk ini dan hasilkan listing untuk Shopee Malaysia '
            . 'dalam JSON dengan medan: title (maks 120 aksara), description (kaya SEO, 3-5 perenggan), '
            . 'keywords (array 5-10 kata kunci), category (kategori Shopee), '
            . 'suggested_price (dalam MYR, nombor sahaja), stock_quantity (integer), '
            . 'highlights (array 3-5 ciri utama). Balas dalam JSON sahaja.';

        $response = Http::withToken((string) config('services.openai.key'))
            ->timeout(60)
            ->acceptJson()
            ->post('https://api.openai.com/v1/chat/completions', [
                'model'           => config('services.openai.model', 'gpt-4o'),
                'response_format' => ['type' => 'json_object'],
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => [
                            [
                                'type'      => 'image_url',
                                'image_url' => ['url' => "data:{$mimeType};base64,{$base64Image}"],
                            ],
                            [
                                'type' => 'text',
                                'text' => $prompt,
                            ],
                        ],
                    ],
                ],
            ]);

        if ($response->failed()) {
            throw new \RuntimeException('OpenAI error: ' . $response->body());
        }

        $content = $response->json('choices.0.message.content', '{}');

        return json_decode($content, true) ?? [];
    }
}
