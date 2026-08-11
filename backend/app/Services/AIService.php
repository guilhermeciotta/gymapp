<?php

namespace App\Services;

use App\Models\Conversation;
use GuzzleHttp\Client;

class AIService
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

    private Client $http;

    public function __construct()
    {
        $this->http = new Client();
    }

    public function streamChat(Conversation $conversation): \Generator
    {
        $contents = $conversation->messages()
            ->orderBy('created_at')
            ->get()
            ->map(fn($m) => [
                'role' => $m->role === 'assistant' ? 'model' : 'user',
                'parts' => [['text' => $m->content]],
            ])
            ->toArray();

        $model = config('services.ai.model');

        $response = $this->http->post(
            "https://generativelanguage.googleapis.com/v1beta/models/{$model}:streamGenerateContent",
            [
                'query' => [
                    'key' => config('services.ai.key'),
                    'alt' => 'sse',
                ],
                'json' => [
                    'contents' => $contents,
                    'systemInstruction' => ['parts' => [['text' => self::SYSTEM_PROMPT]]],
                    'generationConfig' => ['maxOutputTokens' => 4096],
                ],
                'stream' => true,
            ]
        );

        $fullContent = '';
        $body = $response->getBody();
        $buffer = '';

        while (!$body->eof()) {
            $buffer .= $body->read(1024);

            while (($newlinePos = strpos($buffer, "\n")) !== false) {
                $line = trim(substr($buffer, 0, $newlinePos));
                $buffer = substr($buffer, $newlinePos + 1);

                if (!str_starts_with($line, 'data: ')) {
                    continue;
                }

                $chunk = json_decode(substr($line, 6), true);
                $text = $chunk['candidates'][0]['content']['parts'][0]['text'] ?? null;

                if ($text !== null) {
                    $fullContent .= $text;
                    yield $text;
                }
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
