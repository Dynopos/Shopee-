<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class ShopeeService
{
    private string $partnerId;
    private string $partnerKey;
    private string $host;
    private string $redirectUrl;

    public function __construct()
    {
        $this->partnerId   = (string) config('shopee.partner_id');
        $this->partnerKey  = (string) config('shopee.partner_key');
        $this->host        = config('shopee.host');
        $this->redirectUrl = (string) config('shopee.redirect_url');
    }

    private function sign(string $path, int $timestamp, string $accessToken = '', string $shopId = ''): string
    {
        $base = $this->partnerId . $path . $timestamp;
        if ($accessToken) $base .= $accessToken . $shopId;
        return hash_hmac('sha256', $base, $this->partnerKey);
    }

    public function getAuthUrl(): string
    {
        $ts   = time();
        $path = '/api/v2/shop/auth_partner';
        $sign = $this->sign($path, $ts);
        return $this->host . $path
            . "?partner_id={$this->partnerId}&timestamp={$ts}&sign={$sign}"
            . "&redirect={$this->redirectUrl}";
    }

    public function exchangeCode(string $code, string $shopId): array
    {
        $ts   = time();
        $path = '/api/v2/auth/token/get';
        $sign = $this->sign($path, $ts);

        return Http::post($this->host . $path . "?partner_id={$this->partnerId}&timestamp={$ts}&sign={$sign}", [
            'code'       => $code,
            'shop_id'    => (int) $shopId,
            'partner_id' => (int) $this->partnerId,
        ])->json();
    }

    public function refreshToken(string $refreshToken, string $shopId): array
    {
        $ts   = time();
        $path = '/api/v2/auth/access_token/get';
        $sign = $this->sign($path, $ts);

        return Http::post($this->host . $path . "?partner_id={$this->partnerId}&timestamp={$ts}&sign={$sign}", [
            'refresh_token' => $refreshToken,
            'shop_id'       => (int) $shopId,
            'partner_id'    => (int) $this->partnerId,
        ])->json();
    }

    public function uploadImage(string $imagePath, string $accessToken, string $shopId): string
    {
        $ts   = time();
        $path = '/api/v2/media_space/upload_image';
        $sign = $this->sign($path, $ts, $accessToken, $shopId);

        $response = Http::attach('image', file_get_contents($imagePath), basename($imagePath))
            ->post($this->host . $path . "?partner_id={$this->partnerId}&timestamp={$ts}&sign={$sign}&access_token={$accessToken}&shop_id={$shopId}")
            ->json();

        return $response['response']['image_info']['image_id']
            ?? $response['response']['image_url']
            ?? '';
    }

    public function createProduct(array $params, string $accessToken, string $shopId): array
    {
        $ts   = time();
        $path = '/api/v2/product/add_item';
        $sign = $this->sign($path, $ts, $accessToken, $shopId);

        return Http::post(
            $this->host . $path . "?partner_id={$this->partnerId}&timestamp={$ts}&sign={$sign}&access_token={$accessToken}&shop_id={$shopId}",
            $params
        )->json();
    }
}
