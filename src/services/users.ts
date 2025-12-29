import { apiBaseUrl } from '../config'
import type { User } from './auth'

const messagesByStatus: Record<number, string> = {
  401: 'Sessão expirada ou não autorizada.',
  500: 'Erro interno ao recuperar seus dados.',
}

export async function fetchCurrentUser(token: string): Promise<User> {
  const endpoint = `${apiBaseUrl ?? ''}/users/me`

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const message = messagesByStatus[response.status] || 'Não foi possível carregar seu perfil.'
    throw new Error(message)
  }

  return response.json()
}
