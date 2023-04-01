import React, { FC } from 'react'
import { useHistory } from "react-router-dom"

import { useAppSelector } from 'hooks'
import { selectActiveDataSpace } from 'state/selectors'
import { getCSRFToken } from 'utils/getCSRFToken'


interface DSSettingsProps {
  isActive: boolean,
  onClose: () => void
}

const DSSettings: FC<DSSettingsProps> = ({ isActive, onClose }) => {
  const history = useHistory()
  const dataSpace = useAppSelector(selectActiveDataSpace)

  const handleLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()

    if (window.confirm("Are you sure you want to leave this data space?")) {
      fetch(process.env.REACT_APP_API_BASE_PATH + `/spaces/${dataSpace.handle}/leave`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCSRFToken()
        }
      }).then((response) => {
        onClose()
        history.push("/")
      }).catch((e) => {
        console.log(e)
      })
    }
  }

  const renderLeave = (
    <>
      <div className="columns">
        <div className="column is-two-thirds">
          <h3 className="has-text-weight-semibold">
            Leave the <span className="is-italic"> { dataSpace.name || dataSpace.handle } </span> data space
          </h3>

          <p>
            This action cannot be undone!
          </p>
        </div>

        <div className="column">
          <div className="button mt-1 is-danger is-pulled-right" onClick={handleLeave}>
            Leave
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      <div className={"modal " + (isActive ? "is-active" : "")}>
        <div className="modal-background"></div>
        <div className="modal-content">
          <div className="box">

            { renderLeave }

          </div>
        </div>

         <button className="modal-close is-large" aria-label="close" onClick={onClose}></button>
      </div>
    </>
  )
}

export default DSSettings;
