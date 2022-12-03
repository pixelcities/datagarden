import React, { useRef, useState, useEffect, useContext, useMemo, FC } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock } from '@fortawesome/free-solid-svg-icons'

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
  const [loading, setLoading] = useState<boolean>(false);
  const [keyStore, setKeyStore] = useState<KeyStore | undefined>();
  const [protocol, setProtocol] = useState<Protocol | undefined>();
  const [password, setPassword] = useState("")
  const [isLocked, setIsLocked] = useState(true)
  const [isReady, setIsReady] = useState(false)

  const { isAuthenticated, user } = useAuthContext();

  const keyCache = useRef<any>(new Set())
  const secrets = useAppSelector(selectSecrets)

  useEffect(() => {
    if (isReady) {
      secrets.forEach(secret => {
        if (! keyCache.current.has(secret.key_id)) {
          protocol?.decrypt(secret.owner, secret.ciphertext).then((key: string) => {
            keyStore?.add_key(secret.key_id, key).then((key_id: string) => {
              console.log("Received new key: ", key_id)
              keyCache.current.add(key_id)
            })
          })
        }
      })
    }
  }, [ isReady, keyCache, secrets, keyStore, protocol ])

  const init = async () => {
    setLoading(true)
    setIsReady(false)

    const { KeyStore, Protocol } = await import("@pixelcities/key-x-wasm")

    keyStoreRef = new KeyStore()
    setKeyStore(keyStoreRef)
    setProtocol(new Protocol())
    setIsLocked(true)

    setLoading(false)
  }

  useEffect(()=> {
    init();
  },[])


  const handleSubmit = (e: any) => {
    e.preventDefault();

    if (user) {
      keyStore?.open_sesame(user.email, password)

      keyStore?.init().then(() => {
        const secret_key = keyStore?.get_named_key("protocol")
        protocol?.init(secret_key).then(() => {
          setIsReady(true)
        })
      })

      setIsLocked(false)
    }
  }

  const isActive = useMemo(() => isAuthenticated && (keyStore?.is_locked() ?? true) && isLocked, [ isAuthenticated, keyStore, isLocked ])
  const unlockModal = (children: any) => {
    return (
      <>
       <div className={"modal " + (isActive ? "is-active" : "")}>
          <div className="modal-background"></div>
          <div className="modal-content">
            <div className="box">
              <form onSubmit={handleSubmit}>
                <div className="field has-addons">
                  <p className="control has-icons-left is-expanded">
                    <input className="input" style={{height: "40px"}} type="password" placeholder="Password" value={password} onChange={(e: any) => setPassword(e.target.value)} />
                    <span className="icon is-small is-left">
                      <FontAwesomeIcon icon={faLock} size="xs"/>
                    </span>
                  </p>
                  <p className="control">
                    <input type="submit" className="button is-info" value="Unlock" />
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>

        { children }
      </>
    )
  }

  return (
    <KeyStoreContext.Provider value={{keyStore, keyStoreIsReady: isReady, protocol, __setIsReady__: setIsReady}} >
      <div className={"pageloader is-bottom-to-top" + (loading ? " is-active" : "")}>
        <span className="title">
          Loading...
        </span>
      </div>

      { unlockModal(children) }

    </KeyStoreContext.Provider>
  )
}

export const useKeyStoreContext = () =>  useContext(KeyStoreContext);
export {
  keyStoreRef
}
