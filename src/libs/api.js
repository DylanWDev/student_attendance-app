class ApiError extends Error {
  constructor(code) {
    super(code)
    this.code = code
  }
}

async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    ...options,
  })

  if (res.status === 204) return null

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError(data?.error ?? 'SERVER_ERROR')
  }
  return data
}

export const apiGet = (path) => request(path)
export const apiPost = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) })
export const apiPut = (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) })
export const apiDelete = (path) => request(path, { method: 'DELETE' })
