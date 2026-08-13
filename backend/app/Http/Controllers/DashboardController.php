<?php

namespace App\Http\Controllers;

use App\Models\WorkoutSessionExercise;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();

        $totalCompleted = $user->workoutSessions()->where('status', 'completed')->count();

        $sessionsThisWeek = $user->workoutSessions()
            ->where('status', 'completed')
            ->whereBetween('started_at', [now()->startOfWeek(), now()->endOfWeek()])
            ->count();

        $dates = $user->workoutSessions()
            ->where('status', 'completed')
            ->selectRaw('DISTINCT DATE(started_at) as d')
            ->orderByDesc('d')
            ->pluck('d')
            ->map(fn ($d) => (string) $d)
            ->all();

        $streakDays = 0;
        $cursor = now()->startOfDay();
        if (! in_array($cursor->toDateString(), $dates, true)) {
            $cursor = $cursor->subDay();
        }
        while (in_array($cursor->toDateString(), $dates, true)) {
            $streakDays++;
            $cursor = $cursor->subDay();
        }

        $lastSession = $user->workoutSessions()
            ->where('status', 'completed')
            ->latest('finished_at')
            ->first(['id', 'workout_name', 'day_name', 'finished_at']);

        $exerciseNames = WorkoutSessionExercise::query()
            ->whereHas('session', fn ($q) => $q->where('user_id', $user->id))
            ->whereHas('sets')
            ->distinct()
            ->pluck('name');

        return response()->json([
            'total_completed' => $totalCompleted,
            'sessions_this_week' => $sessionsThisWeek,
            'streak_days' => $streakDays,
            'last_session' => $lastSession,
            'exercise_names' => $exerciseNames,
        ]);
    }

    public function exerciseProgress(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string',
        ]);

        $rows = DB::table('workout_set_logs as wsl')
            ->join('workout_session_exercises as wse', 'wse.id', '=', 'wsl.workout_session_exercise_id')
            ->join('workout_sessions as ws', 'ws.id', '=', 'wse.workout_session_id')
            ->where('ws.user_id', $request->user()->id)
            ->where('ws.status', 'completed')
            ->whereRaw('LOWER(wse.name) = ?', [strtolower($data['name'])])
            ->whereNotNull('wsl.weight_kg')
            ->selectRaw('DATE(ws.started_at) as date, wsl.weight_kg as weight_kg, wsl.reps as reps')
            ->orderBy('date')
            ->orderByDesc('wsl.weight_kg')
            ->get();

        $grouped = [];
        foreach ($rows as $row) {
            $date = (string) $row->date;
            if (! isset($grouped[$date])) {
                $grouped[$date] = [
                    'date' => $date,
                    'weight_kg' => (float) $row->weight_kg,
                    'reps' => $row->reps !== null ? (int) $row->reps : null,
                ];
            }
        }

        return response()->json(array_values($grouped));
    }
}
