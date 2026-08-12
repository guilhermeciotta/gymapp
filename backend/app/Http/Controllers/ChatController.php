<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\WorkoutDay;
use App\Services\AIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ChatController extends Controller
{
    public function __construct(private AIService $ai) {}

    public function indexConversations(Request $request): JsonResponse
    {
        $conversations = $request->user()
            ->conversations()
            ->latest()
            ->get(['id', 'title', 'created_at']);

        return response()->json($conversations);
    }

    public function storeConversation(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => 'nullable|string|max:255',
        ]);

        $conversation = $request->user()->conversations()->create([
            'title' => $data['title'] ?? 'Nova conversa',
        ]);

        $conversation->messages()->create([
            'role' => 'assistant',
            'content' => 'Vamos começar?',
        ]);

        return response()->json($conversation, 201);
    }

    public function destroyConversation(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('delete', $conversation);

        $conversation->delete();

        return response()->json(null, 204);
    }

    public function showMessages(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('view', $conversation);

        return response()->json($conversation->messages);
    }

    public function sendMessage(Request $request, Conversation $conversation): StreamedResponse
    {
        $this->authorize('view', $conversation);

        $request->validate([
            'content' => 'required|string|max:4000',
        ]);

        if ($conversation->title === 'Nova conversa' && $conversation->messages()->where('role', 'user')->doesntExist()) {
            $conversation->update(['title' => Str::limit($request->content, 40)]);
        }

        $conversation->messages()->create([
            'role' => 'user',
            'content' => $request->content,
        ]);

        return response()->stream(function () use ($conversation) {
            foreach ($this->ai->streamChat($conversation) as $token) {
                echo "data: " . json_encode(['token' => $token]) . "\n\n";
                if (ob_get_level() > 0) {
                    ob_flush();
                }
                flush();
            }
            echo "data: [DONE]\n\n";
            if (ob_get_level() > 0) {
                ob_flush();
            }
            flush();
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    public function saveWorkout(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('view', $conversation);

        $lastAssistantMessage = $conversation->messages()
            ->where('role', 'assistant')
            ->reorder('created_at', 'desc')
            ->first();

        if (!$lastAssistantMessage) {
            return response()->json(['message' => 'Nenhuma resposta da AI encontrada.'], 422);
        }

        $workoutData = AIService::extractWorkoutJson($lastAssistantMessage->content);

        if (!$workoutData) {
            return response()->json(['message' => 'Nenhum treino estruturado encontrado na conversa.'], 422);
        }

        $workout = $request->user()->workouts()->create([
            'name' => $workoutData['name'],
            'objective' => $workoutData['objective'] ?? null,
        ]);

        foreach ($workoutData['days'] ?? [] as $index => $dayData) {
            $day = $workout->days()->create([
                'name' => $dayData['name'],
                'order' => $dayData['order'] ?? $index,
                'dia_semana' => $dayData['dia_semana'] ?? WorkoutDay::parseDiaSemanaFromName($dayData['name']),
            ]);

            foreach ($dayData['exercises'] ?? [] as $exIndex => $exerciseData) {
                $day->exercises()->create([
                    'name' => $exerciseData['name'],
                    'sets' => $exerciseData['sets'] ?? null,
                    'reps' => $exerciseData['reps'] ?? null,
                    'rest_seconds' => $exerciseData['rest_seconds'] ?? null,
                    'notes' => $exerciseData['notes'] ?? null,
                    'order' => $exerciseData['order'] ?? $exIndex,
                ]);
            }
        }

        return response()->json($workout->load('days.exercises'), 201);
    }
}
