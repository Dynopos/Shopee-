@extends('layouts.app')

@section('title', 'Dashboard')
@section('page-title', 'Dashboard')
@section('page-subtitle', 'Selamat datang semula!')

@section('topbar-action')
<a href="{{ route('upload') }}" class="btn-blue">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
    Listing Baru
</a>
@endsection

@section('content')
{{-- Connect banner --}}
@if(!$shop)
<div class="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-between">
    <div>
        <p class="font-semibold text-amber-800 text-sm">Sambung akaun Shopee anda</p>
        <p class="text-xs text-amber-600 mt-0.5">Diperlukan sebelum produk boleh dimuat naik.</p>
    </div>
    <a href="{{ route('connect-shopee') }}" class="btn-blue text-xs">Sambung Sekarang</a>
</div>
@else
<div class="mb-6 p-4 rounded-2xl bg-green-50 border border-green-100 flex items-center gap-3">
    <div class="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
    <p class="text-sm text-green-700">Disambung ke <span class="font-semibold">{{ $shop->shop_name }}</span> <span class="text-green-500">(ID: {{ $shop->shop_id }})</span></p>
</div>
@endif

{{-- Stat cards --}}
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    @foreach([
        ['label'=>'Jumlah Produk', 'value'=>$stats['total'],  'from'=>'#9B1C1C', 'to'=>'#DC2626'],
        ['label'=>'Aktif (Live)',  'value'=>$stats['live'],   'from'=>'#2563EB', 'to'=>'#1D4ED8'],
        ['label'=>'Draf',         'value'=>$stats['draft'],  'from'=>'#0F172A', 'to'=>'#1E293B'],
        ['label'=>'Gagal',        'value'=>$stats['failed'], 'from'=>'#6B7280', 'to'=>'#4B5563'],
    ] as $card)
    <div class="rounded-2xl p-5 flex flex-col justify-between min-h-[110px]" style="background:linear-gradient(135deg,{{ $card['from'] }},{{ $card['to'] }})">
        <p class="text-xs font-semibold text-white/70 uppercase tracking-wider">{{ $card['label'] }}</p>
        <p class="text-3xl font-bold text-white mt-2">{{ $card['value'] }}</p>
    </div>
    @endforeach
</div>

{{-- Products table --}}
<div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
        <h2 class="font-semibold text-gray-900 text-sm">Sejarah Listing Produk</h2>
        <span class="text-xs text-gray-400">{{ $stats['total'] }} produk</span>
    </div>
    @if($products->isEmpty())
    <div class="text-center py-16">
        <p class="text-gray-400 mb-4 text-sm">Tiada produk lagi.</p>
        <a href="{{ route('upload') }}" class="btn-blue">Muat Naik Produk Pertama</a>
    </div>
    @else
    <table class="w-full">
        <thead class="bg-gray-50">
            <tr>
                @foreach(['Nama Produk','Harga (MYR)','Status','Tarikh'] as $h)
                <th class="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{{ $h }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
            @foreach($products as $p)
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-5 py-3.5 text-sm font-medium text-gray-900 max-w-xs truncate">{{ $p->title }}</td>
                <td class="px-5 py-3.5 text-sm text-gray-600">{{ $p->price ? 'RM '.number_format($p->price,2) : '—' }}</td>
                <td class="px-5 py-3.5">
                    @php $map=['live'=>'bg-green-100 text-green-700','draft'=>'bg-yellow-100 text-yellow-700','uploading'=>'bg-blue-100 text-blue-700','failed'=>'bg-red-100 text-red-700']; $lbl=['live'=>'Aktif','draft'=>'Draf','uploading'=>'Memuat naik…','failed'=>'Gagal']; @endphp
                    <span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium {{ $map[$p->status] ?? 'bg-gray-100 text-gray-700' }}">{{ $lbl[$p->status] ?? $p->status }}</span>
                </td>
                <td class="px-5 py-3.5 text-sm text-gray-400">{{ $p->created_at->format('d/m/Y') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif
</div>
@endsection
