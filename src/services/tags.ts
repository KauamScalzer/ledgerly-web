import { apiBaseUrl } from '../config'

export type Tag = {
  id: number
  name: string
  color?: string
}

const messagesByStatus: Record<number, string> = {
  401: 'Sessão expirada ou não autorizada.',
  500: 'Erro interno ao carregar tags.',
}

const getToken = () => localStorage.getItem('authToken') ?? ''

export async function fetchTags(): Promise<Tag[]> {
  const endpoint = `${apiBaseUrl ?? ''}/tags`

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  })

  if (!response.ok) {
    const message = messagesByStatus[response.status] || 'Não foi possível carregar tags.'
    throw new Error(message)
  }

  return response.json()
}

export async function createTag(name: string): Promise<Tag> {
  const endpoint = `${apiBaseUrl ?? ''}/tags`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ name }),
  })

  if (!response.ok) {
    const message = messagesByStatus[response.status] || 'Não foi possível criar a tag.'
    throw new Error(message)
  }

  return response.json()
}
