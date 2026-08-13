import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CancelButton, DeleteButton, EditButton, SaveButton } from '../components/IconButton'
import api from '../lib/axios'
import { WEEKDAYS, weekdayLabel } from '../lib/weekdays'

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
  dia_semana: string | null
  exercises: Exercise[]
}

interface Workout {
  id: number
  name: string
  objective: string | null
  notes: string | null
  days: WorkoutDay[]
}

function fieldClass(extra = '') {
  return `w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 transition-colors ${extra}`
}

function WorkoutHeader({ workout, workoutId }: { workout: Workout; workoutId: string }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(workout.name)
  const [objective, setObjective] = useState(workout.objective ?? '')
  const [notes, setNotes] = useState(workout.notes ?? '')

  const updateMutation = useMutation({
    mutationFn: () =>
      api.put(`/workouts/${workoutId}`, {
        name: name.trim() || workout.name,
        objective: objective.trim() || null,
        notes: notes.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', workoutId] })
      setEditing(false)
    },
  })

  if (editing) {
    return (
      <div className="mb-6 space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">
            Nome do treino
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass('text-lg font-bold')}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">
            Objetivo
          </label>
          <input
            type="text"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="Ex: Ganho de massa muscular"
            className={fieldClass()}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">
            Observações
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={fieldClass('text-gray-300')}
          />
        </div>
        <div className="flex gap-1">
          <SaveButton onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} />
          <CancelButton
            onClick={() => {
              setName(workout.name)
              setObjective(workout.objective ?? '')
              setNotes(workout.notes ?? '')
              setEditing(false)
            }}
          />
        </div>
        {updateMutation.isError && (
          <p className="text-red-400 text-sm">Erro ao salvar treino. Tente novamente.</p>
        )}
      </div>
    )
  }

  return (
    <div className="mb-6 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-3xl font-bold mb-1">{workout.name}</h1>
        {workout.objective && <p className="text-green-400 mb-2">{workout.objective}</p>}
        {workout.notes && <p className="text-gray-400 text-sm">{workout.notes}</p>}
      </div>
      <EditButton onClick={() => setEditing(true)} label="Editar treino" className="shrink-0" />
    </div>
  )
}

function ExerciseRow({ exercise, workoutId }: { exercise: Exercise; workoutId: string }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(exercise.name)
  const [sets, setSets] = useState(String(exercise.sets ?? ''))
  const [reps, setReps] = useState(exercise.reps ?? '')
  const [restSeconds, setRestSeconds] = useState(String(exercise.rest_seconds ?? ''))
  const [notes, setNotes] = useState(exercise.notes ?? '')

  const resetFields = () => {
    setName(exercise.name)
    setSets(String(exercise.sets ?? ''))
    setReps(exercise.reps ?? '')
    setRestSeconds(String(exercise.rest_seconds ?? ''))
    setNotes(exercise.notes ?? '')
  }

  const updateMutation = useMutation({
    mutationFn: () =>
      api.put(`/exercises/${exercise.id}`, {
        name: name.trim() || exercise.name,
        sets: sets === '' ? null : parseInt(sets),
        reps: reps.trim() || null,
        rest_seconds: restSeconds === '' ? null : parseInt(restSeconds),
        notes: notes.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', workoutId] })
      setEditing(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/exercises/${exercise.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', workoutId] })
    },
  })

  if (editing) {
    return (
      <div className="px-5 py-4 space-y-3 bg-gray-800/40">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do exercício"
          className={fieldClass()}
        />
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Séries</label>
            <input
              type="number"
              min="1"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              className={fieldClass()}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Reps</label>
            <input
              type="text"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="8-12"
              className={fieldClass()}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Descanso (s)</label>
            <input
              type="number"
              min="0"
              value={restSeconds}
              onChange={(e) => setRestSeconds(e.target.value)}
              className={fieldClass()}
            />
          </div>
        </div>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observações (opcional)"
          className={fieldClass('text-xs text-gray-400')}
        />
        <div className="flex gap-1">
          <SaveButton onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} />
          <CancelButton
            onClick={() => {
              resetFields()
              setEditing(false)
            }}
          />
        </div>
        {updateMutation.isError && (
          <p className="text-red-400 text-xs">Erro ao salvar exercício. Tente novamente.</p>
        )}
      </div>
    )
  }

  return (
    <div className="px-5 py-3 flex items-start justify-between gap-3">
      <div>
        <p className="font-medium">{exercise.name}</p>
        <div className="flex gap-4 mt-1 text-sm text-gray-400">
          {exercise.sets && <span>{exercise.sets} séries</span>}
          {exercise.reps && <span>{exercise.reps} reps</span>}
          {exercise.rest_seconds && <span>{exercise.rest_seconds}s descanso</span>}
        </div>
        {exercise.notes && <p className="text-xs text-gray-500 mt-1">{exercise.notes}</p>}
      </div>
      <div className="flex gap-1 shrink-0">
        <EditButton onClick={() => setEditing(true)} label="Editar exercício" />
        <DeleteButton
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          label="Excluir exercício"
        />
      </div>
    </div>
  )
}

function AddExerciseForm({
  dayId,
  workoutId,
  onDone,
}: {
  dayId: number
  workoutId: string
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [sets, setSets] = useState('3')
  const [reps, setReps] = useState('10')
  const [restSeconds, setRestSeconds] = useState('60')
  const [notes, setNotes] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/days/${dayId}/exercises`, {
        name: name.trim(),
        sets: sets ? parseInt(sets) : null,
        reps: reps.trim() || null,
        rest_seconds: restSeconds ? parseInt(restSeconds) : null,
        notes: notes.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', workoutId] })
      onDone()
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return
        mutation.mutate()
      }}
      className="px-5 py-4 space-y-3 bg-gray-800/40"
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome do exercício"
        required
        className={fieldClass()}
      />
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Séries</label>
          <input
            type="number"
            min="1"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            className={fieldClass()}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Reps</label>
          <input
            type="text"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="8-12"
            className={fieldClass()}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Descanso (s)</label>
          <input
            type="number"
            min="0"
            value={restSeconds}
            onChange={(e) => setRestSeconds(e.target.value)}
            className={fieldClass()}
          />
        </div>
      </div>
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Observações (opcional)"
        className={fieldClass('text-xs text-gray-400')}
      />
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={mutation.isPending || !name.trim()}
          className="text-green-400 hover:text-green-300 text-xs transition-colors disabled:opacity-50"
        >
          Adicionar
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-gray-400 hover:text-gray-300 text-xs transition-colors"
        >
          Cancelar
        </button>
      </div>
      {mutation.isError && (
        <p className="text-red-400 text-xs">Erro ao adicionar exercício. Tente novamente.</p>
      )}
    </form>
  )
}

function DayCard({ day, workoutId }: { day: WorkoutDay; workoutId: string }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(day.name)
  const [diaSemana, setDiaSemana] = useState(day.dia_semana ?? '')
  const [addingExercise, setAddingExercise] = useState(false)

  const updateDayMutation = useMutation({
    mutationFn: () =>
      api.put(`/days/${day.id}`, {
        name: name.trim() || day.name,
        dia_semana: diaSemana || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', workoutId] })
      setEditing(false)
    },
  })

  const deleteDayMutation = useMutation({
    mutationFn: () => api.delete(`/days/${day.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', workoutId] })
    },
  })

  const startSessionMutation = useMutation({
    mutationFn: () => api.post(`/workout-days/${day.id}/sessions`),
    onSuccess: (response) => {
      navigate(`/sessions/${response.data.id}`)
    },
  })

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="px-5 py-3 bg-gray-800 flex items-center justify-between gap-3">
        {editing ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 bg-transparent text-green-400 font-semibold focus:outline-none border-b border-gray-600 focus:border-green-500"
            />
            <select
              value={diaSemana}
              onChange={(e) => setDiaSemana(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-green-500 transition-colors"
            >
              <option value="">Sem dia fixo</option>
              {WEEKDAYS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
            <SaveButton onClick={() => updateDayMutation.mutate()} disabled={updateDayMutation.isPending} />
            <CancelButton
              onClick={() => {
                setName(day.name)
                setDiaSemana(day.dia_semana ?? '')
                setEditing(false)
              }}
            />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="font-semibold text-green-400 truncate">{day.name}</h2>
              {day.dia_semana && (
                <span className="text-xs text-gray-400 shrink-0">{weekdayLabel(day.dia_semana)}</span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <EditButton onClick={() => setEditing(true)} label="Editar dia" />
              <DeleteButton
                onClick={() => {
                  if (confirm('Excluir este dia de treino e todos os seus exercícios?')) {
                    deleteDayMutation.mutate()
                  }
                }}
                disabled={deleteDayMutation.isPending}
                label="Excluir dia"
              />
              <button
                onClick={() => startSessionMutation.mutate()}
                disabled={startSessionMutation.isPending}
                className="ml-1 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-gray-950 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors"
              >
                Iniciar treino
              </button>
            </div>
          </>
        )}
      </div>
      <div className="divide-y divide-gray-800">
        {day.exercises.map((ex) => (
          <ExerciseRow key={ex.id} exercise={ex} workoutId={workoutId} />
        ))}
      </div>
      <div className="border-t border-gray-800">
        {addingExercise ? (
          <AddExerciseForm
            dayId={day.id}
            workoutId={workoutId}
            onDone={() => setAddingExercise(false)}
          />
        ) : (
          <div className="px-5 py-3">
            <button
              onClick={() => setAddingExercise(true)}
              className="text-green-500 hover:text-green-400 text-sm transition-colors"
            >
              + Adicionar exercício
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function AddDayForm({
  workoutId,
  order,
  onDone,
}: {
  workoutId: string
  order: number
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(`Dia ${order + 1}`)
  const [diaSemana, setDiaSemana] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/workouts/${workoutId}/days`, {
        name: name.trim() || `Dia ${order + 1}`,
        order,
        dia_semana: diaSemana || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', workoutId] })
      onDone()
    },
  })

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`Dia ${order + 1}`}
          className="flex-1 bg-transparent text-green-400 font-semibold focus:outline-none placeholder-green-700 border-b border-gray-700 focus:border-green-500"
        />
        <select
          value={diaSemana}
          onChange={(e) => setDiaSemana(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-green-500 transition-colors"
        >
          <option value="">Sem dia fixo</option>
          {WEEKDAYS.map((w) => (
            <option key={w.value} value={w.value}>
              {w.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="text-green-400 hover:text-green-300 text-sm transition-colors"
        >
          Adicionar
        </button>
        <button
          onClick={onDone}
          className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
        >
          Cancelar
        </button>
      </div>
      {mutation.isError && (
        <p className="text-red-400 text-sm">Erro ao adicionar dia. Tente novamente.</p>
      )}
    </div>
  )
}

export default function WorkoutDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [addingDay, setAddingDay] = useState(false)

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

  if (!workout || !id) return null

  return (
    <div className="min-h-screen">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-green-400 hover:text-green-300 text-sm transition-colors">
          ← Voltar
        </Link>
        <DeleteButton
          label="Excluir treino"
          onClick={() => {
            if (confirm('Excluir este treino?')) deleteMutation.mutate()
          }}
        />
      </nav>

      <main className="max-w-3xl mx-auto p-6">
        <WorkoutHeader workout={workout} workoutId={id} />

        <div className="space-y-4 mt-6">
          {workout.days.map((day) => (
            <DayCard key={day.id} day={day} workoutId={id} />
          ))}

          {addingDay ? (
            <AddDayForm
              workoutId={id}
              order={workout.days.length}
              onDone={() => setAddingDay(false)}
            />
          ) : (
            <button
              onClick={() => setAddingDay(true)}
              className="w-full py-3 rounded-xl border border-dashed border-gray-700 hover:border-green-500/60 text-gray-500 hover:text-green-400 text-sm transition-colors"
            >
              + Adicionar dia de treino
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
