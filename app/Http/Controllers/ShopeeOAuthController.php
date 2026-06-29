<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ShopeeAccount;
use App\Services\ShopeeService;

class ShopeeOAuthController extends Controller
{
    public function redirect(ShopeeService $shopee)
    {
        return redirect($shopee->getAuthUrl());
    }

    public function callback(Request $request, ShopeeService $shopee)
    {
        $code   = $request->query('code');
        $shopId = $request->query('shop_id');

        if (!$code || !$shopId) {
            return redirect()->route('connect-shopee')
                ->with('error', 'Sambungan dibatalkan atau gagal.');
        }

        try {
            $token = $shopee->exchangeCode($code, $shopId);

            ShopeeAccount::updateOrCreate(
                ['user_id' => auth()->id(), 'shop_id' => $shopId],
                [
                    'shop_name'        => $token['shop_name'] ?? 'Kedai Shopee',
                    'access_token'     => $token['access_token'],
                    'refresh_token'    => $token['refresh_token'],
                    'token_expires_at' => now()->addSeconds($token['expire_in'] ?? 14400),
                ]
            );

            return redirect()->route('connect-shopee')
                ->with('success', 'Akaun Shopee berjaya disambungkan!');

        } catch (\Throwable $e) {
            return redirect()->route('connect-shopee')
                ->with('error', $e->getMessage());
        }
    }
}
