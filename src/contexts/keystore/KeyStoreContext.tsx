import React, { useRef, useCallback, useState, useEffect, useContext, useMemo, FC } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock } from '@fortawesome/free-solid-svg-icons'
import { useLocation } from "react-router-dom"
import { Mutex } from 'async-mutex'

import { useAppSelector } from 'hooks'
import { selectSecrets } from 'state/selectors'

import { useAuthContext } from 'contexts';

import type { KeyStore, Protocol } from '@pixelcities/key-x-wasm';

interface KeyStoreContextI {
  keyStore?: any
  keyStoreIsReady?: boolean,
  protocol?: any,
  __setIsReady__?: any
}

let keyStoreRef: KeyStore | undefined

const KeyStoreContext = React.createContext<KeyStoreContextI>({});

export const KeyStoreProvider: FC = ({ children }) => {
  const location = useLocation()

  const [loading, setLoading] = useState<boolean>(false);
  const [keyStore, setKeyStore] = useState<KeyStore | undefined>();
  const [protocol, setProtocol] = useState<Protocol | undefined>();
  const [password, setPassword] = useState("")
  const [isLocked, setIsLocked] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState(false)

  const { isAuthenticated, user } = useAuthContext();

  const mutex = useMemo(() => new Mutex(), [])

  const keyCache = useRef<any>(new Set())
  const secrets = useAppSelector(selectSecrets)

  useEffect(() => {
    if (isReady) {
      mutex.runExclusive(async () => {
        for (const secret of secrets) {
          if (! keyCache.current.has(secret.key_id)) {
            const key: string = await protocol?.decrypt(secret.owner, secret.ciphertext)

            // Special hello message
            if (secret.key_id === secret.owner) {
              keyCache.current.add(secret.key_id)

            // Key shares
            } else {
              const key_id: string = await keyStore?.add_key(secret.key_id, key)
              console.log("Received new key: ", key_id)
              keyCache.current.add(key_id)
            }
          }
        }
      })
    }
  }, [ isReady, keyCache, secrets, keyStore, protocol, mutex ])

  const init = async () => {
    setLoading(true)
    setIsReady(false)

    const { KeyStore, Protocol } = await import("@pixelcities/key-x-wasm")

    keyStoreRef = new KeyStore(process.env.REACT_APP_API_BASE_PATH)
    setKeyStore(keyStoreRef)
    setProtocol(new Protocol())
    setIsLocked(true)

    setLoading(false)
  }

  useEffect(()=> {
    init();
  },[])


  const handleSubmit = useCallback((e: any) => {
    e.preventDefault()
    setError(false)

    if (user) {
      if (password.length >= 8) {
        keyStore?.open_sesame(user.email, password)

        keyStore?.init().then(() => {
          setIsLocked(false)

          const secret_key = keyStore?.get_named_key("protocol")
          protocol?.init(secret_key, process.env.REACT_APP_API_BASE_PATH).then(() => {
            setIsReady(true)
          })
        }).catch(() => {
          setError(true)
        })
      } else {
        setError(true)
      }
    }
  }, [ user, password, keyStore, protocol ])

  const isActive = useMemo(() => isAuthenticated && (keyStore?.is_locked() ?? true) && isLocked, [ isAuthenticated, keyStore, isLocked ])

  const renderModal = useMemo(() => {
    const path = location.pathname
    const skipModal = path === "/logout" ||
      path.startsWith("/auth/local/confirm/") ||
      path.startsWith("/users/profile/confirm_email/") ||
      path.startsWith("/pages/") ||
      path.startsWith("/terms") ||
      path.startsWith("/privacy") ||
      path.startsWith("/contact") ||
      path.startsWith("/pricing") ||
      path.startsWith("/checkout") ||
      path.startsWith("/error")

    return (
      <div className={"modal " + (isActive && !skipModal ? "is-active" : "")}>
        <div className="modal-background"></div>
        <div className="modal-content">
          <div className="box">
            <form onSubmit={handleSubmit}>
              <div className="field has-addons">
                <p className="control has-icons-left is-expanded">
                  <input className={"input" + (error ? " is-danger" : "")} style={{height: "40px"}} type="password" placeholder="Password" value={password} onChange={(e: any) => setPassword(e.target.value)} />
                  <span className="icon is-small is-left">
                    <FontAwesomeIcon icon={faLock} size="xs"/>
                  </span>
                </p>
                <p className="control">
                  <input type="submit" className={"button " + (error ? "is-danger" : "is-info")} value="Unlock" />
                </p>
              </div>
            </form>
          </div>
        </div>

        <div className="modal-footer">
          <a className="fineprint-label label-size-1 is-white" href="/logout"> Logout </a>
        </div>
      </div>
    )
  }, [ isActive, error, location.pathname, handleSubmit, password ])

  return (
    <KeyStoreContext.Provider value={{keyStore, keyStoreIsReady: isReady, protocol, __setIsReady__: setIsReady}} >
      <div className={"pageloader is-bottom-to-top" + (loading ? " is-active" : "")}>
        <span className="title">
          Loading...
        </span>
      </div>

      { renderModal }

      { children }

    </KeyStoreContext.Provider>
  )
}

export const useKeyStoreContext = () =>  useContext(KeyStoreContext);
export {
  keyStoreRef
}
