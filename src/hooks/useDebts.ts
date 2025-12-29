import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchDebts, type Debt, type DebtFilters, type DebtListResponse } from '../services/debts'

type UseDebtsState = {
  items: Debt[]
  loading: boolean
  error: string
  page: number
  limit: number
  total: number
}

const initialState: UseDebtsState = {
  items: [],
  loading: false,
  error: '',
  page: 1,
  limit: 10,
  total: 0,
}

export function useDebts(initialFilters: DebtFilters = { limit: 10 }) {
  const [filters, setFilters] = useState<DebtFilters>(initialFilters)
  const [state, setState] = useState<UseDebtsState>(initialState)

  const load = useCallback(
    async (params?: Partial<DebtFilters>) => {
      const nextFilters = { ...filters, ...params }
      setFilters(nextFilters)
      setState((prev) => ({ ...prev, loading: true, error: '' }))

      try {
        const result: DebtListResponse = await fetchDebts(nextFilters)
        setState((prev) => ({
          ...prev,
          items: result.data,
          page: result.page,
          limit: result.limit,
          total: result.total,
          loading: false,
          error: '',
        }))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar débitos.'
        setState((prev) => ({ ...prev, loading: false, error: message }))
      }
    },
    [filters],
  )

  useEffect(() => {
    void load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const pageCount = useMemo(() => Math.ceil(state.total / state.limit) || 1, [state.total, state.limit])

  return {
    ...state,
    filters,
    setFilters: (next: Partial<DebtFilters>) => setFilters((prev) => ({ ...prev, ...next })),
    reload: load,
    pageCount,
  }
}
