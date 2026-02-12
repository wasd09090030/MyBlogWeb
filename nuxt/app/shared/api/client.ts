import { resolveApiBaseURL } from '~/shared/api/base-url'

type FetchOptions = NonNullable<Parameters<typeof $fetch>[1]>

function normalizePath(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  if (path.startsWith('/')) return path
  return `/${path}`
}

export function createApiClient(baseURL = resolveApiBaseURL()) {
  const request = async <T = unknown>(path: string, options: FetchOptions = {}): Promise<T> => {
    const normalized = normalizePath(path)
    const target = /^https?:\/\//i.test(normalized) ? normalized : `${baseURL}${normalized}`
    return await $fetch<T>(target, options)
  }

  const get = async <T = unknown>(path: string, options: FetchOptions = {}): Promise<T> => {
    return await request<T>(path, { ...options, method: 'GET' })
  }

  const post = async <T = unknown>(path: string, body?: unknown, options: FetchOptions = {}): Promise<T> => {
    return await request<T>(path, { ...options, method: 'POST', body })
  }

  const patch = async <T = unknown>(path: string, body?: unknown, options: FetchOptions = {}): Promise<T> => {
    return await request<T>(path, { ...options, method: 'PATCH', body })
  }

  const put = async <T = unknown>(path: string, body?: unknown, options: FetchOptions = {}): Promise<T> => {
    return await request<T>(path, { ...options, method: 'PUT', body })
  }

  const del = async <T = unknown>(path: string, options: FetchOptions = {}): Promise<T> => {
    return await request<T>(path, { ...options, method: 'DELETE' })
  }

  return {
    baseURL,
    request,
    get,
    post,
    patch,
    put,
    del
  }
}

export async function withApiError<T>(scope: string, action: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (error) {
    console.error(`[${scope}] ${action}失败:`, error)
    throw error
  }
}