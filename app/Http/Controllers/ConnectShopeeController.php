<?php

namespace App\Http\Controllers;

use App\Models\ShopeeAccount;

class ConnectShopeeController extends Controller
{
    public function index()
    {
        $accounts = ShopeeAccount::where('user_id', auth()->id())->get();
        return view('connect-shopee.index', compact('accounts'));
    }
}
