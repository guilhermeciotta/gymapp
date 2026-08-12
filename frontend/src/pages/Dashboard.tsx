import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import { useAuthStore } from '../store/authStore'

interface Workout {
  id: number
  name: string
  objective: string | null
  created_at: string
  days: { id: number; name: string }[]
}

export default function Dashboard() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const { data: workouts, isLoading } = useQuery<Workout[]>({
    queryKey: ['workouts'],
    queryFn: () => api.get('/workouts').then((r) => r.data),
  })

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-green-400">GymAI</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{user?.name}</span>
          <Link
            to="/"
            className="text-gray-400 hover:text-green-400 text-sm transition-colors"
          >
            Início
          </Link>
          <Link
            to="/workouts/new"
            className="border border-gray-700 hover:border-green-500/60 text-gray-300 hover:text-green-400 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Criar manualmente
          </Link>
          <Link
            to="/chat"
            className="bg-green-500 hover:bg-green-400 text-gray-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Criar com IA
          </Link>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Sair
          </button>
        </div>
      </nav>

      {/* Conteúdo */}
      <main className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Meus Treinos</h2>
        </div>

        {isLoading ? (
          <div className="text-gray-400 text-center py-12">Carregando...</div>
        ) : workouts?.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-6">Você ainda não tem treinos salvos.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/chat"
                className="bg-green-500 hover:bg-green-400 text-gray-950 font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Criar com IA
              </Link>
              <Link
                to="/workouts/new"
                className="border border-gray-700 hover:border-green-500/60 text-gray-300 hover:text-green-400 px-6 py-3 rounded-lg transition-colors"
              >
                Criar manualmente
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {workouts?.map((w) => (
              <Link
                key={w.id}
                to={`/workouts/${w.id}`}
                className="bg-gray-900 hover:bg-gray-800 rounded-xl p-5 border border-gray-800 hover:border-green-500/50 transition-all"
              >
                <h3 className="font-semibold text-lg mb-1">{w.name}</h3>
                {w.objective && (
                  <p className="text-green-400 text-sm mb-3">{w.objective}</p>
                )}
                <p className="text-gray-500 text-sm">
                  {w.days.length} dia{w.days.length !== 1 ? 's' : ''} de treino
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
