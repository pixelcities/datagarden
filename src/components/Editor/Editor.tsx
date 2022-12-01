import React, { FC, useRef, useMemo, useState, useEffect, useCallback } from 'react'
import { createEditor, Descendant } from 'slate'
import { Slate, ReactEditor, Editable, withReact } from 'slate-react'

import Toolbar, { handleHotKeys } from './Toolbar'
import { renderLeaf, renderElement, serialize } from './Render'

import { Block } from 'types'
import { useAppSelector, useAppDispatch } from 'hooks'
import { selectContentById } from 'state/selectors'
import { updateContent, updateContentDraft } from 'state/actions'


const DEFAULT_VALUE: Descendant[] = [
  {
    type: Block.Paragraph,
    children: [{ text: '' }]
  }
]

interface EditorProps {
  id: string,
  publishCallback: (c: () => void) => void
}

const Editor: FC<EditorProps> = ({ id, publishCallback } ) => {
  const dispatch = useAppDispatch()
  const content = useAppSelector(state => selectContentById(state, id))

  const [editor] = useState(() => withReact(createEditor()))
  const [handle, setHandle] = useState<number>(0)

  const stateRef = useRef<Descendant[]>([])

  const access = useMemo(() => content ? content.access : [], [ content ])

  const initialValue = useMemo(() => {
    if (content && content.access.filter(x => x.type === "public").length > 0) {
      if (content?.draft) {
        const data = JSON.parse(content.draft)
        stateRef.current = data
        return data
      }
    }

    // TODO: handle internal access
    return DEFAULT_VALUE

  // eslint-disable-next-line
  }, [])

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    handleHotKeys(editor, event)
  }, [ editor ])

  const publish = useCallback(() => {
    const html = stateRef.current.map(n => serialize(n)).join("\n")
    const draft = JSON.stringify(stateRef.current)
    const node = ReactEditor.toDOMNode(editor, editor)

    if (content) {
      dispatch(updateContent({...content, ...{
        content: btoa(html),
        draft: draft,
        height: node.offsetHeight
      }}))
    }
  }, [ content, editor, dispatch ])
  useEffect(() => publishCallback(publish), [ publishCallback, publish ])

  const onChange = useCallback((value: Descendant[]) => {
    const isAstChange = editor.operations.some(
      op => 'set_selection' !== op.type
    )

    if (isAstChange) {
      stateRef.current = value

      if (!handle) {
        setHandle(window.setTimeout(() => {
          if (access.filter(x => x.type === "public").length > 0) {
            const draft = JSON.stringify(stateRef.current)

            dispatch(updateContentDraft({
              id: id,
              workspace: "default",
              draft: draft
            }))
          }
          // TODO: handle internal access

          setHandle(0)
        }, 3000))
      }
    }
  }, [ id, editor, access, handle, dispatch ])

  return (
    <div className="box content">
      <Slate editor={editor} value={initialValue} onChange={onChange}>
        <Toolbar />

        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={onKeyDown}
        />
      </Slate>
    </div>
  )
}


export default Editor
