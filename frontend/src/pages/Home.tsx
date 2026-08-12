import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
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

export default function Home() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const today = todayWeekday()

  const { data: workouts, isLoading } = useQuery<Workout[]>({
    queryKey: ['workouts'],
    queryFn: () => api.get('/workouts').then((r) => r.data),
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
                  <Link
                    to={`/workouts/${workout.id}`}
                    className="text-gray-400 hover:text-green-400 text-xs transition-colors"
                  >
                    Ver treino completo →
                  </Link>
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
      </main>
    </div>
  )
}
