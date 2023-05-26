import React, { useState, useEffect, useCallback, useContext, FC } from "react";

import { useAppSelector, useAppDispatch } from 'hooks'
import { selectUserById, selectActiveDataSpace } from 'state/selectors'
import { login } from 'state/actions'
import { User } from 'types'


interface AuthContextI {
  isAuthenticated: boolean,
  handleLogin: any,
  handleLogout: any,
  path: string,
  setPath: any,
  user?: User
}

const AuthContext = React.createContext<AuthContextI>({isAuthenticated: false, handleLogin: null, handleLogout: null, path: "", setPath: null});

export const AuthProvider: FC = ({ children }) => {
  const dispatch = useAppDispatch()

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [path, setPath] = useState<string>("")
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState("")

  const dataSpace = useAppSelector(selectActiveDataSpace)

  // Handle user update events, so that components using the auth context don't have to
  const userState = useAppSelector(state => selectUserById(state, user?.id))
  useEffect(() => {
    if (userState && dataSpace?.handle !== "trial") {
      setUser(userState)
    }
  }, [ userState, dataSpace ])

  const handleLogin = useCallback((user?: User) => {
    if (user) {
      dispatch(login(user))
      setUser(user)
      setIsAuthenticated(true)

      setError(user.confirmed_at === null ? "Email is unconfirmed" : "")
    }
  }, [ dispatch, setUser, setIsAuthenticated ])

  const handleLogout = () => setIsAuthenticated(false)

  // Just check if the session is authenticated, if not it attempts to redirect so just error out
  const loginRequest = useCallback(() => {
    fetch(process.env.REACT_APP_API_BASE_PATH + "/users/me", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      redirect: 'error'
    }).then((response) => {
      if (response.ok) {
        handleLogin()

        response.json()
          .then((resp) => {
            handleLogin(resp)
            setIsLoading(false)
          })
      }
    }).catch((e) => setIsLoading(false))
  }, [ handleLogin ])

  useEffect(() => {
    if (!isAuthenticated) {
      loginRequest()
    } else {
      setIsLoading(false)
    }
  }, [ isAuthenticated, loginRequest ])

  const renderError = (
    <div className="notification is-light is-danger">
      <button className="delete" onClick={() => loginRequest()} />
      { error }
    </div>
  )

  return (
    <AuthContext.Provider value={{isAuthenticated, handleLogin, handleLogout, path, setPath, user}} >
      { error !== "" && renderError }
      { !isLoading && children }
    </AuthContext.Provider>
  )
}

export const useAuthContext = () =>  useContext(AuthContext);

