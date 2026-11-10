<?php

return [

    'gemini' => [
        'key' => env('GEMINI_API_KEY'),
        'model' => env('GEMINI_MODEL', 'gemini-3.6-flash'),
        'url' => env('GEMINI_API_URL', 'https://generativelanguage.googleapis.com/v1beta/models'),
    ],

];
