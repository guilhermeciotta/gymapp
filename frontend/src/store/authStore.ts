import { create } from 'zustand'
import api from '../lib/axios'

interface User {
  id: number
  name: string
  email: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, password_confirmation: string) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    set({ user: data.user, token: data.token })
  },

  register: async (name, email, password, password_confirmation) => {
    const { data } = await api.post('/auth/register', {
      name,
      email,
      password,
      password_confirmation,
    })
    localStorage.setItem('token', data.token)
    set({ user: data.user, token: data.token })
  },

  logout: async () => {
    await api.post('/auth/logout').catch(() => null)
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  fetchMe: async () => {
    set({ isLoading: true })
    try {
      const { data } = await api.get('/auth/me')
      set({ user: data })
    } catch {
      localStorage.removeItem('token')
      set({ user: null, token: null })
    } finally {
      set({ isLoading: false })
    }
  },
}))
