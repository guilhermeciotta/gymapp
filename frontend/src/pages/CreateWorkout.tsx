import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'
import { WEEKDAYS } from '../lib/weekdays'

interface ExerciseForm {
  id: string
  name: string
  sets: string
  reps: string
  rest_seconds: string
  notes: string
}

interface DayForm {
  id: string
  name: string
  diaSemana: string
  exercises: ExerciseForm[]
}

function newExercise(): ExerciseForm {
  return { id: crypto.randomUUID(), name: '', sets: '3', reps: '10', rest_seconds: '60', notes: '' }
}

function newDay(index: number): DayForm {
  return { id: crypto.randomUUID(), name: `Dia ${index + 1}`, diaSemana: '', exercises: [newExercise()] }
}

export default function CreateWorkout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [objective, setObjective] = useState('')
  const [days, setDays] = useState<DayForm[]>([newDay(0)])

  const mutation = useMutation({
    mutationFn: (payload: object) => api.post('/workouts', payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] })
      navigate(`/workouts/${res.data.id}`)
    },
  })

  const addDay = () => setDays((d) => [...d, newDay(d.length)])

  const removeDay = (dayId: string) =>
    setDays((d) => d.filter((day) => day.id !== dayId))

  const updateDayName = (dayId: string, value: string) =>
    setDays((d) => d.map((day) => (day.id === dayId ? { ...day, name: value } : day)))

  const updateDayWeekday = (dayId: string, value: string) =>
    setDays((d) => d.map((day) => (day.id === dayId ? { ...day, diaSemana: value } : day)))

  const addExercise = (dayId: string) =>
    setDays((d) =>
      d.map((day) =>
        day.id === dayId ? { ...day, exercises: [...day.exercises, newExercise()] } : day
      )
    )

  const removeExercise = (dayId: string, exId: string) =>
    setDays((d) =>
      d.map((day) =>
        day.id === dayId
          ? { ...day, exercises: day.exercises.filter((e) => e.id !== exId) }
          : day
      )
    )

  const updateExercise = (dayId: string, exId: string, field: keyof ExerciseForm, value: string) =>
    setDays((d) =>
      d.map((day) =>
        day.id === dayId
          ? {
              ...day,
              exercises: day.exercises.map((e) =>
                e.id === exId ? { ...e, [field]: value } : e
              ),
            }
          : day
      )
    )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const payload = {
      name: name.trim(),
      objective: objective.trim() || null,
      days: days.map((day, di) => ({
        name: day.name.trim() || `Dia ${di + 1}`,
        order: di,
        dia_semana: day.diaSemana || null,
        exercises: day.exercises
          .filter((e) => e.name.trim())
          .map((e, ei) => ({
            name: e.name.trim(),
            sets: e.sets ? parseInt(e.sets) : null,
            reps: e.reps.trim() || null,
            rest_seconds: e.rest_seconds ? parseInt(e.rest_seconds) : null,
            notes: e.notes.trim() || null,
            order: ei,
          })),
      })),
    }

    mutation.mutate(payload)
  }

  return (
    <div className="min-h-screen">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-green-400 hover:text-green-300 text-sm transition-colors">
          ← Voltar
        </Link>
        <h1 className="text-lg font-semibold">Novo treino</h1>
        <div className="w-16" />
      </nav>

      <main className="max-w-2xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações gerais */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">
                Nome do treino *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Treino A/B/C — Hipertrofia"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">
                Objetivo (opcional)
              </label>
              <input
                type="text"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Ex: Ganho de massa muscular"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>
          </div>

          {/* Dias de treino */}
          {days.map((day, dayIndex) => (
            <div key={day.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              {/* Cabeçalho do dia */}
              <div className="px-5 py-3 bg-gray-800 flex items-center gap-3">
                <input
                  type="text"
                  value={day.name}
                  onChange={(e) => updateDayName(day.id, e.target.value)}
                  placeholder={`Dia ${dayIndex + 1}`}
                  className="flex-1 bg-transparent text-green-400 font-semibold focus:outline-none placeholder-green-700"
                />
                <select
                  value={day.diaSemana}
                  onChange={(e) => updateDayWeekday(day.id, e.target.value)}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-green-500 transition-colors"
                >
                  <option value="">Sem dia fixo</option>
                  {WEEKDAYS.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </select>
                {days.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDay(day.id)}
                    className="text-gray-500 hover:text-red-400 text-xs transition-colors"
                  >
                    Remover dia
                  </button>
                )}
              </div>

              {/* Exercícios */}
              <div className="divide-y divide-gray-800">
                {day.exercises.map((ex) => (
                  <div key={ex.id} className="px-5 py-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={ex.name}
                        onChange={(e) => updateExercise(day.id, ex.id, 'name', e.target.value)}
                        placeholder="Nome do exercício"
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 transition-colors"
                      />
                      {day.exercises.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExercise(day.id, ex.id)}
                          className="text-gray-600 hover:text-red-400 transition-colors px-1"
                          title="Remover exercício"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Séries</label>
                        <input
                          type="number"
                          min="1"
                          value={ex.sets}
                          onChange={(e) => updateExercise(day.id, ex.id, 'sets', e.target.value)}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Reps</label>
                        <input
                          type="text"
                          value={ex.reps}
                          onChange={(e) => updateExercise(day.id, ex.id, 'reps', e.target.value)}
                          placeholder="8-12"
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Descanso (s)</label>
                        <input
                          type="number"
                          min="0"
                          value={ex.rest_seconds}
                          onChange={(e) => updateExercise(day.id, ex.id, 'rest_seconds', e.target.value)}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 transition-colors"
                        />
                      </div>
                    </div>

                    <input
                      type="text"
                      value={ex.notes}
                      onChange={(e) => updateExercise(day.id, ex.id, 'notes', e.target.value)}
                      placeholder="Observações (opcional)"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-400 focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>
                ))}
              </div>

              {/* Adicionar exercício */}
              <div className="px-5 py-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => addExercise(day.id)}
                  className="text-green-500 hover:text-green-400 text-sm transition-colors"
                >
                  + Adicionar exercício
                </button>
              </div>
            </div>
          ))}

          {/* Adicionar dia */}
          <button
            type="button"
            onClick={addDay}
            className="w-full py-3 rounded-xl border border-dashed border-gray-700 hover:border-green-500/60 text-gray-500 hover:text-green-400 text-sm transition-colors"
          >
            + Adicionar dia de treino
          </button>

          {/* Salvar */}
          <button
            type="submit"
            disabled={mutation.isPending || !name.trim()}
            className="w-full py-3 bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-950 font-semibold rounded-xl transition-colors"
          >
            {mutation.isPending ? 'Salvando...' : 'Salvar treino'}
          </button>

          {mutation.isError && (
            <p className="text-red-400 text-sm text-center">
              Erro ao salvar treino. Tente novamente.
            </p>
          )}
        </form>
      </main>
    </div>
  )
}
