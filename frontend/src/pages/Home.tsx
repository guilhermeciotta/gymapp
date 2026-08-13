import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { DeleteButton } from '../components/IconButton'
import api from '../lib/axios'
import { todayWeekday, weekdayLabel } from '../lib/weekdays'
import { useAuthStore } from '../store/authStore'

interface Exercise {
  id: number
  name: string
  sets: number | null
  reps: string | null
  rest_seconds: number | null
  notes: string | null
}

interface WorkoutDay {
  id: number
  name: string
  dia_semana: string | null
  exercises: Exercise[]
}

interface Workout {
  id: number
  name: string
  objective: string | null
  days: WorkoutDay[]
}

interface LastSession {
  id: number
  workout_name: string
  day_name: string
  finished_at: string
}

interface Summary {
  total_completed: number
  sessions_this_week: number
  streak_days: number
  last_session: LastSession | null
  exercise_names: string[]
}

interface SessionHistoryItem {
  id: number
  workout_name: string
  day_name: string
  started_at: string
  finished_at: string | null
  status: 'in_progress' | 'completed' | 'abandoned'
}

interface ExerciseProgressPoint {
  date: string
  weight_kg: number
  reps: number
}

const STATUS_LABEL: Record<SessionHistoryItem['status'], string> = {
  in_progress: 'Em andamento',
  completed: 'Concluído',
  abandoned: 'Abandonado',
}

function formatDate(value: string | null): string {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('pt-BR')
}

// `date` do endpoint de progresso é uma string "YYYY-MM-DD" sem horário — o construtor
// `new Date(string)` a interpreta como UTC, deslocando o dia em fusos negativos ao converter
// para local. Aqui montamos a data em horário local diretamente, evitando esse desvio.
function formatDateOnly(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR')
}

export default function Home() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const today = todayWeekday()
  const [selectedExercise, setSelectedExercise] = useState('')

  const { data: workouts, isLoading } = useQuery<Workout[]>({
    queryKey: ['workouts'],
    queryFn: () => api.get('/workouts').then((r) => r.data),
  })

  const { data: summary, isLoading: loadingSummary } = useQuery<Summary>({
    queryKey: ['dashboard-summary'],
    queryFn: () => api.get('/dashboard/summary').then((r) => r.data),
  })

  const { data: sessions, isLoading: loadingSessions } = useQuery<SessionHistoryItem[]>({
    queryKey: ['sessions'],
    queryFn: () => api.get('/sessions').then((r) => r.data),
  })

  const { data: progress, isLoading: loadingProgress } = useQuery<ExerciseProgressPoint[]>({
    queryKey: ['exercise-progress', selectedExercise],
    queryFn: () =>
      api
        .get('/dashboard/exercise-progress', { params: { name: selectedExercise } })
        .then((r) => r.data),
    enabled: !!selectedExercise,
  })

  const startSessionMutation = useMutation({
    mutationFn: (dayId: number) => api.post(`/workout-days/${dayId}/sessions`),
    onSuccess: (response) => {
      navigate(`/sessions/${response.data.id}`)
    },
  })

  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: number) => api.delete(`/sessions/${sessionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const todaysDays =
    workouts?.flatMap((workout) =>
      workout.days
        .filter((day) => day.dia_semana === today)
        .map((day) => ({ workout, day }))
    ) ?? []

  return (
    <div className="min-h-screen">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-green-400">GymAI</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{user?.name}</span>
          <Link
            to="/workouts"
            className="border border-gray-700 hover:border-green-500/60 text-gray-300 hover:text-green-400 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Meus treinos
          </Link>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Sair
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-1">
          Treino de hoje — {weekdayLabel(today)}
        </h2>

        {isLoading ? (
          <div className="text-gray-400 text-center py-12">Carregando...</div>
        ) : todaysDays.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-6">
              Nenhum treino cadastrado para hoje ({weekdayLabel(today)}).
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/chat"
                className="bg-green-500 hover:bg-green-400 text-gray-950 font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Criar com IA
              </Link>
              <Link
                to="/workouts"
                className="border border-gray-700 hover:border-green-500/60 text-gray-300 hover:text-green-400 px-6 py-3 rounded-lg transition-colors"
              >
                Ver meus treinos
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            {todaysDays.map(({ workout, day }) => (
              <div
                key={day.id}
                className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden"
              >
                <div className="px-5 py-3 bg-gray-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-green-400">{day.name}</h3>
                    <p className="text-xs text-gray-500">{workout.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => startSessionMutation.mutate(day.id)}
                      disabled={startSessionMutation.isPending}
                      className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-gray-950 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors"
                    >
                      Iniciar treino
                    </button>
                    <Link
                      to={`/workouts/${workout.id}`}
                      className="text-gray-400 hover:text-green-400 text-xs transition-colors"
                    >
                      Ver treino completo →
                    </Link>
                  </div>
                </div>
                <div className="divide-y divide-gray-800">
                  {day.exercises.map((ex) => (
                    <div key={ex.id} className="px-5 py-3">
                      <p className="font-medium">{ex.name}</p>
                      <div className="flex gap-4 mt-1 text-sm text-gray-400">
                        {ex.sets && <span>{ex.sets} séries</span>}
                        {ex.reps && <span>{ex.reps} reps</span>}
                        {ex.rest_seconds && <span>{ex.rest_seconds}s descanso</span>}
                      </div>
                      {ex.notes && (
                        <p className="text-xs text-gray-500 mt-1">{ex.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <h2 className="text-2xl font-semibold mb-1 mt-12">Progresso</h2>

        {loadingSummary ? (
          <div className="text-gray-400 text-center py-8">Carregando...</div>
        ) : summary ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 mb-8">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <p className="text-xs text-gray-500 mb-1">Treinos concluídos</p>
              <p className="text-2xl font-bold text-green-400">{summary.total_completed}</p>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <p className="text-xs text-gray-500 mb-1">Essa semana</p>
              <p className="text-2xl font-bold text-green-400">{summary.sessions_this_week}</p>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <p className="text-xs text-gray-500 mb-1">Sequência atual</p>
              <p className="text-2xl font-bold text-green-400">{summary.streak_days}d</p>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <p className="text-xs text-gray-500 mb-1">Último treino</p>
              {summary.last_session ? (
                <p className="text-sm font-medium">
                  {summary.last_session.workout_name}
                  <span className="block text-xs text-gray-500">
                    {formatDate(summary.last_session.finished_at)}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-gray-500">Nenhum treino ainda</p>
              )}
            </div>
          </div>
        ) : null}

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 mb-8">
          <h3 className="font-semibold text-green-400 mb-3">Evolução de carga</h3>
          {summary && summary.exercise_names.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum exercício registrado ainda.</p>
          ) : (
            <>
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 mb-4"
              >
                <option value="">Selecione um exercício</option>
                {summary?.exercise_names.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>

              {selectedExercise && (
                loadingProgress ? (
                  <div className="text-gray-400 text-center py-8">Carregando...</div>
                ) : progress && progress.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={progress}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => formatDateOnly(value)}
                          stroke="#6b7280"
                          fontSize={12}
                        />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#111827',
                            border: '1px solid #1f2937',
                            borderRadius: 8,
                          }}
                          labelFormatter={(value) => formatDateOnly(value as string)}
                          formatter={(value) => [`${value} kg`, 'Peso']}
                        />
                        <Line
                          type="monotone"
                          dataKey="weight_kg"
                          stroke="#4ade80"
                          strokeWidth={2}
                          dot={{ fill: '#4ade80' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Nenhum registro para esse exercício.</p>
                )
              )}
            </>
          )}
        </div>

        <h3 className="font-semibold text-green-400 mb-3">Histórico</h3>
        {loadingSessions ? (
          <div className="text-gray-400 text-center py-8">Carregando...</div>
        ) : sessions && sessions.length > 0 ? (
          <div className="space-y-2">
            {sessions.map((s) => (
              <Link
                key={s.id}
                to={`/sessions/${s.id}`}
                className="block bg-gray-900 hover:bg-gray-800 rounded-xl p-4 border border-gray-800 hover:border-green-500/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{s.workout_name}</p>
                    <p className="text-xs text-gray-500">{s.day_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-gray-400">{formatDate(s.started_at)}</p>
                      <p className="text-xs text-gray-500">{STATUS_LABEL[s.status]}</p>
                    </div>
                    <DeleteButton
                      label="Excluir treino"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (confirm('Excluir este treino registrado?')) {
                          deleteSessionMutation.mutate(s.id)
                        }
                      }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nenhum treino registrado ainda.</p>
        )}
      </main>
    </div>
  )
}
