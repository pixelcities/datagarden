import React, { FC, useEffect, useRef, useState, useMemo, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faEnvelopeOpen } from '@fortawesome/free-solid-svg-icons'

import { useAppDispatch, useAppSelector } from 'hooks'
import { selectNotifications } from 'state/selectors'
import { markNotificationRead } from 'state/actions'
import { NotificationMsg } from 'types'

import notificationsIcon from 'assets/notifications.svg'


const WIDTH = 300

const NotificationsMenu: FC = () => {
  const dispatch = useAppDispatch()

  const iconRef = useRef<HTMLImageElement>(null)
  const portalRef = useRef<HTMLDivElement>(null)
  const [isActive, setIsActive] = useState(false)

  const messages = useAppSelector(selectNotifications)

  const handleRead = useCallback((message: NotificationMsg) => {
    if (message.is_read !== true && message.receiver) {
      dispatch(markNotificationRead({
        id: message.id,
        read_by: message.receiver
      }))

      setIsActive(false)
    }
  }, [ dispatch ])

  const notifications = useMemo(() => {
    return messages
      .reverse()
      .filter(message => message.is_local !== true)
      .map(message => {
        return (
          <div key={message.id} className={"panel-block" + (message.is_read ? "" : " is-active")} onClick={() => handleRead(message)} style={message.is_read ? {} : {backgroundColor: "rgba(245, 245, 245, 0.75)", cursor: "pointer"}}>
            <span className="panel-icon">
              <FontAwesomeIcon icon={message.is_read ? faEnvelopeOpen : faEnvelope} size="xs"/>
            </span>
            <p>
              { message.message }
            </p>
          </div>
        )
      })
  }, [ messages, handleRead ])

  const nrUnreadNotifications = useMemo(() => messages.filter(message => message.is_local !== true && message.is_read !== true).length, [ messages ])

  const renderMenu = useMemo(() => {
    return (
      <div className="panel px-1 py-1" style={{width: WIDTH, maxHeight: 200, overflow: "scroll"}}>
        { notifications.length > 0 ?
          <> { notifications } </>
        :
          <div className="panel-block">
            <p className="fineprint-label label-size-2">
              No unread notifications
            </p>
          </div>
        }
      </div>
    )
  }, [ notifications ])

  useEffect(() => {
    if (iconRef.current && portalRef.current) {
      if (isActive) {
        const rect = iconRef.current.getBoundingClientRect()

        portalRef.current.style.top = `${rect.top + window.pageYOffset + 24}px`
        portalRef.current.style.left = `${rect.right + window.pageXOffset - WIDTH}px`
        portalRef.current.style.visibility = "visible"

      } else {
        portalRef.current.style.visibility = "hidden"
      }
    }
  }, [ isActive ])

  return (
    <>
      <div className="is-flex is-justify-content-center is-align-items-center is-relative" onClick={() => setIsActive(!isActive)} style={{cursor: "pointer"}}>
        { nrUnreadNotifications > 0 && (
          <span className="badge is-success"> { nrUnreadNotifications } </span>
        )}
        <img ref={iconRef} src={notificationsIcon} alt="notifications" width="20" height="20" />
      </div>

      { isActive && (
        <Portal>
          <div ref={portalRef} className="portal is-box">
            { renderMenu }
          </div>
        </Portal>
      )}
    </>
  )
}

const Portal: FC = ({ children }) => {
  return ReactDOM.createPortal(children, document.body)
}


export default NotificationsMenu
