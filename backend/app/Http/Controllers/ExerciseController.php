<?php

namespace App\Http\Controllers;

use App\Models\Exercise;
use App\Models\WorkoutDay;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExerciseController extends Controller
{
    public function store(Request $request, WorkoutDay $day): JsonResponse
    {
        $this->authorize('update', $day->workout);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'sets' => 'nullable|integer',
            'reps' => 'nullable|string|max:50',
            'rest_seconds' => 'nullable|integer',
            'notes' => 'nullable|string',
            'order' => 'nullable|integer',
        ]);

        $exercise = $day->exercises()->create($data);

        return response()->json($exercise, 201);
    }

    public function update(Request $request, Exercise $exercise): JsonResponse
    {
        $this->authorize('update', $exercise->day->workout);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'sets' => 'nullable|integer',
            'reps' => 'nullable|string|max:50',
            'rest_seconds' => 'nullable|integer',
            'notes' => 'nullable|string',
            'order' => 'nullable|integer',
        ]);

        $exercise->update($data);

        return response()->json($exercise);
    }

    public function destroy(Exercise $exercise): JsonResponse
    {
        $this->authorize('update', $exercise->day->workout);

        $exercise->delete();

        return response()->json(null, 204);
    }
}
