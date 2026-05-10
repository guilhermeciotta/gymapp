# Referência da API

Base URL: `/api`

Todas as requisições devem incluir o header:
```
Accept: application/json
Content-Type: application/json
```

Rotas protegidas exigem o header de autenticação:
```
Authorization: Bearer {token}
```

---

## Autenticação

### Registrar usuário

```
POST /api/auth/register
```

**Body**
```json
{
  "name": "string, obrigatório",
  "email": "string, obrigatório, único",
  "password": "string, mín. 8 caracteres",
  "password_confirmation": "string, igual ao password"
}
```

**Resposta 201**
```json
{
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@email.com",
    "created_at": "2026-05-10T12:00:00Z"
  },
  "token": "1|abc123..."
}
```

---

### Login

```
POST /api/auth/login
```

**Body**
```json
{
  "email": "string",
  "password": "string"
}
```

**Resposta 200**
```json
{
  "user": { "id": 1, "name": "João Silva", "email": "joao@email.com" },
  "token": "2|xyz789..."
}
```

**Resposta 422** — Credenciais inválidas
```json
{
  "message": "Credenciais inválidas.",
  "errors": { "email": ["Credenciais inválidas."] }
}
```

---

### Logout

```
POST /api/auth/logout
```
*Requer autenticação*

Revoga o token atual.

**Resposta 200**
```json
{ "message": "Logout realizado com sucesso." }
```

---

### Usuário autenticado

```
GET /api/auth/me
```
*Requer autenticação*

**Resposta 200**
```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@email.com",
  "created_at": "2026-05-10T12:00:00Z"
}
```

---

## Treinos

### Listar treinos

```
GET /api/workouts
```
*Requer autenticação*

Retorna todos os treinos do usuário autenticado, incluindo dias e exercícios.

**Resposta 200**
```json
[
  {
    "id": 1,
    "name": "Treino A - Hipertrofia",
    "objective": "Hipertrofia",
    "notes": null,
    "created_at": "2026-05-10T12:00:00Z",
    "days": [
      {
        "id": 1,
        "name": "Segunda - Peito e Tríceps",
        "order": 1,
        "exercises": [
          {
            "id": 1,
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
]
```

---

### Criar treino

```
POST /api/workouts
```
*Requer autenticação*

**Body**
```json
{
  "name": "string, obrigatório",
  "objective": "string, opcional",
  "notes": "string, opcional",
  "days": [
    {
      "name": "string, obrigatório",
      "order": "integer, opcional",
      "exercises": [
        {
          "name": "string, obrigatório",
          "sets": "integer, opcional",
          "reps": "string, opcional (ex: '8-12')",
          "rest_seconds": "integer, opcional",
          "notes": "string, opcional",
          "order": "integer, opcional"
        }
      ]
    }
  ]
}
```

**Resposta 201** — Treino criado com dias e exercícios

---

### Buscar treino

```
GET /api/workouts/{id}
```
*Requer autenticação | Somente o dono*

**Resposta 200** — Mesmo formato de criação, com todos os relacionamentos

**Resposta 403** — Acesso negado (treino de outro usuário)

---

### Atualizar treino

```
PUT /api/workouts/{id}
```
*Requer autenticação | Somente o dono*

**Body** — Todos os campos são opcionais (PATCH semântico)
```json
{
  "name": "string",
  "objective": "string",
  "notes": "string"
}
```

> Não atualiza dias/exercícios diretamente. Use os endpoints específicos abaixo.

**Resposta 200** — Treino atualizado

---

### Excluir treino

```
DELETE /api/workouts/{id}
```
*Requer autenticação | Somente o dono*

A exclusão em cascata remove automaticamente todos os `WorkoutDay`s e `Exercise`s vinculados.

**Resposta 204** — Sem conteúdo

---

## Dias de treino

### Criar dia

```
POST /api/workouts/{workout}/days
```
*Requer autenticação | Somente o dono do treino*

**Body**
```json
{
  "name": "string, obrigatório",
  "order": "integer, opcional"
}
```

**Resposta 201** — Dia criado com lista de exercícios (vazia inicialmente)

---

### Atualizar dia

```
PUT /api/days/{day}
```
*Requer autenticação | Somente o dono do treino vinculado*

**Body**
```json
{
  "name": "string",
  "order": "integer"
}
```

**Resposta 200** — Dia atualizado com exercícios

---

### Excluir dia

```
DELETE /api/days/{day}
```
*Requer autenticação | Somente o dono do treino vinculado*

Remove o dia e todos os exercícios vinculados (cascata).

**Resposta 204** — Sem conteúdo

---

## Exercícios

### Criar exercício

```
POST /api/days/{day}/exercises
```
*Requer autenticação | Somente o dono do treino vinculado*

**Body**
```json
{
  "name": "string, obrigatório",
  "sets": "integer, opcional",
  "reps": "string, opcional",
  "rest_seconds": "integer, opcional",
  "notes": "string, opcional",
  "order": "integer, opcional"
}
```

**Resposta 201**
```json
{
  "id": 5,
  "workout_day_id": 2,
  "name": "Agachamento Livre",
  "sets": 4,
  "reps": "6-10",
  "rest_seconds": 120,
  "notes": null,
  "order": 1
}
```

---

### Atualizar exercício

```
PUT /api/exercises/{exercise}
```
*Requer autenticação | Somente o dono do treino vinculado*

**Body** — Campos opcionais
```json
{
  "name": "string",
  "sets": "integer",
  "reps": "string",
  "rest_seconds": "integer",
  "notes": "string",
  "order": "integer"
}
```

**Resposta 200** — Exercício atualizado

---

### Excluir exercício

```
DELETE /api/exercises/{exercise}
```
*Requer autenticação | Somente o dono do treino vinculado*

**Resposta 204** — Sem conteúdo

---

## Chat / Conversas

### Listar conversas

```
GET /api/conversations
```
*Requer autenticação*

**Resposta 200**
```json
[
  {
    "id": 1,
    "title": "Treino para emagrecimento",
    "created_at": "2026-05-10T12:00:00Z"
  }
]
```

---

### Criar conversa

```
POST /api/conversations
```
*Requer autenticação*

**Body**
```json
{
  "title": "string, opcional (padrão: 'Nova conversa')"
}
```

**Resposta 201**
```json
{
  "id": 2,
  "title": "Nova conversa",
  "user_id": 1,
  "created_at": "2026-05-10T12:00:00Z"
}
```

---

### Listar mensagens de uma conversa

```
GET /api/conversations/{conversation}/messages
```
*Requer autenticação | Somente o dono da conversa*

**Resposta 200**
```json
[
  {
    "id": 1,
    "conversation_id": 2,
    "role": "user",
    "content": "Quero montar um treino para hipertrofia.",
    "created_at": "2026-05-10T12:01:00Z"
  },
  {
    "id": 2,
    "conversation_id": 2,
    "role": "assistant",
    "content": "Ótimo! Quantos dias por semana você pode treinar?...",
    "created_at": "2026-05-10T12:01:05Z"
  }
]
```

---

### Enviar mensagem (streaming)

```
POST /api/conversations/{conversation}/messages
```
*Requer autenticação | Somente o dono da conversa*

**Headers adicionais**
```
Accept: text/event-stream
```

**Body**
```json
{
  "content": "string, obrigatório, máx. 4000 caracteres"
}
```

**Resposta 200** — `text/event-stream` (Server-Sent Events)

Cada evento retorna um token da resposta da IA:
```
data: {"token": "Ol"}

data: {"token": "á!"}

data: {"token": " Vamos"}

data: [DONE]
```

Ao receber `[DONE]`, a mensagem completa do assistente já foi salva no banco.

> A mensagem do usuário é salva imediatamente antes do streaming começar. A mensagem do assistente é salva ao final do streaming.

---

### Salvar treino da conversa

```
POST /api/conversations/{conversation}/save-workout
```
*Requer autenticação | Somente o dono da conversa*

Extrai o JSON estruturado da última mensagem do assistente e cria o treino no banco.

A mensagem deve conter o bloco:
```
===WORKOUT_JSON_START===
{ ... }
===WORKOUT_JSON_END===
```

**Resposta 201** — Treino criado com dias e exercícios (mesmo formato de `GET /api/workouts/{id}`)

**Resposta 422** — Sem resposta da IA na conversa
```json
{ "message": "Nenhuma resposta da AI encontrada." }
```

**Resposta 422** — Última resposta da IA não contém JSON de treino
```json
{ "message": "Nenhum treino estruturado encontrado na conversa." }
```

---

## Erros padrão

| Status | Significado |
|---|---|
| `401` | Não autenticado (token ausente ou inválido) |
| `403` | Acesso negado (recurso de outro usuário) |
| `404` | Recurso não encontrado |
| `422` | Erro de validação ou regra de negócio |
| `500` | Erro interno do servidor |

**Formato de erro de validação (422)**
```json
{
  "message": "O campo name é obrigatório.",
  "errors": {
    "name": ["O campo name é obrigatório."]
  }
}
```
