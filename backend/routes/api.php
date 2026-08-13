<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExerciseController;
use App\Http\Controllers\WorkoutController;
use App\Http\Controllers\WorkoutDayController;
use App\Http\Controllers\WorkoutSessionController;
use App\Http\Controllers\WorkoutSetLogController;
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

    // Sessões de treino
    Route::post('/workout-days/{day}/sessions', [WorkoutSessionController::class, 'store']);
    Route::get('/sessions', [WorkoutSessionController::class, 'index']);
    Route::get('/sessions/active', [WorkoutSessionController::class, 'active']);
    Route::get('/sessions/{session}', [WorkoutSessionController::class, 'show']);
    Route::post('/sessions/{session}/finish', [WorkoutSessionController::class, 'finish']);
    Route::delete('/sessions/{session}', [WorkoutSessionController::class, 'destroy']);
    Route::post('/session-exercises/{sessionExercise}/sets', [WorkoutSetLogController::class, 'store']);
    Route::put('/sets/{set}', [WorkoutSetLogController::class, 'update']);
    Route::delete('/sets/{set}', [WorkoutSetLogController::class, 'destroy']);

    // Dashboard
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/dashboard/exercise-progress', [DashboardController::class, 'exerciseProgress']);

    // Chat
    Route::get('/conversations', [ChatController::class, 'indexConversations']);
    Route::post('/conversations', [ChatController::class, 'storeConversation']);
    Route::delete('/conversations/{conversation}', [ChatController::class, 'destroyConversation']);
    Route::get('/conversations/{conversation}/messages', [ChatController::class, 'showMessages']);
    Route::post('/conversations/{conversation}/messages', [ChatController::class, 'sendMessage']);
    Route::post('/conversations/{conversation}/save-workout', [ChatController::class, 'saveWorkout']);
});
