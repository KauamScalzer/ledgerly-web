import { apiBaseUrl } from '../config'
import type { Tag } from './tags'

export type Debt = {
  id: number
  ownerUserId: number
  tagId: number | null
  type: 'PAYABLE' | 'RECEIVABLE'
  amountCents: number
  description: string
  dueDate: string
  paid: boolean
  paidAt: string | null
  createdAt: string
  updatedAt: string
  tag?: Tag
}

export type DebtListResponse = {
  data: Debt[]
  page: number
  limit: number
  total: number
}

export type DebtFilters = {
  tagId?: number | null
  type?: Debt['type'] | ''
  paid?: boolean | ''
  overdue?: boolean | ''
  order?: 'asc' | 'desc'
  orderBy?: 'amountCents' | 'dueDate' | 'paid'
  dueMonth?: string
  description?: string
  page?: number
  limit?: number
}

export type CreateDebtPayload = {
  tagId: number
  type: Debt['type']
  amountCents: number
  description: string
  dueDate: string
  paid?: boolean
}

const messagesByStatus: Record<number, string> = {
  401: 'Sessão expirada ou não autorizada.',
  500: 'Erro interno ao listar débitos.',
}

const getToken = () => localStorage.getItem('authToken') ?? ''

export async function fetchDebts(filters: DebtFilters = {}): Promise<DebtListResponse> {
  const params = new URLSearchParams()

  if (filters.tagId !== undefined && filters.tagId !== null && !Number.isNaN(filters.tagId)) {
    params.append('tagId', String(filters.tagId))
  }
  if (filters.type) {
    params.append('type', filters.type)
  }
  if (filters.paid !== undefined && filters.paid !== '') {
    params.append('paid', String(filters.paid))
  }
  if (filters.overdue !== undefined && filters.overdue !== '') {
    params.append('overdue', String(filters.overdue))
  }
  if (filters.order) {
    params.append('order', filters.order)
  }
  if (filters.orderBy) {
    params.append('orderBy', filters.orderBy)
  }
  if (filters.dueMonth) {
    params.append('dueMonth', filters.dueMonth)
  }
  if (filters.description) {
    params.append('description', filters.description)
  }
  if (filters.page) {
    params.append('page', String(filters.page))
  }
  if (filters.limit) {
    params.append('limit', String(filters.limit))
  }

  const endpoint = `${apiBaseUrl ?? ''}/debts${params.toString() ? `?${params.toString()}` : ''}`

  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
  })

  if (!response.ok) {
    const message = messagesByStatus[response.status] || 'Não foi possível carregar os débitos.'
    throw new Error(message)
  }

  return response.json()
}

export async function createDebt(payload: CreateDebtPayload): Promise<Debt> {
  const endpoint = `${apiBaseUrl ?? ''}/debts`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = messagesByStatus[response.status] || 'Não foi possível criar o débito.'
    throw new Error(message)
  }

  return response.json()
}
