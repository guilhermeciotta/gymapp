<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ExerciseController;
use App\Http\Controllers\WorkoutController;
use App\Http\Controllers\WorkoutDayController;
use Illuminate\Support\Facades\Route;

// Rotas públicas
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Rotas protegidas
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Treinos
    Route::apiResource('workouts', WorkoutController::class);
    Route::post('/workouts/{workout}/days', [WorkoutDayController::class, 'store']);
    Route::put('/days/{day}', [WorkoutDayController::class, 'update']);
    Route::delete('/days/{day}', [WorkoutDayController::class, 'destroy']);
    Route::post('/days/{day}/exercises', [ExerciseController::class, 'store']);
    Route::put('/exercises/{exercise}', [ExerciseController::class, 'update']);
    Route::delete('/exercises/{exercise}', [ExerciseController::class, 'destroy']);

    // Chat
    Route::get('/conversations', [ChatController::class, 'indexConversations']);
    Route::post('/conversations', [ChatController::class, 'storeConversation']);
    Route::get('/conversations/{conversation}/messages', [ChatController::class, 'showMessages']);
    Route::post('/conversations/{conversation}/messages', [ChatController::class, 'sendMessage']);
    Route::post('/conversations/{conversation}/save-workout', [ChatController::class, 'saveWorkout']);
});
