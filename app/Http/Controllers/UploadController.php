<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Services\OpenAiService;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    public function index()
    {
        return view('upload.index');
    }

    public function store(Request $request, OpenAiService $ai)
    {
        $request->validate([
            'image' => 'required|image|max:10240',
        ]);

        $file     = $request->file('image');
        $path     = $file->store('product-images', 'public');
        $base64   = base64_encode(file_get_contents($file->getRealPath()));
        $mime     = $file->getMimeType();

        $listing  = $ai->generateListing($base64, $mime);

        $product  = Product::create([
            'user_id'     => auth()->id(),
            'title'       => $listing['title'] ?? '',
            'description' => $listing['description'] ?? '',
            'price'       => $listing['suggested_price'] ?? 0,
            'stock'       => $listing['stock_quantity'] ?? 0,
            'category'    => $listing['category'] ?? '',
            'keywords'    => $listing['keywords'] ?? [],
            'highlights'  => $listing['highlights'] ?? [],
            'image_url'   => Storage::url($path),
            'status'      => 'draft',
        ]);

        session(['listing_draft' => array_merge($listing, [
            'product_id' => $product->id,
            'image_url'  => Storage::url($path),
            'image_path' => storage_path('app/public/' . $path),
        ])]);

        return redirect()->route('preview');
    }
}
