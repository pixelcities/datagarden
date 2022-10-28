const COOKIE_NAME="_mycelium_csrf_token"

export const getCSRFToken = (): string => {
  const cookieValue = document.cookie
    .split('; ')
    .find((row) => row.startsWith(COOKIE_NAME))
    ?.split('=')[1]

  return cookieValue || ""
}

export const genCSRFToken = (): string => {
  const token = crypto.randomUUID()

  document.cookie = `${COOKIE_NAME}=${token}`

  return token
}
