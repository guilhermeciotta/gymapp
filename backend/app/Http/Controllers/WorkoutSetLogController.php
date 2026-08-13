<?php

namespace App\Http\Controllers;

use App\Models\WorkoutSessionExercise;
use App\Models\WorkoutSetLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkoutSetLogController extends Controller
{
    public function store(Request $request, WorkoutSessionExercise $sessionExercise): JsonResponse
    {
        $this->authorize('update', $sessionExercise->session);

        $data = $request->validate([
            'weight_kg' => 'nullable|numeric|min:0',
            'reps' => 'nullable|integer|min:0',
        ]);

        $set = $sessionExercise->sets()->create([
            'set_number' => $sessionExercise->sets()->count() + 1,
            'weight_kg' => $data['weight_kg'] ?? null,
            'reps' => $data['reps'] ?? null,
            'completed_at' => now(),
        ]);

        return response()->json($set, 201);
    }

    public function update(Request $request, WorkoutSetLog $set): JsonResponse
    {
        $this->authorize('update', $set->sessionExercise->session);

        $data = $request->validate([
            'weight_kg' => 'sometimes|nullable|numeric|min:0',
            'reps' => 'sometimes|nullable|integer|min:0',
        ]);

        $set->update($data);

        return response()->json($set);
    }

    public function destroy(Request $request, WorkoutSetLog $set): JsonResponse
    {
        $this->authorize('delete', $set->sessionExercise->session);

        $set->delete();

        return response()->json(null, 204);
    }
}
