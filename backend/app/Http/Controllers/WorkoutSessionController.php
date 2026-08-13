<?php

namespace App\Http\Controllers;

use App\Models\WorkoutDay;
use App\Models\WorkoutSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkoutSessionController extends Controller
{
    public function store(Request $request, WorkoutDay $day): JsonResponse
    {
        $this->authorize('update', $day->workout);

        $existing = $request->user()
            ->workoutSessions()
            ->where('workout_day_id', $day->id)
            ->where('status', 'in_progress')
            ->first();

        if ($existing) {
            return response()->json($existing->load('exercises.sets'));
        }

        $session = $request->user()->workoutSessions()->create([
            'workout_id' => $day->workout_id,
            'workout_day_id' => $day->id,
            'workout_name' => $day->workout->name,
            'day_name' => $day->name,
            'started_at' => now(),
            'status' => 'in_progress',
        ]);

        foreach ($day->exercises as $exercise) {
            $session->exercises()->create([
                'exercise_id' => $exercise->id,
                'name' => $exercise->name,
                'target_sets' => $exercise->sets,
                'target_reps' => $exercise->reps,
                'rest_seconds' => $exercise->rest_seconds,
                'order' => $exercise->order,
            ]);
        }

        return response()->json($session->load('exercises.sets'), 201);
    }

    public function index(Request $request): JsonResponse
    {
        $sessions = $request->user()
            ->workoutSessions()
            ->latest('started_at')
            ->get(['id', 'workout_name', 'day_name', 'started_at', 'finished_at', 'status']);

        return response()->json($sessions);
    }

    public function active(Request $request): JsonResponse
    {
        $session = $request->user()
            ->workoutSessions()
            ->where('workout_day_id', $request->query('day_id'))
            ->where('status', 'in_progress')
            ->with('exercises.sets')
            ->first();

        return response()->json($session);
    }

    public function show(Request $request, WorkoutSession $session): JsonResponse
    {
        $this->authorize('view', $session);

        return response()->json($session->load('exercises.sets'));
    }

    public function finish(Request $request, WorkoutSession $session): JsonResponse
    {
        $this->authorize('update', $session);

        $session->update([
            'finished_at' => now(),
            'status' => 'completed',
        ]);

        return response()->json($session->load('exercises.sets'));
    }

    public function destroy(Request $request, WorkoutSession $session): JsonResponse
    {
        $this->authorize('delete', $session);

        $session->delete();

        return response()->json(null, 204);
    }
}
