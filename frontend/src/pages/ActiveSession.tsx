import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CancelButton, DeleteButton, EditButton, SaveButton } from '../components/IconButton'
import api from '../lib/axios'

interface SetLog {
  id: number
  set_number: number
  weight_kg: string | number | null
  reps: number | null
  completed_at: string
}

interface SessionExercise {
  id: number
  exercise_id: number | null
  name: string
  target_sets: number | null
  target_reps: string | null
  rest_seconds: number | null
  order: number
  sets: SetLog[]
}

interface WorkoutSession {
  id: number
  workout_id: number | null
  workout_day_id: number | null
  workout_name: string
  day_name: string
  started_at: string
  finished_at: string | null
  status: 'in_progress' | 'completed' | 'abandoned'
  notes: string | null
  exercises: SessionExercise[]
}

function formatDateTime(value: string | null): string {
  if (!value) return '-'
  return new Date(value).toLocaleString('pt-BR')
}

const STATUS_LABEL: Record<WorkoutSession['status'], string> = {
  in_progress: 'Em andamento',
  completed: 'Concluído',
  abandoned: 'Abandonado',
}

function RestTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    setRemaining(seconds)
    const interval = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [seconds])

  useEffect(() => {
    if (remaining <= 0) onDone()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining])

  const progress = Math.max(0, Math.min(100, (remaining / seconds) * 100))

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-3 border border-green-500/40">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-300">Descanso</span>
        <span className="text-lg font-bold text-green-400">{remaining}s</span>
      </div>
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
      <button
        onClick={() => {
          setRemaining(0)
          onDone()
        }}
        className="mt-3 text-xs text-gray-400 hover:text-green-400 transition-colors"
      >
        Pular descanso
      </button>
    </div>
  )
}

function SetRow({ set, sessionId }: { set: SetLog; sessionId: string }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [weight, setWeight] = useState(String(set.weight_kg ?? ''))
  const [reps, setReps] = useState(String(set.reps ?? ''))

  const updateMutation = useMutation({
    mutationFn: () =>
      api.put(`/sets/${set.id}`, {
        weight_kg: weight === '' ? null : Number(weight),
        reps: reps === '' ? null : Number(reps),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      setEditing(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/sets/${set.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
    },
  })

  if (editing) {
    return (
      <li className="flex items-center gap-2 text-sm bg-gray-800/50 rounded-lg px-3 py-2">
        <span className="text-gray-400 shrink-0">Série {set.set_number}:</span>
        <input
          type="number"
          step="0.5"
          min="0"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-green-500"
        />
        <span className="text-gray-500">kg ×</span>
        <input
          type="number"
          min="0"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          className="w-14 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-green-500"
        />
        <span className="text-gray-500">reps</span>
        <div className="flex gap-1 ml-auto">
          <SaveButton onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} />
          <CancelButton onClick={() => setEditing(false)} />
        </div>
      </li>
    )
  }

  return (
    <li className="flex items-center justify-between text-sm text-gray-300 bg-gray-800/50 rounded-lg px-3 py-2">
      <span>
        Série {set.set_number}: {set.weight_kg ?? '-'} kg × {set.reps ?? '-'} reps
      </span>
      <div className="flex gap-1">
        <EditButton onClick={() => setEditing(true)} label="Editar série" />
        <DeleteButton onClick={() => deleteMutation.mutate()} label="Excluir série" />
      </div>
    </li>
  )
}

function SetLogForm({
  sessionExercise,
  onLogged,
  submitLabel,
}: {
  sessionExercise: SessionExercise
  onLogged: (restSeconds: number) => void
  submitLabel: string
}) {
  const queryClient = useQueryClient()
  const { id } = useParams<{ id: string }>()
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/session-exercises/${sessionExercise.id}/sets`, {
        weight_kg: weight === '' ? null : Number(weight),
        reps: reps === '' ? null : Number(reps),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', id] })
      onLogged(sessionExercise.rest_seconds ?? 60)
      setWeight('')
      setReps('')
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        mutation.mutate()
      }}
      className="flex items-end gap-2 mt-2"
    >
      <div>
        <label className="block text-xs text-gray-500 mb-1">Peso (kg)</label>
        <input
          type="number"
          step="0.5"
          min="0"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
          required
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Reps</label>
        <input
          type="number"
          min="0"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          className="w-20 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
          required
        />
      </div>
      <button
        type="submit"
        disabled={mutation.isPending}
        className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-gray-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
      >
        {submitLabel}
      </button>
    </form>
  )
}

export default function ActiveSession() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [restingExercise, setRestingExercise] = useState<{ id: number; seconds: number } | null>(null)

  const { data: session, isLoading } = useQuery<WorkoutSession>({
    queryKey: ['session', id],
    queryFn: () => api.get(`/sessions/${id}`).then((r) => r.data),
  })

  const finishMutation = useMutation({
    mutationFn: () => api.post(`/sessions/${id}/finish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', id] })
      navigate('/')
    },
  })

  const deleteSessionMutation = useMutation({
    mutationFn: () => api.delete(`/sessions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
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

  if (!session) return null

  const isActive = session.status === 'in_progress'

  return (
    <div className="min-h-screen">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-green-400 hover:text-green-300 text-sm transition-colors">
          ← Voltar
        </Link>
        <DeleteButton
          label="Excluir treino"
          onClick={() => {
            if (confirm('Excluir este treino registrado? Essa ação não pode ser desfeita.')) {
              deleteSessionMutation.mutate()
            }
          }}
        />
      </nav>

      <main className="max-w-3xl mx-auto p-6 pb-28">
        <h1 className="text-3xl font-bold mb-1">{session.workout_name}</h1>
        <p className="text-green-400 mb-2">{session.day_name}</p>
        <div className="flex items-center gap-3 text-sm text-gray-400 mb-6">
          <span>{STATUS_LABEL[session.status]}</span>
          <span>· Início: {formatDateTime(session.started_at)}</span>
          {session.finished_at && <span>· Fim: {formatDateTime(session.finished_at)}</span>}
        </div>

        <div className="space-y-4 mt-6">
          {session.exercises
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((ex) => (
              <div key={ex.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="px-5 py-3 bg-gray-800 flex items-center justify-between">
                  <h2 className="font-semibold text-green-400">{ex.name}</h2>
                  <div className="flex gap-3 text-xs text-gray-400">
                    {ex.target_sets && <span>{ex.target_sets} séries</span>}
                    {ex.target_reps && <span>{ex.target_reps} reps</span>}
                    {ex.rest_seconds && <span>{ex.rest_seconds}s descanso</span>}
                  </div>
                </div>
                <div className="px-5 py-3">
                  {ex.sets.length > 0 ? (
                    <ul className="space-y-1 mb-2">
                      {ex.sets.map((set) => (
                        <SetRow key={set.id} set={set} sessionId={id!} />
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 mb-2">Nenhuma série registrada ainda.</p>
                  )}

                  {isActive && restingExercise?.id === ex.id && (
                    <RestTimer
                      seconds={restingExercise.seconds}
                      onDone={() => setRestingExercise(null)}
                    />
                  )}
                  <SetLogForm
                    sessionExercise={ex}
                    onLogged={(restSeconds) => {
                      if (isActive) setRestingExercise({ id: ex.id, seconds: restSeconds })
                    }}
                    submitLabel={isActive ? 'Concluir série' : 'Adicionar série'}
                  />
                </div>
              </div>
            ))}
        </div>
      </main>

      {isActive && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-6 py-4">
          <div className="max-w-3xl mx-auto flex justify-end">
            <button
              onClick={() => {
                if (confirm('Finalizar este treino?')) finishMutation.mutate()
              }}
              disabled={finishMutation.isPending}
              className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-gray-950 font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Finalizar treino
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
