<?php

use App\Http\Controllers\AnalysisController;
use Illuminate\Support\Facades\Route;

Route::post('/analyze', [AnalysisController::class, 'analyze']);
Route::get('/analyses/{analysis}', [AnalysisController::class, 'show']);
