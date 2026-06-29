@extends('layouts.app')

@section('title', 'Sambung Shopee')
@section('page-title', 'Sambung Akaun Shopee')
@section('page-subtitle', 'Hubungkan akaun penjual Shopee anda')

@section('content')
<div class="max-w-2xl">
    @if(session('success'))
    <div class="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm">{{ session('success') }}</div>
    @endif
    @if(session('error'))
    <div class="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">{{ session('error') }}</div>
    @endif

    @foreach($accounts as $account)
    <div class="card flex items-center justify-between mb-4">
        <div>
            <div class="flex items-center gap-2 mb-0.5">
                <div class="w-2 h-2 rounded-full bg-green-500"></div>
                <p class="font-semibold text-gray-900 text-sm">{{ $account->shop_name }}</p>
            </div>
            <p class="text-xs text-gray-400">Shop ID: {{ $account->shop_id }}</p>
            <p class="text-xs text-gray-400 mt-0.5">Token tamat: {{ $account->token_expires_at->format('d/m/Y') }}</p>
        </div>
        <span class="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">Aktif</span>
    </div>
    @endforeach

    <a href="{{ route('shopee.auth') }}" class="btn-blue">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.1-1.1m-.757-4.9a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
        {{ $accounts->isNotEmpty() ? 'Sambung Akaun Lain' : 'Sambung Akaun Shopee' }}
    </a>

    <div class="card mt-8">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Cara Sambung</h3>
        <ol class="space-y-3">
            @foreach(['Klik butang "Sambung Akaun Shopee" di atas','Log masuk ke akaun penjual Shopee anda','Benarkan akses aplikasi untuk urus produk anda','Anda akan diarahkan kembali ke sini secara automatik'] as $i => $step)
            <li class="flex items-start gap-3">
                <div class="min-w-[22px] h-[22px] rounded-full bg-[#2563EB] text-white text-[11px] font-bold flex items-center justify-center mt-0.5">{{ $i+1 }}</div>
                <p class="text-sm text-gray-500">{{ $step }}</p>
            </li>
            @endforeach
        </ol>
    </div>
</div>
@endsection
