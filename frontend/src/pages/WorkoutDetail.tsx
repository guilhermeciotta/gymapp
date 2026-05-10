import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../lib/axios'

interface Exercise {
  id: number
  name: string
  sets: number | null
  reps: string | null
  rest_seconds: number | null
  notes: string | null
  order: number
}

interface WorkoutDay {
  id: number
  name: string
  order: number
  exercises: Exercise[]
}

interface Workout {
  id: number
  name: string
  objective: string | null
  notes: string | null
  days: WorkoutDay[]
}

export default function WorkoutDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: workout, isLoading } = useQuery<Workout>({
    queryKey: ['workout', id],
    queryFn: () => api.get(`/workouts/${id}`).then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/workouts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] })
      navigate('/')
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Carregando...
      </div>
    )
  }

  if (!workout) return null

  return (
    <div className="min-h-screen">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-green-400 hover:text-green-300 text-sm transition-colors">
          ← Voltar
        </Link>
        <button
          onClick={() => {
            if (confirm('Excluir este treino?')) deleteMutation.mutate()
          }}
          className="text-red-400 hover:text-red-300 text-sm transition-colors"
        >
          Excluir treino
        </button>
      </nav>

      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-1">{workout.name}</h1>
        {workout.objective && (
          <p className="text-green-400 mb-2">{workout.objective}</p>
        )}
        {workout.notes && (
          <p className="text-gray-400 text-sm mb-6">{workout.notes}</p>
        )}

        <div className="space-y-4 mt-6">
          {workout.days.map((day) => (
            <div key={day.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-5 py-3 bg-gray-800">
                <h2 className="font-semibold text-green-400">{day.name}</h2>
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
      </main>
    </div>
  )
}
