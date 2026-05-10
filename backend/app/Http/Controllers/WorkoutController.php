<?php

namespace App\Http\Controllers;

use App\Models\Workout;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkoutController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $workouts = $request->user()
            ->workouts()
            ->with('days.exercises')
            ->latest()
            ->get();

        return response()->json($workouts);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'objective' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'days' => 'nullable|array',
            'days.*.name' => 'required|string|max:255',
            'days.*.order' => 'nullable|integer',
            'days.*.exercises' => 'nullable|array',
            'days.*.exercises.*.name' => 'required|string|max:255',
            'days.*.exercises.*.sets' => 'nullable|integer',
            'days.*.exercises.*.reps' => 'nullable|string|max:50',
            'days.*.exercises.*.rest_seconds' => 'nullable|integer',
            'days.*.exercises.*.notes' => 'nullable|string',
            'days.*.exercises.*.order' => 'nullable|integer',
        ]);

        $workout = $request->user()->workouts()->create([
            'name' => $data['name'],
            'objective' => $data['objective'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        foreach ($data['days'] ?? [] as $dayData) {
            $day = $workout->days()->create([
                'name' => $dayData['name'],
                'order' => $dayData['order'] ?? 0,
            ]);

            foreach ($dayData['exercises'] ?? [] as $exerciseData) {
                $day->exercises()->create([
                    'name' => $exerciseData['name'],
                    'sets' => $exerciseData['sets'] ?? null,
                    'reps' => $exerciseData['reps'] ?? null,
                    'rest_seconds' => $exerciseData['rest_seconds'] ?? null,
                    'notes' => $exerciseData['notes'] ?? null,
                    'order' => $exerciseData['order'] ?? 0,
                ]);
            }
        }

        return response()->json($workout->load('days.exercises'), 201);
    }

    public function show(Request $request, Workout $workout): JsonResponse
    {
        $this->authorize('view', $workout);

        return response()->json($workout->load('days.exercises'));
    }

    public function update(Request $request, Workout $workout): JsonResponse
    {
        $this->authorize('update', $workout);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'objective' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $workout->update($data);

        return response()->json($workout->load('days.exercises'));
    }

    public function destroy(Request $request, Workout $workout): JsonResponse
    {
        $this->authorize('delete', $workout);

        $workout->delete();

        return response()->json(null, 204);
    }
}
