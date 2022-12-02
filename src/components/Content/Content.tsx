import React, { FC, useCallback, useState, useRef } from 'react'

import Editor from 'components/Editor'
import HoverButton from 'components/HoverButton'

import { useKeyStoreContext } from 'contexts'
import { useAppSelector } from 'hooks'
import { selectContentHeightById } from 'state/selectors'


interface ContentProps {
  id: string,
  keyId?: string
}

const Content: FC<ContentProps> = ({ id, keyId }) => {
  const height = useAppSelector(state => selectContentHeightById(state, id))
  const { keyStore } = useKeyStoreContext()

  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const publishRef = useRef<() => void>(() => {})

  const publishCallback = useCallback((cb: () => void) => {
    publishRef.current = cb
  }, [])

  const handlePublish = () => {
    publishRef.current()
    setIsEditing(false)
  }

  const onLoad = () => {
    if (keyId) {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(keyStore?.get_key(keyId), process.env.REACT_APP_CONTENT_HOST || "")
      }
    }
  }

  return (
    <div className="container">
      <div className="is-relative">
        <div onMouseEnter={() => setShowButton(true)} onMouseLeave={() => setShowButton(false)}>
          <div style={{position: "absolute", top: "-1rem", width: "100%"}}>
            <div className="is-flex is-justify-content-flex-end pr-3">
              { isEditing ?
                <>
                  <div className="px-1">
                    <HoverButton isActive={true} type="save" onClick={handlePublish} />
                  </div>

                  <div className="px-1">
                    <HoverButton isActive={true} type="close" onClick={() => setIsEditing(false)} />
                  </div>
                </>
              :
                <div className="px-1">
                  <HoverButton isActive={showButton} type="edit" onClick={() => setIsEditing(true)} />
                </div>
              }
            </div>
          </div>

          { isEditing &&
            <Editor
              id={id}
              publishCallback={publishCallback}
              keyId={keyId}
            />
          }

          <iframe ref={iframeRef} title={id} style={isEditing ? {display: "none"} : {}} src={"http://localhost:5001/pages/content/ds1/" + id} sandbox="allow-scripts allow-same-origin" width="100%" height={height ? height : "100%"} scrolling="no" frameBorder="0" onLoad={onLoad} />

        </div>
      </div>
    </div>
  )
}

export default Content
