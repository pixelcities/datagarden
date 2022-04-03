import React, { FC } from 'react'

import { User } from 'types'

interface ShareCardProps {
  principal: string,
  user: User,
  isSelf: boolean
}

const ShareCard: FC<ShareCardProps> = (props) => {
  const { principal, user, isSelf } = props

  return (
    <div key={principal} className="columns pt-2 pb-1 share-card">
      <div className="column is-2 py-0">
        <span className="icon is-medium ml-3">
          <img src={user.picture ?? ""} alt="" />
        </span>
      </div>
      <div className="column is-7 py-0 has-text-left fineprint-label label-size-3 ">
        <p className="has-text-weight-semibold"> {user.name} </p>
        <p> {user.email} </p>
      </div>
      <div className="column is-3 py-0 mt-2 is-italic fineprint-label label-size-1 has-text-right">
        <p>
        { isSelf ? "Owner" : "" }
        </p>
      </div>
    </div>
  )
}

export default ShareCard
