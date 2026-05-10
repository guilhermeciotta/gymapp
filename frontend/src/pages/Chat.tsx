import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormEvent, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../lib/axios'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface Conversation {
  id: number
  title: string
  created_at: string
}

const WORKOUT_JSON_MARKER = '===WORKOUT_JSON_START==='

function hasWorkoutJson(content: string) {
  return content.includes(WORKOUT_JSON_MARKER)
}

export default function Chat() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [savingWorkout, setSavingWorkout] = useState(false)
  const [savedWorkoutId, setSavedWorkoutId] = useState<number | null>(null)

  const { data: conversations } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: () => api.get('/conversations').then((r) => r.data),
  })

  const { data: messages, refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ['messages', id],
    queryFn: () => api.get(`/conversations/${id}/messages`).then((r) => r.data),
    enabled: !!id,
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const createConversation = async () => {
    const { data } = await api.post('/conversations', { title: 'Nova conversa' })
    queryClient.invalidateQueries({ queryKey: ['conversations'] })
    navigate(`/chat/${data.id}`)
  }

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming || !id) return

    const userMessage = input.trim()
    setInput('')
    setIsStreaming(true)
    setStreamingContent('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/conversations/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: userMessage }),
      })

      if (!response.body) throw new Error('No stream body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') continue
          try {
            const parsed = JSON.parse(raw)
            fullContent += parsed.token ?? ''
            setStreamingContent(fullContent)
          } catch {
            // ignorar linhas malformadas
          }
        }
      }
    } finally {
      setIsStreaming(false)
      setStreamingContent('')
      refetchMessages()
    }
  }

  const saveWorkout = async () => {
    if (!id) return
    setSavingWorkout(true)
    try {
      const { data } = await api.post(`/conversations/${id}/save-workout`)
      setSavedWorkoutId(data.id)
      queryClient.invalidateQueries({ queryKey: ['workouts'] })
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Erro ao salvar treino.')
    } finally {
      setSavingWorkout(false)
    }
  }

  const lastAssistantMsg = messages?.filter((m) => m.role === 'assistant').at(-1)
  const canSaveWorkout = lastAssistantMsg && hasWorkoutJson(lastAssistantMsg.content)

  return (
    <div className="min-h-screen flex">
      {/* Sidebar de conversas */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <Link to="/" className="text-green-400 text-sm hover:text-green-300">
            ← Dashboard
          </Link>
          <button
            onClick={createConversation}
            className="w-full mt-3 bg-green-500 hover:bg-green-400 text-gray-950 font-semibold py-2 rounded-lg text-sm transition-colors"
          >
            + Nova conversa
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {conversations?.map((c) => (
            <Link
              key={c.id}
              to={`/chat/${c.id}`}
              className={`block px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                c.id.toString() === id
                  ? 'bg-green-500/20 text-green-400'
                  : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              {c.title}
            </Link>
          ))}
        </div>
      </aside>

      {/* Área principal */}
      <div className="flex-1 flex flex-col">
        {!id ? (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <p className="text-2xl font-bold text-green-400 mb-2">Olá! Sou seu personal trainer IA</p>
              <p className="text-gray-400 mb-6">
                Inicie uma conversa para montar seu treino personalizado.
              </p>
              <button
                onClick={createConversation}
                className="bg-green-500 hover:bg-green-400 text-gray-950 font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Iniciar conversa
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages?.length === 0 && !isStreaming && (
                <p className="text-gray-500 text-center py-8">
                  Olá! Me conte seu objetivo, quantos dias por semana você treina e seu nível de experiência.
                </p>
              )}

              {messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-2xl rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-900 text-gray-100'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>
                          {msg.content.replace(/===WORKOUT_JSON_START===[\s\S]*?===WORKOUT_JSON_END===/g, '')}
                        </ReactMarkdown>
                        {hasWorkoutJson(msg.content) && (
                          <p className="text-green-400 text-sm mt-2 not-prose">
                            Treino estruturado disponível para salvar
                          </p>
                        )}
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {isStreaming && streamingContent && (
                <div className="flex justify-start">
                  <div className="max-w-2xl bg-gray-900 rounded-2xl px-4 py-3">
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{streamingContent}</ReactMarkdown>
                    </div>
                    <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-1" />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Barra salvar treino */}
            {canSaveWorkout && !savedWorkoutId && (
              <div className="bg-green-900/30 border-t border-green-500/30 px-6 py-3 flex items-center justify-between">
                <p className="text-green-400 text-sm">
                  Treino pronto! Deseja salvar no seu perfil?
                </p>
                <button
                  onClick={saveWorkout}
                  disabled={savingWorkout}
                  className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-gray-950 font-semibold px-4 py-1.5 rounded-lg text-sm transition-colors"
                >
                  {savingWorkout ? 'Salvando...' : 'Salvar treino'}
                </button>
              </div>
            )}

            {savedWorkoutId && (
              <div className="bg-green-900/30 border-t border-green-500/30 px-6 py-3 flex items-center justify-between">
                <p className="text-green-400 text-sm">Treino salvo com sucesso!</p>
                <Link
                  to={`/workouts/${savedWorkoutId}`}
                  className="text-green-400 underline text-sm hover:text-green-300"
                >
                  Ver treino
                </Link>
              </div>
            )}

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-800 flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua mensagem..."
                disabled={isStreaming}
                className="flex-1 bg-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isStreaming || !input.trim()}
                className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-gray-950 font-semibold px-5 py-3 rounded-xl transition-colors"
              >
                {isStreaming ? '...' : 'Enviar'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
