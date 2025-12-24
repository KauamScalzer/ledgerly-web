import GoogleIcon from './GoogleIcon'

type GoogleLoginButtonProps = {
  onClick: () => void | Promise<void>
  disabled?: boolean
  isLoading?: boolean
  clientId?: string
  isReady?: boolean
}

function GoogleLoginButton({
  onClick,
  disabled = false,
  isLoading = false,
  clientId,
  isReady = false,
}: GoogleLoginButtonProps) {
  const buttonLabel = isLoading ? 'Conectando...' : 'Entrar com Google'

  return (
    <div className="google-button-wrapper">
      <button
        className="google-button"
        onClick={onClick}
        disabled={disabled || !clientId || !isReady}
        aria-busy={isLoading}
        type="button"
      >
        <GoogleIcon />
        {buttonLabel}
      </button>

      {clientId && !isReady && <p className="muted">Carregando SDK do Google...</p>}
    </div>
  )
}

export default GoogleLoginButton
