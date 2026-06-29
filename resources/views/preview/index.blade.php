@extends('layouts.app')

@section('title', 'Pratonton Listing')
@section('page-title', 'Semak & Edit Listing')
@section('page-subtitle', 'Jana oleh AI — semak sebelum muat naik')

@section('content')
@if(session('success_item_id'))
<div class="flex items-center justify-center min-h-[60vh]">
    <div class="text-center max-w-sm">
        <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <svg class="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Produk Berjaya Dimuat Naik!</h2>
        <p class="text-gray-400 text-sm mb-1">Shopee Item ID:</p>
        <p class="font-mono font-bold text-gray-900 text-lg mb-8">{{ session('success_item_id') }}</p>
        <div class="flex flex-col gap-3">
            <a href="{{ route('upload') }}" class="px-6 py-3 bg-[#2563EB] text-white rounded-xl hover:bg-[#1D4ED8] transition-colors font-semibold text-center">Hantar Produk Lain</a>
            <a href="{{ route('dashboard') }}" class="btn-outline justify-center">Kembali ke Dashboard</a>
        </div>
    </div>
</div>
@else
@if($errors->any())
<div class="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold">{{ $errors->first('upload') }}</div>
@endif

<form method="POST" action="{{ route('preview.upload') }}">
    @csrf
    <input type="hidden" name="product_id" value="{{ $draft['product_id'] ?? '' }}">

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div class="space-y-4">
            @if(!empty($draft['image_url']))
            <div class="bg-white rounded-2xl border border-gray-100 p-3">
                <img src="{{ $draft['image_url'] }}" class="w-full rounded-xl object-contain max-h-56">
            </div>
            @endif
            <div class="card space-y-4">
                <div><label class="form-label">Harga (MYR)</label><input type="number" name="price" step="0.01" value="{{ old('price', $draft['suggested_price'] ?? 0) }}" class="form-input"></div>
                <div><label class="form-label">Stok</label><input type="number" name="stock" value="{{ old('stock', $draft['stock_quantity'] ?? 0) }}" class="form-input"></div>
                <div><label class="form-label">Kategori</label><input type="text" name="category" value="{{ old('category', $draft['category'] ?? '') }}" class="form-input"></div>
            </div>
        </div>

        <div class="lg:col-span-2 space-y-4">
            <div class="card">
                <label class="form-label">Tajuk Produk ({{ strlen($draft['title'] ?? '') }}/120)</label>
                <input type="text" name="title" maxlength="120" value="{{ old('title', $draft['title'] ?? '') }}" class="form-input">
            </div>
            <div class="card">
                <label class="form-label">Penerangan</label>
                <textarea name="description" rows="5" class="form-input resize-none">{{ old('description', $draft['description'] ?? '') }}</textarea>
            </div>
            <div class="card">
                <label class="form-label">Kata Kunci SEO</label>
                <div class="flex flex-wrap gap-2 mt-2">
                    @foreach($draft['keywords'] ?? [] as $kw)
                    <span class="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{{ $kw }}</span>
                    @endforeach
                </div>
                <input type="hidden" name="keywords" value="{{ json_encode($draft['keywords'] ?? []) }}">
            </div>
            <div class="card">
                <label class="form-label">Keistimewaan Produk</label>
                <ul class="space-y-2 mt-2">
                    @foreach($draft['highlights'] ?? [] as $h)
                    <li class="flex items-center gap-2"><span class="text-green-500 text-xs font-bold">✓</span><input type="text" name="highlights[]" value="{{ $h }}" class="flex-1 form-input"></li>
                    @endforeach
                </ul>
            </div>
        </div>
    </div>

    <div class="mt-8 flex items-center justify-between">
        <p class="text-sm text-gray-400">Semak semua maklumat sebelum muat naik.</p>
        <button type="submit" class="btn-blue px-6 py-3">Muat Naik ke Shopee</button>
    </div>
</form>
@endif
@endsection
