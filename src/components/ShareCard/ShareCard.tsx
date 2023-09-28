import React, { FC } from 'react'

import { User } from 'types'
import { altAsSvg, toColor } from 'utils/helpers'

interface ShareCardProps {
  principal: string,
  user: User,
  isSelf: boolean
}

const ShareCard: FC<ShareCardProps> = (props) => {
  const { principal, user, isSelf } = props

  return (
    <div key={principal} className="columns mx-0 pt-2 pb-1 share-card">
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
        <p className="is-unselectable">
        { isSelf ? "You" : "" }
        </p>
      </div>
    </div>
  )
}

export default ShareCard
