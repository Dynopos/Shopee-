@extends('layouts.app')

@section('title', 'Tetapan')
@section('page-title', 'Tetapan')
@section('page-subtitle', 'Urus akaun dan konfigurasi')

@section('content')
<div class="max-w-2xl space-y-5">
    <div class="card">
        <h2 class="text-base font-semibold text-gray-900 mb-4">Maklumat Akaun</h2>
        <div class="divide-y divide-gray-50">
            @foreach(['Emel'=>auth()->user()->email, 'User ID'=>auth()->id(), 'Daftar Pada'=>auth()->user()->created_at->format('d/m/Y')] as $label => $value)
            <div class="flex items-start justify-between py-3">
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">{{ $label }}</p>
                <p class="text-sm font-semibold text-gray-900 text-right max-w-[60%] break-all">{{ $value }}</p>
            </div>
            @endforeach
        </div>
    </div>

    <div class="card">
        <h2 class="text-base font-semibold text-gray-900 mb-4">Akaun Shopee</h2>
        @if($accounts->isEmpty())
        <p class="text-sm text-gray-400">Tiada akaun Shopee disambungkan.</p>
        @else
        <div class="space-y-3">
            @foreach($accounts as $a)
            <div class="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl">
                <div>
                    <p class="text-sm font-semibold text-gray-900">{{ $a->shop_name }}</p>
                    <p class="text-xs text-gray-400">Shop ID: {{ $a->shop_id }}</p>
                </div>
                <div class="text-right">
                    <p class="text-xs text-gray-400">Token tamat</p>
                    <p class="text-xs font-semibold text-gray-600">{{ $a->token_expires_at->format('d/m/Y') }}</p>
                </div>
            </div>
            @endforeach
        </div>
        @endif
        <a href="{{ route('connect-shopee') }}" class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8]">Urus Sambungan →</a>
    </div>

    <div class="card">
        <h2 class="text-base font-semibold text-gray-900 mb-1">Konfigurasi API</h2>
        <p class="text-sm text-gray-400 mb-4">Diuruskan melalui pemboleh ubah persekitaran pelayan.</p>
        <div>
            @foreach(['SHOPEE_PARTNER_ID','SHOPEE_PARTNER_KEY','SHOPEE_REDIRECT_URL','OPENAI_API_KEY','DB_DATABASE'] as $k)
            <div class="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <span class="text-sm text-gray-600">{{ $k }}</span>
                <span class="text-xs font-mono bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg text-gray-400">env var</span>
            </div>
            @endforeach
        </div>
    </div>
</div>
@endsection
