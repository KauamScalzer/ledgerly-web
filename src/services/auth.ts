export type User = {
  id: number
  googleSub: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
}

export type AuthResponse = {
  accessToken: string
  user: User
}

import { apiBaseUrl } from '../config'

const messagesByStatus: Record<number, string> = {
  400: 'Payload inválido',
  401: 'Token Google inválido ou não autorizado',
  500: 'Configuração ausente ou erro interno',
}

export async function loginWithGoogleToken(token: string): Promise<AuthResponse> {
  const endpoint = `${apiBaseUrl ?? ''}/auth/google`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  })

  if (!response.ok) {
    const message = messagesByStatus[response.status] || 'Erro inesperado. Tente novamente.'
    throw new Error(message)
  }

  const data = (await response.json()) as AuthResponse
  return data
}
