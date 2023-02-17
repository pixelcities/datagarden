import React, { FC, useRef, useEffect, useMemo, useState, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { createEditor, Transforms, Descendant, Range, Editor as SlateEditor } from 'slate'
import { Slate, ReactEditor, Editable, withReact } from 'slate-react'

import { renderLeaf, renderElement } from './Render'

import { CustomEditor, Block } from 'types'


const DEFAULT_VALUE: Descendant[] = [
  {
    type: Block.Paragraph,
    children: [{ text: '' }]
  }
]

interface FormulaBuilderProps {
  columnNames: string[]
}

const FormulaBuilder: FC<FormulaBuilderProps> = ({ columnNames } ) => {
  const ref = useRef<HTMLDivElement>(null)

  const [editor] = useState(() => withReferences(withReact(createEditor())))
  const [target, setTarget] = useState<Range | undefined>()
  const [index, setIndex] = useState(0)
  const [search, setSearch] = useState("")

  const initialValue = useMemo(() => DEFAULT_VALUE, [])

  const columnMatches = useMemo(() => {
    return [...new Set(columnNames.map(c => c.slice(0, 2)))]
  }, [ columnNames ])

  const chars = useMemo(() => {
    return columnNames?.filter(c =>
      c.toLowerCase().startsWith(search.toLowerCase())
    ).slice(0, 10) ?? []
  }, [ columnNames, search ])

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (target && chars.length > 0) {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault()
          const prevIndex = index >= chars.length - 1 ? 0 : index + 1
          setIndex(prevIndex)
          break

        case "ArrowUp":
          event.preventDefault()
          const nextIndex = index <= 0 ? chars.length - 1 : index - 1
          setIndex(nextIndex)
          break

        case "Tab":
        case "Enter":
          event.preventDefault()
          Transforms.select(editor, target)
          insertReference(editor, chars[index])
          setTarget(undefined)
          break

        case "Escape":
          event.preventDefault()
          setTarget(undefined)
          break
      }
    }

    // Disable newlines
    if (event.key === "Enter") {
      event.preventDefault()
    }
  }, [ editor, chars, index, target ])

  const onChange = useCallback(() => {
    const { selection } = editor

    if (selection && Range.isCollapsed(selection)) {
      let before, beforeMatch

      const [start] = Range.edges(selection)
      const wordBefore = SlateEditor.before(editor, start, { unit: "word" })

      // If this is the beginning of the document, just use that
      if (wordBefore && wordBefore.offset === 0) {
        before = wordBefore

      // Else, go back one more location to find special characters such as "@"
      } else if (wordBefore) {
        before = SlateEditor.before(editor, wordBefore)
      }

      const beforeRange = before && SlateEditor.range(editor, before, start)
      const beforeText = beforeRange && SlateEditor.string(editor, beforeRange)

      if (beforeText) {
        // Match on the first two characters of a match range
        if (columnMatches.indexOf(beforeText.trim().slice(0, 2)) !== -1) {
          beforeMatch = beforeText.trim()

        // Or on a special character
        } else {
          beforeMatch = beforeText.match(/^@(\w+)$/)?.[1]
        }
      }
      const after = SlateEditor.after(editor, start)
      const afterRange = SlateEditor.range(editor, start, after)
      const afterText = SlateEditor.string(editor, afterRange)
      const afterMatch = afterText.match(/^(\s|$)/)

      if (beforeMatch && afterMatch) {
        setTarget(beforeRange)
        setSearch(beforeMatch)
        setIndex(0)
        return
      }
    }

    setTarget(undefined)

  }, [ editor, columnMatches ])

  useEffect(() => {
    if (target && chars.length > 0) {
      const el = ref.current
      const domRange = ReactEditor.toDOMRange(editor, target)
      const rect = domRange.getBoundingClientRect()

      if (el) {
        el.style.top = `${rect.top + window.pageYOffset + 24}px`
        el.style.left = `${rect.left + window.pageXOffset}px`
      }
    }
  }, [chars.length, editor, index, search, target])

  return (
    <div className="input" style={{overflow: "hidden"}}>
      <Slate editor={editor} value={initialValue} onChange={onChange}>
        <Editable
          style={{width: "100%", whiteSpace: "nowrap"}}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={onKeyDown}
        />
        {target && chars.length > 0 && (
          <Portal>
            <div ref={ref} className="portal-popup">
              {chars.map((char, i) => (
                <div
                  key={char}
                  style={{
                    padding: '1px 3px',
                    borderRadius: '3px',
                    background: i === index ? '#B4D5FF' : 'transparent',
                  }}
                >
                  {char}
                </div>
              ))}
            </div>
          </Portal>
        )}
      </Slate>
    </div>
  )
}

const Portal: FC = ({ children }) => {
  return ReactDOM.createPortal(children, document.body)
}

const withReferences = (editor: CustomEditor) => {
  const { isInline, isVoid, markableVoid } = editor

  editor.isInline = element => {
    return element.type === Block.Reference ? true : isInline(element)
  }

  editor.isVoid = element => {
    return element.type === Block.Reference ? true : isVoid(element)
  }

  editor.markableVoid = element => {
    return element.type === Block.Reference || markableVoid(element)
  }

  return editor
}

const insertReference = (editor: CustomEditor, name: string) => {
  Transforms.insertNodes(editor, {
    type: Block.Reference,
    name: name,
    children: [{ text: '' }],
  })
  Transforms.move(editor)
}


export default FormulaBuilder
