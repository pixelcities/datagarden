import React, { FC, useMemo, useState, useCallback } from 'react'
import { createEditor, Descendant } from 'slate'
import { Slate, Editable, withReact } from 'slate-react'

import Toolbar, { handleHotKeys } from './Toolbar'
import { renderLeaf, renderElement } from './Render'

import { Block } from 'types'
import { useAppSelector, useAppDispatch } from 'hooks'
import { selectContentById } from 'state/selectors'
import { updateContentDraft } from 'state/actions'


const DEFAULT_VALUE: Descendant[] = [
  {
    type: Block.Paragraph,
    children: [{ text: '' }]
  }
]

interface EditorProps {
  id: string,
  isEditing: boolean
}

const Editor: FC<EditorProps> = ({ id, isEditing } ) => {
  const dispatch = useAppDispatch()
  const content = useAppSelector(state => selectContentById(state, id))

  const [editor] = useState(() => withReact(createEditor()))

  const access = useMemo(() => content ? content.access : [], [ content ])

  const initialValue = useMemo(() => {
    if (content && content.access.filter(x => x.type === "public").length > 0) {
      if (content?.draft) {
        return JSON.parse(content.draft)
      }
    }

    // TODO: handle internal access
    return DEFAULT_VALUE

  // eslint-disable-next-line
  }, [])

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    handleHotKeys(editor, event)
  }, [ editor ])

  const onChange = useCallback((value: Descendant[]) => {
    const isAstChange = editor.operations.some(
      op => 'set_selection' !== op.type
    )

    if (isAstChange) {
      // setState(value)

      // TODO: debounce
      if (access.filter(x => x.type === "public").length > 0) {
        const draft = JSON.stringify(value)

        dispatch(updateContentDraft({
          id: id,
          workspace: "default",
          draft: draft
        }))
      }
      // TODO: handle internal access
    }
  }, [ id, editor, access, dispatch ])

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
