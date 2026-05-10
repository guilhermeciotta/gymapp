<?php

namespace App\Services;

use App\Models\Conversation;
use OpenAI\Laravel\Facades\OpenAI;

class OpenAIService
{
    private const SYSTEM_PROMPT = <<<PROMPT
Você é um personal trainer especialista e nutricionista. Ajude o usuário a montar o treino ideal para a academia, levando em conta:
- Objetivo (hipertrofia, emagrecimento, resistência, etc.)
- Nível de experiência (iniciante, intermediário, avançado)
- Dias disponíveis por semana
- Equipamentos disponíveis
- Qualquer limitação física

Ao finalizar a montagem de um treino completo, inclua no final da sua resposta um bloco JSON com a estrutura abaixo, entre as tags ===WORKOUT_JSON_START=== e ===WORKOUT_JSON_END===:

===WORKOUT_JSON_START===
{
  "name": "Nome do treino",
  "objective": "Objetivo principal",
  "days": [
    {
      "name": "Segunda-feira - Peito e Tríceps",
      "order": 1,
      "exercises": [
        {
          "name": "Supino Reto",
          "sets": 4,
          "reps": "8-12",
          "rest_seconds": 90,
          "notes": "Pegada na largura dos ombros",
          "order": 1
        }
      ]
    }
  ]
}
===WORKOUT_JSON_END===

Responda sempre em português do Brasil de forma amigável e motivadora.
PROMPT;

    public function streamChat(Conversation $conversation): \Generator
    {
        $history = $conversation->messages()
            ->orderBy('created_at')
            ->get()
            ->map(fn($m) => ['role' => $m->role, 'content' => $m->content])
            ->toArray();

        $stream = OpenAI::chat()->createStreamed([
            'model' => 'gpt-4o',
            'messages' => array_merge(
                [['role' => 'system', 'content' => self::SYSTEM_PROMPT]],
                $history
            ),
            'max_tokens' => 4096,
            'temperature' => 0.7,
        ]);

        $fullContent = '';

        foreach ($stream as $chunk) {
            $delta = $chunk->choices[0]->delta->content ?? '';
            if ($delta !== '') {
                $fullContent .= $delta;
                yield $delta;
            }
        }

        $conversation->messages()->create([
            'role' => 'assistant',
            'content' => $fullContent,
        ]);
    }

    public static function extractWorkoutJson(string $content): ?array
    {
        if (!str_contains($content, '===WORKOUT_JSON_START===')) {
            return null;
        }

        preg_match('/===WORKOUT_JSON_START===\s*(.*?)\s*===WORKOUT_JSON_END===/s', $content, $matches);

        if (empty($matches[1])) {
            return null;
        }

        $decoded = json_decode($matches[1], true);
        return is_array($decoded) ? $decoded : null;
    }
}
