import React, { FC, useState, useCallback, useMemo } from 'react'
import { createEditor, Descendant, Transforms, Text, Editor as SlateEditor } from 'slate'
import { Slate, Editable, withReact } from 'slate-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBold, faCode, faSave } from '@fortawesome/free-solid-svg-icons'

import { renderLeaf, renderElement, serialize } from './Render'
import { CustomEditor } from 'types'


const customEditor = {
  isBoldMarkActive(editor: CustomEditor) {
    const match = SlateEditor.nodes(editor, {
      match: n => Text.isText(n) && n.bold === true,
      universal: true,
    }).next().value

    return !!match
  },

  isCodeBlockActive(editor: CustomEditor) {
    const match = SlateEditor.nodes(editor, {
      match: n => SlateEditor.isBlock(editor, n) && n.type === 'code'
    }).next().value

    return !!match
  },

  toggleBoldMark(editor: CustomEditor) {
    const isActive = customEditor.isBoldMarkActive(editor)
    Transforms.setNodes(
      editor,
      { bold: isActive ? undefined : true },
      { match: n => Text.isText(n), split: true }
    )
  },

  toggleCodeBlock(editor: CustomEditor) {
    const isActive = customEditor.isCodeBlockActive(editor)
    Transforms.setNodes(
      editor,
      { type: isActive ? undefined : 'code' },
      { match: n => SlateEditor.isBlock(editor, n) }
    )
  },
}

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }]
  }
]

interface EditorProps {
  isEditing: boolean
}


const Editor: FC<EditorProps> = ({ isEditing } ) => {
  const [editor] = useState(() => withReact(createEditor()))
  const [state, setState] = useState<Descendant[]>(initialValue)

  const renderToolbar = useMemo(() => {
    return (
      <div className="pb-3">
        <div className="icon is-medium" onClick={(e) => {e.preventDefault(); customEditor.toggleBoldMark(editor)}}>
          <FontAwesomeIcon icon={faBold} color="#363636" size="sm" />
        </div>

        <div className="icon is-medium" onClick={(e) => {e.preventDefault(); customEditor.toggleCodeBlock(editor)}}>
          <FontAwesomeIcon icon={faCode} color="#363636" size="sm" />
        </div>

        <div className="icon is-medium" onClick={(e) => {e.preventDefault(); console.log(state.map(n => serialize(n)).join("\n"))}}>
          <FontAwesomeIcon icon={faSave} color="#363636" size="sm" />
        </div>

        <div style={{borderBottom: "1px solid #dbdbdb"}} />
      </div>
    )
  }, [ editor, state ])

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!event.ctrlKey) {
      return
    }

    switch (event.key) {
      case '`': {
        event.preventDefault()
        customEditor.toggleCodeBlock(editor)
        break
      }

      case 'b': {
        event.preventDefault()
        customEditor.toggleBoldMark(editor)
        break
      }
    }
  }, [ editor ])

  const onChange = useCallback((value: Descendant[]) => {
    const isAstChange = editor.operations.some(
      op => 'set_selection' !== op.type
    )

    if (isAstChange) {
      setState(value)
    }
  }, [ editor ])

  return (
    <section className="section">
      <div className="box">
        <Slate editor={editor} value={initialValue} onChange={onChange}>
          { renderToolbar }

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
