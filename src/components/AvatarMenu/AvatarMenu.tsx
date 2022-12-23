import React, { FC, useRef, useEffect, useState } from 'react'
import { Link, useParams } from "react-router-dom"

import './AvatarMenu.sass'

import { useAuthContext } from 'contexts'
import { toColor } from 'utils/helpers'

const MARGIN = 5

interface AvatarMenuProps {
}

const AvatarMenu: FC<AvatarMenuProps> = (props) => {
  const ref = useRef<HTMLImageElement | null>(null)
  const [top, setTop] = useState(0)
  const [right, setRight] = useState(0)
  const [isActive, setIsActive] = useState(false)

  const { isAuthenticated, user } = useAuthContext();

  const { handle } = useParams<{handle: string}>()

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const width = document.documentElement.clientWidth

      setTop(rect.top)
      setRight(width - rect.right)
    }
  }, [ref]);

  return (
    <>
      { isAuthenticated ?
        <img ref={ref} src={user?.picture} className={"avatar" + (!(user?.picture) ? " default-icon bg-" + toColor(user?.id) : "")} alt={user?.email[0]?.toUpperCase()} width="40" height="35" onClick={() => setIsActive(!isActive)} />
      :
        <Link className="button is-medium is-light is-outlined" to="/login">
          Log in
        </Link>
      }

      { ! isActive ?
        <></>
      :
        <div className="menu-container" style={{right: right - MARGIN, top: top - MARGIN}}>

          <div className="avatar-box">
            <div className="avatar-title">
              <p className="title is-size-4" style={{ marginBottom: 0, padding: 0 }}> { user?.name || user?.email.split("@")[0] } </p>
              <p className="fineprint-label label-size-2 is-left pt-1"> { user?.email } </p>
            </div>

            <ul className="avatar-menu-list py-2">
              <li>
                <Link className="button-label is-grey label-size-3" to="/profile"> Profile </Link>
              </li>

              { handle ?
                <li>
                  <hr className="dropdown-divider" />
                  <Link className="button-label is-grey label-size-3" to={"/" + handle + "/contacts"}> Contacts </Link>
                </li>
              : null }

              { handle ?
                <li>
                  <hr className="dropdown-divider" />
                  <Link className="button-label is-grey label-size-3" to={"/" + handle + "/keys"}> KeyStore </Link>
                </li>
              : null }

              <li>
                <hr className="dropdown-divider" />
                <Link className="button-label is-grey label-size-3" to="/logout"> Logout </Link>
             </li>

            </ul>

          </div>
        </div>
      }
    </>
  )
}

export default AvatarMenu;
