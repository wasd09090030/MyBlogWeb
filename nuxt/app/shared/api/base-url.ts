export function resolveApiBaseURL(): string {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  if (apiBase) {
    if (process.server && apiBase.startsWith('/')) {
      return `http://127.0.0.1:5000${apiBase}`
    }
    return apiBase
  }

  return process.env.NODE_ENV === 'production'
    ? '/api'
    : 'http://localhost:5000/api'
}