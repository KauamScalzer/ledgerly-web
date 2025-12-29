import { useCallback, useEffect, useState } from 'react'
import { createTag, fetchTags, type Tag } from '../services/tags'

type UseTagsState = {
  items: Tag[]
  loading: boolean
  error: string
}

const initialState: UseTagsState = { items: [], loading: false, error: '' }

export function useTags() {
  const [state, setState] = useState<UseTagsState>(initialState)

  const reload = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }))
    try {
      const result = await fetchTags()
      setState({ items: result, loading: false, error: '' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar tags.'
      setState({ items: [], loading: false, error: message })
    }
  }, [])

  const addTag = useCallback(
    async (name: string) => {
      const newTag = await createTag(name)
      await reload()
      return newTag
    },
    [reload],
  )

  useEffect(() => {
    void reload()
  }, [reload])

  return { ...state, reload, addTag }
}
