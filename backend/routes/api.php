<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AnalysisController;

Route::post('/analyze', [AnalysisController::class, 'analyze']);
Route::get('/analyses/{analysis}', [AnalysisController::class, 'show']);

Route::get('/hello', function () {
    return response()->json([
        'message' => 'Hello from Laravel!'
    ]);
});