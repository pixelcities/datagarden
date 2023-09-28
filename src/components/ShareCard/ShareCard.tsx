import React, { FC, useState } from 'react'

import { User } from 'types'
import { altAsSvg, toColor } from 'utils/helpers'

import HoverButton from 'components/HoverButton'


interface ShareCardProps {
  principal: string,
  user: User,
  isSelf: boolean,
  onDelete?: (user: User) => void
}

const ShareCard: FC<ShareCardProps> = ({ principal, user, isSelf, onDelete }) => {
  const [ showButton, setShowButton ] = useState(false)

  return (
    <div key={principal} className="columns mx-0 pt-2 pb-1 share-card" onMouseEnter={() => setShowButton(true)} onMouseLeave={() => setShowButton(false)}>
      <div className="column is-2 py-0">
        <span className="icon is-medium ml-3">
          <img src={user.picture || altAsSvg((user.name || user.email)?.[0]?.toUpperCase())} className={"is-rounded" + (!user.picture ? " default-icon is-medium bg-" + toColor(user.id) : "")} alt={(user.name || user.email)?.[0]?.toUpperCase()} />
        </span>
      </div>
      <div className="column is-7 py-0 has-text-left fineprint-label label-size-3 ">
        <p className="has-text-weight-semibold is-unselectable"> {user.name || user.email.split("@")[0]} </p>
        <p className="is-unselectable"> {user.email} </p>
      </div>
      <div className="column is-3 py-0 mt-2 is-italic fineprint-label label-size-1 has-text-right">
        <div className="is-relative">
          <div style={{position: "absolute", top: "-2rem", width: "100%", zIndex: 20}}>
            <div className="is-flex is-justify-content-flex-end">
              <HoverButton isActive={!!onDelete && showButton && !isSelf} type="close" onClick={() => onDelete && onDelete(user)} />
            </div>
          </div>
        </div>

        <p className="is-unselectable">
        { isSelf ? "You" : "" }
        </p>

      </div>
    </div>
  )
}

export default ShareCard
