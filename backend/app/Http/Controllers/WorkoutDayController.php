<?php

namespace App\Http\Controllers;

use App\Models\Workout;
use App\Models\WorkoutDay;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkoutDayController extends Controller
{
    public function store(Request $request, Workout $workout): JsonResponse
    {
        $this->authorize('update', $workout);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'order' => 'nullable|integer',
        ]);

        $day = $workout->days()->create($data);

        return response()->json($day->load('exercises'), 201);
    }

    public function update(Request $request, WorkoutDay $day): JsonResponse
    {
        $this->authorize('update', $day->workout);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'order' => 'nullable|integer',
        ]);

        $day->update($data);

        return response()->json($day->load('exercises'));
    }

    public function destroy(WorkoutDay $day): JsonResponse
    {
        $this->authorize('update', $day->workout);

        $day->delete();

        return response()->json(null, 204);
    }
}
