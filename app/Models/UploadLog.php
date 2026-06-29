<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UploadLog extends Model
{
    protected $fillable = ['product_id', 'status', 'shopee_response', 'error_message'];

    protected $casts = ['shopee_response' => 'array'];
}
