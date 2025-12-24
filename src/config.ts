const cleanBaseUrl = (url?: string): string | undefined => {
  if (!url) return undefined
  return url.endsWith('/') ? url.slice(0, -1) : url
}

export const googleClientId: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID
export const apiBaseUrl: string | undefined = cleanBaseUrl(import.meta.env.VITE_API_URL)
