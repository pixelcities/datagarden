import { getCSRFToken } from './getCSRFToken'

export const getDataTokens = async (uri: string, tag: string, mode: string) => {
  return fetch(process.env.REACT_APP_API_BASE_PATH + "/users/datatokens", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": getCSRFToken()
    },
    body: JSON.stringify({
      "uri": uri,
      "tag": tag,
      "mode": mode
    })
  }).then((response) => {
    if (!response.ok) {
      return Promise.reject(response)
    } else {
      return response.json()
    }
  }).then((data) => {
    return data

  });
}
