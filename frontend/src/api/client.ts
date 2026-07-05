import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface Language {
  name: string
  code: string
}

export interface TranslateResult {
  original: string
  translated: string
  source_language: string
  target_language: string
  confidence?: string
}

export interface MultiTranslateResult {
  original: string
  translations: Record<string, string>
  source_language: string
}


export interface HistoryEntry {
  id: number
  original: string
  translated: string
  source_language: string
  target_language: string
  mode: string
  created_at: string
}

export interface Analytics {
  total_translations: number
  total_favorites: number
  most_used_language: string | null
  translations_by_language: Record<string, number>
  translations_by_mode: Record<string, number>
  daily_counts: Record<string, number>
}

export interface FavoriteEntry {
  id: number
  original: string
  translated: string
  target_language: string
  created_at: string
}

export const fetchLanguages = () =>
  api.get<Language[]>('/translate/languages').then((r) => r.data)

export const translateText = (text: string, target_language: string) =>
  api
    .post<TranslateResult>('/translate/text', { text, target_language })
    .then((r) => r.data)

export const translateBatch = (texts: string[], target_language: string) =>
  api
    .post<{ results: TranslateResult[] }>('/translate/batch', {
      texts,
      target_language,
    })
    .then((r) => r.data.results)

export const translateMulti = (text: string, target_languages: string[]) =>
  api
    .post<MultiTranslateResult>('/translate/multi', {
      text,
      target_languages,
    })
    .then((r) => r.data)


export const detectLanguage = (text: string) =>
  api
    .post<{ language_code: string; language_name: string; confidence: string }>(
      '/translate/detect',
      null,
      { params: { text } },
    )
    .then((r) => r.data)

export const translateSpeech = (file: File, target_language: string) => {
  const form = new FormData()
  form.append('audio', file)
  form.append('target_language', target_language)
  return api
    .post<{
      recognized_text: string
      translated_text: string
      source_language: string
      target_language: string
    }>('/speech/translate', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data)
}

export const translateFile = (file: File, target_language: string) => {
  const form = new FormData()
  form.append('file', file)
  form.append('target_language', target_language)
  return api.post<TranslateResult>('/files/translate', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)
}

export const translateOCR = (file: File, target_language: string) => {
  const form = new FormData()
  form.append('image', file)
  form.append('target_language', target_language)
  return api.post<TranslateResult>('/ocr/translate', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)
}

export const fetchHistory = () =>
  api.get<HistoryEntry[]>('/history').then((r) => r.data)

export const fetchAnalytics = () =>
  api.get<Analytics>('/analytics').then((r) => r.data)

export const fetchFavorites = () =>
  api.get<FavoriteEntry[]>('/favorites').then((r) => r.data)

export const addFavorite = (original: string, translated: string, target_language: string) =>
  api.post<FavoriteEntry>('/favorites', { original, translated, target_language }).then((r) => r.data)

export const removeFavorite = (id: number) =>
  api.delete(`/favorites/${id}`)

export const textToSpeech = async (text: string, language: string) => {
  const response = await api.post('/tts', null, {
    params: { text, language },
    responseType: 'blob',
  })
  return URL.createObjectURL(response.data)
}

export const login = (username: string, password: string) =>
  api.post<{ access_token: string; username: string }>('/auth/login', {
    username,
    password,
  }).then((r) => r.data)

export const register = (username: string, email: string, password: string) =>
  api.post('/auth/register', { username, email, password }).then((r) => r.data)

export const getMe = () =>
  api.get<{ username: string; email: string }>('/auth/me').then((r) => r.data)

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail || error.message
  }
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred'
}
