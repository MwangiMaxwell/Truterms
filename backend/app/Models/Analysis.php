<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Analysis extends Model
{
    protected $fillable = [
        'url',
        'domain',
        'title',
        'document_type',
        'overall_risk',
        'summary',
        'results',
    ];

    protected $casts = [
        'results' => 'array',
    ];
}