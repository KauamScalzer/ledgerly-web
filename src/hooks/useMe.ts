import { useAuthContext } from '../context/AuthContext'

export function useMe() {
  const { user, loading, error, refreshUser } = useAuthContext()
  return { user, loading, error, refreshUser }
}
