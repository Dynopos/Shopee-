<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\ShopeeAccount;
use App\Models\UploadLog;
use App\Services\ShopeeService;

class PreviewController extends Controller
{
    public function index()
    {
        $draft = session('listing_draft');
        if (!$draft && !session('success_item_id')) {
            return redirect()->route('upload');
        }
        return view('preview.index', ['draft' => $draft ?? []]);
    }

    public function uploadToShopee(Request $request, ShopeeService $shopee)
    {
        $data = $request->validate([
            'product_id'  => 'required|integer',
            'title'       => 'required|string|max:120',
            'description' => 'required|string',
            'price'       => 'required|numeric|min:0',
            'stock'       => 'required|integer|min:0',
            'category'    => 'nullable|string',
            'keywords'    => 'nullable',
            'highlights'  => 'nullable|array',
        ]);

        $product = Product::where('id', $data['product_id'])
            ->where('user_id', auth()->id())
            ->firstOrFail();

        $account = ShopeeAccount::where('user_id', auth()->id())->firstOrFail();

        if ($account->isTokenExpired()) {
            $refreshed = $shopee->refreshToken($account->refresh_token, $account->shop_id);
            $account->update([
                'access_token'     => $refreshed['access_token'] ?? $account->access_token,
                'refresh_token'    => $refreshed['refresh_token'] ?? $account->refresh_token,
                'token_expires_at' => now()->addSeconds($refreshed['expire_in'] ?? 14400),
            ]);
        }

        $keywords = is_string($data['keywords'] ?? null)
            ? (json_decode($data['keywords'], true) ?? [])
            : ($data['keywords'] ?? []);

        $product->update([
            'title'       => $data['title'],
            'description' => $data['description'],
            'price'       => $data['price'],
            'stock'       => $data['stock'],
            'category'    => $data['category'],
            'keywords'    => $keywords,
            'highlights'  => $data['highlights'] ?? [],
            'status'      => 'uploading',
        ]);

        try {
            $draft    = session('listing_draft');
            $imageId  = $shopee->uploadImage($draft['image_path'], $account->access_token, $account->shop_id);

            $response = $shopee->createProduct([
                'original_price' => (float) $data['price'],
                'description'    => $data['description'],
                'item_name'      => $data['title'],
                'normal_stock'   => (int) $data['stock'],
                'weight'         => 0.5,
                'item_sku'       => 'SKU-' . $product->id,
                'category_id'    => 100001,
                'image'          => ['image_id_list' => [$imageId]],
                'logistic_info'  => [['logistic_id' => 1, 'enabled' => true]],
            ], $account->access_token, $account->shop_id);

            $itemId = $response['response']['item_id'] ?? null;

            $product->update(['status' => 'live', 'shopee_item_id' => $itemId]);

            UploadLog::create([
                'product_id'      => $product->id,
                'status'          => 'success',
                'shopee_response' => $response,
            ]);

            session()->forget('listing_draft');

            return redirect()->route('preview')->with('success_item_id', $itemId);

        } catch (\Throwable $e) {
            $product->update(['status' => 'failed']);
            UploadLog::create([
                'product_id'    => $product->id,
                'status'        => 'error',
                'error_message' => $e->getMessage(),
            ]);
            return back()->withErrors(['upload' => $e->getMessage()]);
        }
    }
}
