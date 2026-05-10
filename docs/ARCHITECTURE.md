# Arquitetura

---

## Visão geral

```
┌─────────────────────────────────────────────────────────────┐
│                          Cliente                            │
│                   React SPA (Vite + TS)                     │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP / SSE
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Nginx (porta 80)                        │
│   /            → serve frontend/dist (React build)          │
│   /api/*       → proxy para PHP-FPM (Laravel)               │
└───────────────────────────┬─────────────────────────────────┘
                            │ FastCGI
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Laravel 13 (PHP 8.3)                     │
│   Sanctum (autenticação por token)                          │
│   OpenAI Service (streaming GPT-4o)                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
              ┌─────────────┴──────────────┐
              ▼                            ▼
┌─────────────────────┐       ┌────────────────────────┐
│   PostgreSQL 16     │       │     OpenAI API          │
│   (banco principal) │       │     (GPT-4o)            │
└─────────────────────┘       └────────────────────────┘
```

---

## Camadas do backend

### Controllers

| Controller | Responsabilidade |
|---|---|
| `AuthController` | Registro, login, logout, retorno do usuário autenticado |
| `ChatController` | CRUD de conversas, envio de mensagens com streaming, salvamento de treino via IA |
| `WorkoutController` | CRUD completo de treinos |
| `WorkoutDayController` | Criação, atualização e remoção de dias de treino |
| `ExerciseController` | Criação, atualização e remoção de exercícios |

### Services

**`OpenAIService`**

Responsável por toda a integração com a OpenAI:

- `streamChat(Conversation)` — Busca o histórico da conversa, envia ao GPT-4o com streaming, salva a resposta completa ao final
- `extractWorkoutJson(string)` — Extrai o JSON estruturado do bloco `===WORKOUT_JSON_START===...===WORKOUT_JSON_END===` da resposta do assistente

O system prompt instrui o modelo a agir como personal trainer e nutricionista, e a sempre incluir o bloco JSON ao finalizar um plano completo.

### Policies

| Policy | Regra |
|---|---|
| `WorkoutPolicy` | `view`, `update`, `delete` — somente o dono do treino (`user_id`) |
| `ConversationPolicy` | `view` — somente o dono da conversa (`user_id`) |

---

## Banco de dados

### Schema

```
users
├── id
├── name
├── email (unique)
├── password (hashed bcrypt)
├── email_verified_at
├── remember_token
└── timestamps

workouts
├── id
├── user_id → users.id (cascade delete)
├── name
├── objective (nullable)
├── notes (nullable)
└── timestamps

workout_days
├── id
├── workout_id → workouts.id (cascade delete)
├── name
├── order (smallint, default 0)
└── timestamps

exercises
├── id
├── workout_day_id → workout_days.id (cascade delete)
├── name
├── sets (smallint, nullable)
├── reps (string, nullable — ex: "8-12")
├── rest_seconds (smallint, nullable)
├── notes (text, nullable)
├── order (smallint, default 0)
└── timestamps

conversations
├── id
├── user_id → users.id (cascade delete)
├── title (nullable)
└── timestamps

messages
├── id
├── conversation_id → conversations.id (cascade delete)
├── role (enum: 'user' | 'assistant')
├── content (text)
└── timestamps
```

### Relacionamentos

```
User
 ├── hasMany Workout
 │    └── hasMany WorkoutDay
 │         └── hasMany Exercise
 └── hasMany Conversation
      └── hasMany Message
```

Todas as deleções propagam em cascata: excluir um `Workout` remove seus `WorkoutDay`s e `Exercise`s. Excluir uma `Conversation` remove suas `Message`s.

---

## Fluxo de autenticação

```
1. POST /api/auth/register ou /api/auth/login
   └─ Laravel cria um Sanctum token (Personal Access Token)
   └─ Retorna { user, token }

2. Frontend armazena o token em localStorage

3. Axios interceptor adiciona automaticamente em cada request:
   Authorization: Bearer {token}

4. Em caso de resposta 401, o interceptor:
   └─ Remove o token do localStorage
   └─ Redireciona para /login

5. POST /api/auth/logout
   └─ Revoga apenas o token atual (currentAccessToken().delete())
```

---

## Fluxo do chat com IA

```
1. Usuário cria uma conversa: POST /api/conversations

2. Usuário envia mensagem: POST /api/conversations/{id}/messages
   └─ Backend salva a mensagem com role='user'
   └─ Busca histórico completo da conversa
   └─ Envia ao GPT-4o com streaming via openai-php/laravel
   └─ Retorna response com Content-Type: text/event-stream

3. Frontend consome o SSE token a token:
   data: {"token": "Oi"} → atualiza streamingContent em tempo real
   data: [DONE] → finaliza o streaming

4. Ao finalizar o streaming:
   └─ Backend salva a resposta completa com role='assistant'
   └─ Frontend refaz GET /api/conversations/{id}/messages

5. Se a resposta contiver ===WORKOUT_JSON_START===:
   └─ Frontend exibe banner "Salvar treino"

6. Usuário clica em "Salvar treino": POST /api/conversations/{id}/save-workout
   └─ Backend busca a última mensagem do assistente
   └─ Extrai o JSON via regex entre os marcadores
   └─ Cria Workout + WorkoutDays + Exercises no banco
   └─ Retorna o treino completo

7. Frontend exibe link para visualizar o treino salvo
```

---

## Estrutura do JSON de treino gerado pela IA

O GPT-4o é instruído a incluir o seguinte formato ao finalizar um plano:

```json
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
```

O backend extrai esse JSON via:
```php
preg_match('/===WORKOUT_JSON_START===\s*(.*?)\s*===WORKOUT_JSON_END===/s', $content, $matches)
```

O frontend filtra o bloco JSON antes de renderizar a mensagem via Markdown, exibindo apenas o texto legível ao usuário.

---

## Frontend

### Roteamento

```
/login          → Login.tsx         (público)
/register       → Register.tsx      (público)
/               → Dashboard.tsx     (privado)
/workouts/:id   → WorkoutDetail.tsx (privado)
/chat           → Chat.tsx          (privado, sem conversa selecionada)
/chat/:id       → Chat.tsx          (privado, conversa ativa)
*               → redireciona para /
```

Rotas privadas são protegidas pelo componente `PrivateRoute` que verifica o token no store Zustand.

### Estado global (Zustand — `authStore`)

```ts
{
  user: User | null,
  token: string | null,   // persiste em localStorage
  isLoading: boolean,

  login(email, password)
  register(name, email, password, password_confirmation)
  logout()
  fetchMe()               // chamado no boot da aplicação se token existir
}
```

### Cache de dados (TanStack Query)

| Query Key | Endpoint | Stale Time |
|---|---|---|
| `['workouts']` | GET /api/workouts | 30s |
| `['workout', id]` | GET /api/workouts/{id} | 30s |
| `['conversations']` | GET /api/conversations | 30s |
| `['messages', id]` | GET /api/conversations/{id}/messages | 30s |

Após salvar um treino via chat, o cliente invalida `['workouts']` para refletir o novo treino no Dashboard.

### Streaming no frontend

O streaming SSE é consumido diretamente via `fetch` (não via Axios, pois Axios não suporta streaming nativo):

```ts
const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  // processa linhas "data: {...}"
  // atualiza streamingContent no estado local
}
```

Enquanto o stream está ativo, a mensagem parcial é exibida em tempo real com um cursor piscante.

---

## Configuração do Docker

```yaml
services:
  db:          PostgreSQL 16 — porta 5432
  app:         PHP 8.3 + Laravel — comunicação via FastCGI
  nginx:       porta 80 — serve React build + proxy /api → app
  frontend-dev: Node 20 + Vite — porta 5173 (perfil "dev" apenas)
```

O container `frontend-dev` usa o profile `dev` e não sobe por padrão:
```bash
docker compose --profile dev up -d
```
