<?php

namespace App\Services;

use OpenAI\Laravel\Facades\OpenAI;

class OpenAiService
{
    public function generateListing(string $base64Image, string $mimeType): array
    {
        $response = OpenAI::chat()->create([
            'model' => 'gpt-4o',
            'response_format' => ['type' => 'json_object'],
            'messages' => [
                [
                    'role' => 'user',
                    'content' => [
                        [
                            'type' => 'image_url',
                            'image_url' => ['url' => "data:{$mimeType};base64,{$base64Image}"],
                        ],
                        [
                            'type' => 'text',
                            'text' => 'Analisis gambar produk ini dan hasilkan listing untuk Shopee Malaysia dalam JSON dengan medan: title (maks 120 aksara), description (kaya SEO, 3-5 perenggan), keywords (array 5-10 kata kunci), category (kategori Shopee), suggested_price (dalam MYR, nombor sahaja), stock_quantity (integer), highlights (array 3-5 ciri utama). Balas dalam JSON sahaja.',
                        ],
                    ],
                ],
            ],
        ]);

        return json_decode($response->choices[0]->message->content, true);
    }
}
