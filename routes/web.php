<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\PreviewController;
use App\Http\Controllers\ConnectShopeeController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\ShopeeOAuthController;

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [AuthController::class, 'register']);
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('/', fn () => redirect()->route('dashboard'));

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/upload', [UploadController::class, 'index'])->name('upload');
    Route::post('/upload', [UploadController::class, 'store'])->name('upload.store');
    Route::get('/preview', [PreviewController::class, 'index'])->name('preview');
    Route::post('/preview/upload', [PreviewController::class, 'uploadToShopee'])->name('preview.upload');
    Route::get('/connect-shopee', [ConnectShopeeController::class, 'index'])->name('connect-shopee');
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings');

    Route::get('/shopee/auth', [ShopeeOAuthController::class, 'redirect'])->name('shopee.auth');
    Route::get('/shopee/callback', [ShopeeOAuthController::class, 'callback'])->name('shopee.callback');
});
