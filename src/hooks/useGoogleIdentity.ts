import { useCallback, useEffect, useRef, useState } from 'react'

const GOOGLE_SDK_SRC = 'https://accounts.google.com/gsi/client'

type UseGoogleIdentityReturn = {
  loading: boolean
  isReady: boolean
  error: string
  getCredential: () => Promise<string>
}

export function useGoogleIdentity(clientId?: string): UseGoogleIdentityReturn {
  const [loading, setLoading] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState('')
  const initializedRef = useRef(false)

  useEffect(() => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${GOOGLE_SDK_SRC}"]`,
    )

    if (existingScript) {
      if (existingScript.dataset.loaded === 'true') {
        setIsReady(true)
        setLoading(false)
      } else {
        existingScript.onload = () => {
          existingScript.dataset.loaded = 'true'
          setIsReady(true)
          setLoading(false)
        }
        existingScript.onerror = () => {
          setError('Não foi possível carregar o serviço de login do Google.')
          setLoading(false)
        }
      }
      return
    }

    const script = document.createElement('script')
    script.src = GOOGLE_SDK_SRC
    script.async = true
    script.defer = true
    script.dataset.googleIdentity = 'true'
    script.onload = () => {
      script.dataset.loaded = 'true'
      setIsReady(true)
      setLoading(false)
    }
    script.onerror = () => {
      setError('Não foi possível carregar o serviço de login do Google.')
      setLoading(false)
    }

    document.head.appendChild(script)

    return () => {
      script.onload = null
      script.onerror = null
    }
  }, [])

  const initializeSdk = useCallback(
    (callback: (response: google.accounts.id.CredentialResponse) => void) => {
      if (!window.google?.accounts?.id) {
        throw new Error('Google Identity Services indisponível.')
      }

      if (!clientId) {
        throw new Error('VITE_GOOGLE_CLIENT_ID não configurado. Defina-o para habilitar o login.')
      }

      if (!initializedRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true,
          ux_mode: 'popup',
          callback,
        })
        initializedRef.current = true
      } else {
        // update callback without reconfiguring other settings
        window.google.accounts.id.initialize({
          client_id: clientId,
          use_fedcm_for_prompt: true,
          callback,
        })
      }
    },
    [clientId],
  )

  const getCredential = useCallback(() => {
    return new Promise<string>((resolve, reject) => {
      if (!isReady) {
        reject(new Error('SDK do Google ainda está carregando. Tente novamente em instantes.'))
        return
      }

      let completed = false

      try {
        initializeSdk((response) => {
          if (response?.credential) {
            completed = true
            resolve(response.credential)
          } else {
            reject(new Error('Não recebemos o token do Google.'))
          }
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao iniciar login com Google.'
        reject(new Error(message))
        return
      }

      window.google.accounts.id.prompt((notification) => {
        if (completed) return

        const momentType = notification.getMomentType?.()

        switch (momentType) {
          case 'display':
            return
          case 'dismissed':
            reject(new Error('Login do Google foi fechado. Tente novamente.'))
            break
          case 'skipped':
            reject(
              new Error('Login do Google não pôde ser exibido. Verifique pop-ups, FedCM e cookies.'),
            )
            break
          default:
            reject(new Error('Login do Google não pôde ser exibido.'))
        }
      })
    })
  }, [initializeSdk, isReady])

  return { loading, isReady, error, getCredential }
}
