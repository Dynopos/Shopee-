<!DOCTYPE html>
<html lang="ms">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Shopee AI Listing')</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="bg-slate-100">
<div class="flex h-screen overflow-hidden">

    {{-- Sidebar --}}
    <aside class="sidebar w-[220px] flex-shrink-0 flex flex-col h-screen">
        <div class="px-5 py-6 border-b border-white/10">
            <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-sm">S</div>
                <div>
                    <p class="text-white font-bold text-sm leading-tight">Shopee AI</p>
                    <p class="text-white/50 text-[10px]">Listing Assistant</p>
                </div>
            </div>
        </div>

        <nav class="flex-1 px-3 py-4 space-y-0.5">
            @php
                $nav = [
                    ['label'=>'Dashboard',       'route'=>'dashboard',      'icon'=>'grid'],
                    ['label'=>'Muat Naik',        'route'=>'upload',         'icon'=>'upload'],
                    ['label'=>'Sambung Shopee',   'route'=>'connect-shopee', 'icon'=>'link'],
                    ['label'=>'Tetapan',          'route'=>'settings',       'icon'=>'cog'],
                ];
            @endphp
            @foreach($nav as $item)
                <a href="{{ route($item['route']) }}"
                   class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                          {{ request()->routeIs($item['route']) ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10' }}">
                    @if($item['icon']==='grid')
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                    @elseif($item['icon']==='upload')
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 8l-4-4-4 4M12 4v12"/></svg>
                    @elseif($item['icon']==='link')
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.1-1.1m-.757-4.9a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                    @elseif($item['icon']==='cog')
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    @endif
                    {{ $item['label'] }}
                </a>
            @endforeach
        </nav>

        <div class="px-3 py-4 border-t border-white/10">
            <form method="POST" action="{{ route('logout') }}">
                @csrf
                <button type="submit" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                    Log Keluar
                </button>
            </form>
        </div>
    </aside>

    {{-- Main content --}}
    <div class="flex-1 overflow-y-auto flex flex-col">
        <div class="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
            <div>
                <h1 class="text-lg font-bold text-gray-900">@yield('page-title')</h1>
                <p class="text-xs text-gray-400">@yield('page-subtitle')</p>
            </div>
            @yield('topbar-action')
        </div>
        <main class="flex-1 p-8">
            @yield('content')
        </main>
    </div>
</div>
</body>
</html>
