import React, { FC, useState, useCallback } from 'react'
import { createEditor, Descendant } from 'slate'
import { Slate, Editable, withReact } from 'slate-react'

import Toolbar, { handleHotKeys } from './Toolbar'
import { renderLeaf, renderElement } from './Render'

import { Block } from 'types'

const initialValue: Descendant[] = [
  {
    type: Block.Paragraph,
    children: [{ text: '' }]
  }
]


interface EditorProps {
  isEditing: boolean
}


const Editor: FC<EditorProps> = ({ isEditing } ) => {
  const [editor] = useState(() => withReact(createEditor()))

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    handleHotKeys(editor, event)
  }, [ editor ])

  const onChange = useCallback((value: Descendant[]) => {
    const isAstChange = editor.operations.some(
      op => 'set_selection' !== op.type
    )

    if (isAstChange) {
      // setState(value)
    }
  }, [ editor ])

  return (
    <section className="section">
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
    </section>
  )
}


export default Editor
