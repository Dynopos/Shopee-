@extends('layouts.app')

@section('title', 'Muat Naik')
@section('page-title', 'Muat Naik Gambar Produk')
@section('page-subtitle', 'Muat naik gambar produk, AI akan jana listing lengkap')

@section('content')
<div class="max-w-xl" x-data="uploadForm()">
    @if($errors->any())
    <div class="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{{ $errors->first() }}</div>
    @endif

    <form method="POST" action="{{ route('upload.store') }}" enctype="multipart/form-data" @submit="loading = true">
        @csrf
        <div
            class="border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors"
            :class="preview ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-blue-300 bg-white'"
            @click="$refs.fileInput.click()"
            @dragover.prevent
            @drop.prevent="handleDrop($event)"
        >
            <input type="file" name="image" accept="image/*" x-ref="fileInput" class="hidden"
                   @change="handleFile($event.target.files[0])">

            <template x-if="!preview">
                <div>
                    <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="1.5" class="w-7 h-7"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    </div>
                    <p class="font-semibold text-gray-700">Seret & lepas atau klik untuk muat naik</p>
                    <p class="text-sm text-gray-400 mt-1">JPG, PNG, WebP — maks 10 MB</p>
                </div>
            </template>
            <template x-if="preview">
                <div class="space-y-3">
                    <img :src="preview" class="max-h-60 mx-auto rounded-xl object-contain">
                    <p class="text-sm text-gray-500" x-text="fileName"></p>
                    <p class="text-xs text-gray-400">Klik atau seret untuk ganti</p>
                </div>
            </template>
        </div>

        <button type="submit" :disabled="!preview || loading"
            class="mt-6 w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            <template x-if="loading">
                <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            </template>
            <span x-text="loading ? 'AI sedang menganalisis gambar…' : 'Jana Listing AI'"></span>
        </button>
    </form>
</div>

<script>
function uploadForm() {
    return {
        preview: null, fileName: '', loading: false,
        handleFile(file) {
            if (!file || !file.type.startsWith('image/')) return;
            this.fileName = file.name + ' · ' + (file.size/1024).toFixed(0) + ' KB';
            const reader = new FileReader();
            reader.onload = e => this.preview = e.target.result;
            reader.readAsDataURL(file);
        },
        handleDrop(e) {
            const file = e.dataTransfer.files[0];
            if (file) { this.$refs.fileInput.files = e.dataTransfer.files; this.handleFile(file); }
        },
    };
}
</script>
@endsection
