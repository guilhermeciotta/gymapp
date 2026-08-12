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
            'dia_semana' => 'nullable|in:domingo,segunda,terca,quarta,quinta,sexta,sabado',
        ]);

        $data['dia_semana'] = $data['dia_semana'] ?? WorkoutDay::parseDiaSemanaFromName($data['name']);

        $day = $workout->days()->create($data);

        return response()->json($day->load('exercises'), 201);
    }

    public function update(Request $request, WorkoutDay $day): JsonResponse
    {
        $this->authorize('update', $day->workout);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'order' => 'nullable|integer',
            'dia_semana' => 'nullable|in:domingo,segunda,terca,quarta,quinta,sexta,sabado',
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
