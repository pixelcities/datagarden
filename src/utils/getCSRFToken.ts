import { toHex } from './helpers'

const COOKIE_NAME="_mycelium_csrf_token"

export const getCSRFToken = (): string => {
  const cookieValue = document.cookie
    .split('; ')
    .find((row) => row.startsWith(COOKIE_NAME))
    ?.split('=')[1]

  return cookieValue || ""
}

export const genCSRFToken = (): string => {
  const token = toHex(crypto.getRandomValues(new Uint8Array(32)))
  const domain = new URL(window.origin).hostname

  document.cookie = `${COOKIE_NAME}=${token}; Domain=${domain === "localhost" ? "" : "."}${domain}; Path=/; SameSite=Strict; Secure`

  return token
}
