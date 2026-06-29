<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $fillable = [
        'user_id', 'title', 'description', 'price', 'stock',
        'category', 'keywords', 'highlights', 'image_url',
        'status', 'shopee_item_id',
    ];

    protected $casts = [
        'keywords'   => 'array',
        'highlights' => 'array',
        'price'      => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
