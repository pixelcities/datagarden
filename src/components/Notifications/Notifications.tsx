import React, { FC, useEffect, useRef, useMemo, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { gsap } from 'gsap'

import { useAppDispatch, useAppSelector } from 'hooks'
import { selectUrgentMessages } from 'state/selectors'
import { deleteLocalMessage } from 'state/actions'

import './Notifications.sass'


const Notifications: FC = ({ children }) => {
  const dispatch = useAppDispatch()

  const messages = useAppSelector(selectUrgentMessages)

  const refs = useRef<{[id: string]: [boolean, React.MutableRefObject<HTMLDivElement | null>]}>({})

  const handleClose = useCallback((id: string) => {
    if (refs.current && refs.current[id]) {
      delete refs.current[id]
    }

    dispatch(deleteLocalMessage({
      id: id
    }))
  }, [ dispatch ])

  const notifications = useMemo(() => {
    return messages.map(message => {
      if (refs.current && !refs.current[message.id]) {
        refs.current[message.id] = [true, (React.createRef() as React.MutableRefObject<HTMLDivElement | null>)]
      }

      return (
        <div ref={refs.current[message.id][1]} key={message.id} className={"notification is-light " + (message.type === "info" ? "is-info" : "is-danger")}>
          <button className="delete" onClick={() => handleClose(message.id)} />
          { message.message }
        </div>
      )
    })
  }, [ messages, handleClose ])

  useEffect(() => {
    for (const message of messages) {
      if (refs.current && refs.current[message.id]) {
        const ref = refs.current[message.id]

        if (ref[0] && ref[1].current) {
          ref[0] = false

          gsap.from(ref[1].current, {
            opacity: 0,
            y: -100,
            duration: 1
          })
        }
      }
    }
  }, [ messages, notifications ])

  return (
    <>
      <Portal>
        <div className="notifications-wrapper">
          { notifications }
        </div>
      </Portal>

      { children }
    </>
  )
}

const Portal: FC = ({ children }) => {
  return ReactDOM.createPortal(children, document.body)
}


export default Notifications
