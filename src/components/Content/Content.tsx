import type { Identifier, XYCoord } from 'dnd-core'

import React, { FC, useCallback, useState, useRef } from 'react'
import { useDrop, useDrag } from 'react-dnd'

import Editor from 'components/Editor'
import HoverButton from 'components/HoverButton'

import { useKeyStoreContext } from 'contexts'
import { useAppSelector, useAppDispatch } from 'hooks'
import { selectContentById, selectActiveDataSpace } from 'state/selectors'
import { deleteContent } from 'state/actions'

import './Content.sass'


interface ContentProps {
  id: string,
  pageToken: string,
  keyId?: string,
  index: number,
  moveContent: (dragIndex: number, hoverIndex: number) => void
}

interface DragItem {
  index: number
  id: string
}

interface DragProps {
  id: string,
  index: number,
  moveContent: (dragIndex: number, hoverIndex: number) => void,
  isActive: boolean
}

const Draggable: FC<DragProps> = ({ id, index, moveContent, isActive, children }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: Identifier | null }>({
    accept: "ContentBlock",
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      }
    },
    canDrop(item, monitor) {
      return isActive
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index

      // Self
      if (dragIndex === hoverIndex) {
        return
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect()
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      const clientOffset = monitor.getClientOffset()
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top

      // Only perform the move when the mouse has crossed half of the items height
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      } else if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }

      // Move callback
      moveContent(dragIndex, hoverIndex)

      item.index = hoverIndex
    },
  })

  const [{ opacity }, drag] = useDrag({
    type: "ContentBlock",
    item: () => {
      return { id, index }
    },
    collect: (monitor: any) => ({
      opacity: monitor.isDragging() ? 0.5 : 1
    }),
    canDrag(monitor) {
      return isActive
    },
  })

  drag(drop(ref))

  if (isActive) {
    return (
      <div ref={ref} style={{ opacity }} data-handler-id={handlerId} className={"draggable" + (isActive ? " is-active" : "")}>
        { children }
      </div>
    )

  } else {
    return (
      <>
       { children }
      </>
    )
  }
}

const Content: FC<ContentProps> = ({ id, pageToken, keyId, index, moveContent }) => {
  const dispatch = useAppDispatch()
  const content = useAppSelector(state => selectContentById(state, id))
  const dataSpace = useAppSelector(selectActiveDataSpace)
  const { keyStore, keyStoreIsReady } = useKeyStoreContext()

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

  const handleDelete = () => {
    dispatch(deleteContent({
      id: id,
      workspace: content!.workspace
    }))
  }

  const onLoad = () => {
    if (keyId) {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(keyStore?.get_key(keyId), process.env.REACT_APP_CONTENT_HOST || "")
      }
    }
  }

  return (
    <Draggable id={id} index={index} moveContent={moveContent} isActive={!isEditing}>
      <div className="container is-relative">
        <div onMouseEnter={() => setShowButton(true)} onMouseLeave={() => setShowButton(false)}>
          <div style={{position: "absolute", top: "-1rem", width: "100%", zIndex: 20}}>
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
                <>
                  <div className="px-1">
                    <HoverButton isActive={showButton && content?.type !== "widget"} type="edit" onClick={() => setIsEditing(true)} />
                  </div>

                  <div className="px-1">
                    <HoverButton isActive={showButton} type="delete" onClick={handleDelete} />
                  </div>
                </>
              }
            </div>
          </div>

          { isEditing &&
            <Editor
              id={id}
              content={content}
              publishCallback={publishCallback}
              keyId={keyId}
            />
          }

          { (!keyId || keyStoreIsReady) &&
            <div className={"drag-content" + (!isEditing ? " is-active" : "")} style={isEditing ? {display: "none"} : {}}>
              <iframe ref={iframeRef} title={id} src={process.env.REACT_APP_CONTENT_HOST + "/pages/content/" + dataSpace.handle + "/" + id + "?token=" + pageToken} sandbox="allow-scripts allow-same-origin" width="100%" height={content?.height ? content?.height : "100%"} scrolling="no" frameBorder="0" onLoad={onLoad} />
            </div>
          }

        </div>
      </div>
    </Draggable>
  )
}

export default Content
