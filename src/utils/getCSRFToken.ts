const COOKIE_NAME="_mycelium_csrf_token"

const toHex = (byteArray: Uint8Array): string => {
  return Array.from(byteArray, (byte) => (byte < 16 ? '0' : '') + (byte).toString(16)).join('')
}

export const getCSRFToken = (): string => {
  const cookieValue = document.cookie
    .split('; ')
    .find((row) => row.startsWith(COOKIE_NAME))
    ?.split('=')[1]

  return cookieValue || ""
}

export const genCSRFToken = (): string => {
  const token = toHex(crypto.getRandomValues(new Uint8Array(32)))

  document.cookie = `${COOKIE_NAME}=${token}`

  return token
}
