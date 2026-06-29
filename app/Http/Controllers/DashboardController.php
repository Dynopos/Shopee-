<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ShopeeAccount;

class DashboardController extends Controller
{
    public function index()
    {
        $userId   = auth()->id();
        $products = Product::where('user_id', $userId)->latest()->limit(20)->get();
        $shop     = ShopeeAccount::where('user_id', $userId)->first();

        $stats = [
            'total'  => $products->count(),
            'live'   => $products->where('status', 'live')->count(),
            'draft'  => $products->where('status', 'draft')->count(),
            'failed' => $products->where('status', 'failed')->count(),
        ];

        return view('dashboard.index', compact('products', 'shop', 'stats'));
    }
}
