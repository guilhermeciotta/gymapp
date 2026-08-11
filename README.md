# GymAI

Sistema web para montagem e salvamento de planos de treino personalizados com auxílio de inteligência artificial. O usuário conversa com um assistente (Google Gemini) que atua como personal trainer e nutricionista, e ao final da conversa pode salvar o treino gerado diretamente no perfil.

---

## Funcionalidades

- **Autenticação** — Registro, login e logout com tokens via Laravel Sanctum
- **Chat com IA** — Conversa em tempo real com Google Gemini via streaming (Server-Sent Events)
- **Salvamento de treino** — A IA gera um JSON estruturado embutido na resposta; o usuário salva com um clique
- **Gerenciamento de treinos** — Visualização, criação manual e exclusão de treinos salvos
- **Histórico de conversas** — Múltiplas conversas independentes por usuário

---

## Stack

### Backend
| Tecnologia | Versão |
|---|---|
| PHP | ^8.3 |
| Laravel | ^13.7 |
| Laravel Sanctum | * |
| Google Gemini API | via `guzzlehttp/guzzle` (já incluído no Laravel) |
| Banco de dados | PostgreSQL 16 (Docker) / SQLite (local) |

### Frontend
| Tecnologia | Versão |
|---|---|
| React | ^18.3 |
| TypeScript | ^5.3 |
| Vite | ^5.1 |
| Tailwind CSS | ^3.4 |
| Zustand | ^4.5 (estado global) |
| TanStack Query | ^5.0 (cache/fetching) |
| React Router | ^6.22 |
| React Markdown | ^9.0 |
| Axios | ^1.6 |

### Infraestrutura
- **Nginx** — Serve o build do React e faz proxy das chamadas `/api` para o Laravel
- **Docker Compose** — PostgreSQL, PHP-FPM, Nginx, container de dev do frontend

---

## Pré-requisitos

- [Docker](https://www.docker.com/) e Docker Compose
- Chave de API de um provedor de IA compatível (atualmente configurado para Google Gemini)

---

## Configuração e execução

### 1. Clonar e configurar variáveis de ambiente

```bash
cp backend/.env.example backend/.env
```

Edite `backend/.env` e preencha as variáveis obrigatórias:

```env
APP_KEY=      # gerado em seguida
AI_API_KEY=   # chave do provedor de IA (atualmente Google Gemini, via aistudio.google.com/apikey)
AI_MODEL=gemini-flash-latest
DB_CONNECTION=pgsql
DB_HOST=db
DB_PORT=5432
DB_DATABASE=gymdb
DB_USERNAME=gym
DB_PASSWORD=secret
```

### 2. Subir os serviços

```bash
docker compose up -d
```

Isso sobe:
- `db` — PostgreSQL na porta `5432`
- `app` — PHP-FPM (Laravel)
- `nginx` — Porta `80` (API + frontend)

### 3. Inicializar o backend

```bash
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate
```

### 4. Build do frontend

```bash
cd frontend
npm install
npm run build
```

O build gerado em `frontend/dist/` é servido automaticamente pelo Nginx.

### Modo desenvolvimento (frontend com hot-reload)

```bash
# Sobe o container de dev do frontend (perfil "dev")
docker compose --profile dev up -d

# Acesse o frontend em http://localhost:5173
```

> O container `frontend-dev` expõe a porta `5173` e usa `VITE_API_URL=http://localhost/api`.

---

## Desenvolvimento local (sem Docker)

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

> O Vite precisa ter o proxy configurado apontando para `http://localhost:8000/api`. Verifique `frontend/vite.config.ts`.

---

## Variáveis de ambiente

| Variável | Descrição | Obrigatório |
|---|---|---|
| `APP_KEY` | Chave de criptografia do Laravel | Sim |
| `AI_API_KEY` | Chave da API do provedor de IA (atualmente Google Gemini) | Sim |
| `AI_MODEL` | Modelo usado no chat (padrão: `claude-opus-5`) | Não |
| `DB_CONNECTION` | Driver do banco (`pgsql` ou `sqlite`) | Sim |
| `DB_HOST` | Host do banco (ex.: `db` no Docker) | Se pgsql |
| `DB_DATABASE` | Nome do banco | Se pgsql |
| `DB_USERNAME` | Usuário do banco | Se pgsql |
| `DB_PASSWORD` | Senha do banco | Se pgsql |
| `APP_URL` | URL base da aplicação | Sim |
| `APP_ENV` | Ambiente (`local`, `production`) | Sim |

---

## Estrutura do projeto

```
gymapp/
├── backend/                  # Laravel 13
│   ├── app/
│   │   ├── Http/Controllers/ # AuthController, ChatController, WorkoutController...
│   │   ├── Models/           # User, Workout, WorkoutDay, Exercise, Conversation, Message
│   │   ├── Policies/         # WorkoutPolicy, ConversationPolicy
│   │   └── Services/         # AIService (streaming + extração de JSON)
│   ├── database/
│   │   └── migrations/       # Schema completo do banco
│   ├── routes/
│   │   └── api.php           # Todas as rotas da API
│   └── .env.example
│
├── frontend/                 # React 18 + TypeScript
│   └── src/
│       ├── pages/            # Login, Register, Dashboard, Chat, WorkoutDetail
│       ├── store/            # authStore (Zustand)
│       ├── lib/              # axios.ts (instância configurada)
│       └── App.tsx           # Roteamento e guarda de rotas
│
├── docker/                   # Dockerfiles e configurações de Nginx
├── docker-compose.yml
└── README.md
```

---

## Como funciona o salvamento via IA

1. Usuário abre uma conversa no Chat e descreve seu objetivo, dias disponíveis e nível de experiência
2. O Gemini (instruído como personal trainer) monta o plano e, ao concluir, embute um bloco JSON na resposta:
   ```
   ===WORKOUT_JSON_START===
   { "name": "...", "objective": "...", "days": [...] }
   ===WORKOUT_JSON_END===
   ```
3. O frontend detecta o marcador e exibe o botão **"Salvar treino"**
4. Ao clicar, o frontend chama `POST /api/conversations/{id}/save-workout`
5. O backend extrai o JSON, cria o `Workout`, seus `WorkoutDay`s e `Exercise`s no banco
6. O treino fica disponível no Dashboard

---

## Documentação adicional

- [Referência da API](docs/API.md)
- [Arquitetura e modelos de dados](docs/ARCHITECTURE.md)
