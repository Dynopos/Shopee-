<?php

namespace App\Http\Controllers;

use App\Models\ShopeeAccount;

class SettingsController extends Controller
{
    public function index()
    {
        $accounts = ShopeeAccount::where('user_id', auth()->id())->get();
        return view('settings.index', compact('accounts'));
    }
}
