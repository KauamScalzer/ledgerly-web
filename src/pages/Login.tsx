import { useEffect, useReducer } from 'react'
import GoogleLoginButton from '../components/GoogleLoginButton'
import { googleClientId } from '../config'
import { useGoogleIdentity } from '../hooks/useGoogleIdentity'
import { loginWithGoogleToken } from '../services/auth'
import { useAuthContext } from '../context/AuthContext'

type Status = 'idle' | 'loading' | 'success' | 'error'

type State = {
  status: Status
  message: string
}

type Action =
  | { type: 'loading'; message: string }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string }
  | { type: 'reset' }

const initialState: State = { status: 'idle', message: '' }

function stateReducer(_state: State, action: Action): State {
  switch (action.type) {
    case 'loading':
      return { status: 'loading', message: action.message }
    case 'success':
      return { status: 'success', message: action.message }
    case 'error':
      return { status: 'error', message: action.message }
    case 'reset':
    default:
      return initialState
  }
}

function LoginPage() {
  const [state, dispatch] = useReducer(stateReducer, initialState)
  const identity = useGoogleIdentity(googleClientId)
  const { setSession, refreshUser } = useAuthContext()

  useEffect(() => {
    if (identity.error) {
      dispatch({ type: 'error', message: identity.error })
    }
  }, [identity.error])

  const handleGoogleLogin = async (): Promise<void> => {
    dispatch({ type: 'loading', message: 'Conectando com o Google...' })

    try {
      const credential = await identity.getCredential()

      dispatch({
        type: 'loading',
        message: 'Finalizando autenticação...',
      })

      const data = await loginWithGoogleToken(credential)

      if (!data?.accessToken) {
        throw new Error('Token não recebido do servidor.')
      }

      setSession({ token: data.accessToken, user: data.user })
      await refreshUser()

      dispatch({
        type: 'success',
        message: `Bem-vindo, ${data?.user?.name || 'usuário'}!`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer login'
      dispatch({ type: 'error', message })
    }
  }

  return (
    <main className="page">
      <div className="brand-panel">
        <div className="badge">Ledgerly</div>
        <h1>
          Autenticação segura
          <span>para seus relatórios financeiros</span>
        </h1>
        <p>
          Faça login com o Google para entrar na plataforma e acessar seu dashboard em segurança.
        </p>
        <div className="gradient-orb" aria-hidden />
      </div>

      <section className="login-card" aria-live="polite">
        <div className="card-header">
          <p className="eyebrow">Acesse sua conta</p>
          <h2>Entrar com Google</h2>
          <p className="hint">Você será redirecionado ao dashboard após a autenticação.</p>
        </div>

        <GoogleLoginButton
          onClick={handleGoogleLogin}
          disabled={state.status === 'loading' || identity.loading}
          isLoading={state.status === 'loading'}
          clientId={googleClientId}
          isReady={identity.isReady}
        />

        <div className="status">
          {state.status === 'idle' && <p className="muted">Use sua conta Google para continuar.</p>}

          {state.status === 'loading' && <p className="muted">{state.message}</p>}

          {state.status === 'success' && <p className="success">{state.message}</p>}

          {state.status === 'error' && <p className="error">{state.message}</p>}

          {!googleClientId && (
            <p className="warning">
              Configure <code>VITE_GOOGLE_CLIENT_ID</code> para solicitar o token ao Google.
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

export default LoginPage
