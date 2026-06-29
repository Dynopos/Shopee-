<!DOCTYPE html>
<html lang="ms">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $mode === 'register' ? 'Daftar' : 'Log Masuk' }} — Shopee AI</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body style="background:linear-gradient(135deg,#7F1D1D 0%,#1E3A5F 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1rem">
<div class="w-full max-w-sm">
    <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 text-white text-2xl font-bold mb-4">S</div>
        <h1 class="text-2xl font-bold text-white">Shopee AI Listing</h1>
        <p class="text-white/60 mt-1 text-sm">Jana listing produk dengan kuasa AI</p>
    </div>

    <div class="bg-white rounded-2xl shadow-xl p-7">
        <h2 class="text-lg font-bold text-gray-900 mb-5">{{ $mode === 'register' ? 'Daftar Akaun' : 'Log Masuk' }}</h2>

        @if($errors->any())
            <div class="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{{ $errors->first() }}</div>
        @endif

        <form method="POST" action="{{ $mode === 'register' ? '/register' : '/login' }}" class="space-y-4">
            @csrf
            @if($mode === 'register')
            <div>
                <label class="form-label">Nama</label>
                <input type="text" name="name" value="{{ old('name') }}" required class="form-input" placeholder="Nama penuh">
            </div>
            @endif
            <div>
                <label class="form-label">Emel</label>
                <input type="email" name="email" value="{{ old('email') }}" required class="form-input" placeholder="anda@contoh.com">
            </div>
            <div>
                <label class="form-label">Kata Laluan</label>
                <input type="password" name="password" required minlength="8" class="form-input" placeholder="••••••••">
            </div>
            @if($mode === 'register')
            <div>
                <label class="form-label">Sahkan Kata Laluan</label>
                <input type="password" name="password_confirmation" required class="form-input" placeholder="••••••••">
            </div>
            @endif
            <button type="submit" class="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-xl transition-colors text-sm">
                {{ $mode === 'register' ? 'Daftar Akaun' : 'Log Masuk' }}
            </button>
        </form>

        <p class="mt-5 text-center text-sm text-gray-400">
            @if($mode === 'register')
                Sudah ada akaun? <a href="/login" class="text-[#DC2626] font-semibold hover:underline">Log Masuk</a>
            @else
                Belum ada akaun? <a href="/register" class="text-[#DC2626] font-semibold hover:underline">Daftar</a>
            @endif
        </p>
    </div>
</div>
</body>
</html>
