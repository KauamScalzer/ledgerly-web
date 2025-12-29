import './App.css'
import DebtsPage from './pages/Debts'
import LoginPage from './pages/Login'
import { useAuthContext } from './context/AuthContext'

function App() {
  const { user, loading } = useAuthContext()

  if (loading) {
    return (
      <main className="page">
        <p className="muted">Carregando sessão...</p>
      </main>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return <DebtsPage />
}

export default App
