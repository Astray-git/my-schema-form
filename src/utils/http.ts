const API_BASE = 'http://127.0.0.1:8001'

/**
 * get request
 * @param url relative url from the base endpoint (localhost:8001)
 * @returns data from server
 */
async function get<T>(url: string) {
  const response = await fetch(API_BASE + url)
  if (response.ok) {
    return response.json() as Promise<T>
  }
  return Promise.reject(response.json())
}

/**
 * post request
 * @param url relative url from the base endpoint (localhost:8001)
 * @param data request body payload object
 * @returns
 */
async function post<T>(url: string, data: Record<string, any>) {
  const response = await fetch(API_BASE + url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (response.ok) {
    return response.json() as Promise<T>
  }
  return Promise.reject(await response.json())
}

export const http = {
  get,
  post,
}
