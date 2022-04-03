export const getDataTokens = async (uri: string) => {
  return fetch(process.env.REACT_APP_API_BASE_PATH + "/users/datatokens", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "uri": uri
    })
  }).then((response) => {
    if (!response.ok) {
      return Promise.reject(response)
    } else {
      return response.json()
    }
  }).then((data) => {
    return data

  }).catch((e) => {
    console.log(e);
  });
}
