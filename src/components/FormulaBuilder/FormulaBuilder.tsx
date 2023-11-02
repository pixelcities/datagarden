import React, { FC, useRef, useEffect, useMemo, useState, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { createEditor, Transforms, Descendant, Element, Range, Editor as SlateEditor } from 'slate'
import { Slate, ReactEditor, Editable, withReact } from 'slate-react'

import { renderLeaf, renderElement, serialize } from './Render'

import { useAppSelector } from 'hooks'
import { selectConceptMap, selectActiveDataSpace } from 'state/selectors'
import { ConceptA, Schema, CustomEditor, Block, MathFunction1 } from 'types'
import { useAuthContext } from 'contexts'

import { emptyTaxonomy } from 'utils/taxonomy'


const DEFAULT_VALUE: Descendant[] = [
  {
    type: Block.Paragraph,
    children: [{ text: '' }]
  }
]

const M_FUNC_1_MATCHERS = [...new Set(Object.keys(MathFunction1).map(x => x.slice(0, 2)))]


enum SearchType {
  Column,
  MFunc1
}

interface FormulaBuilderProps {
  schema: Schema,
  initialState?: string,
  onChange?: (state: string, formula: string) => void
}

const FormulaBuilder: FC<FormulaBuilderProps> = ({ schema, initialState, onChange }) => {
  const ref = useRef<HTMLDivElement>(null)

  const [editor] = useState(() => withReferences(withReact(createEditor())))
  const [target, setTarget] = useState<Range | undefined>()
  const [index, setIndex] = useState(0)
  const [search, setSearch] = useState("")
  const [searchType, setSearchType] = useState<SearchType | null>(null)

  const { user } = useAuthContext()

  const concepts = useAppSelector(selectConceptMap)
  const dataSpace = useAppSelector(selectActiveDataSpace)

  const initialValue = useMemo(() => {
    if (initialState && initialState !== "") {
      return JSON.parse(initialState)
    }

    return DEFAULT_VALUE

  // eslint-disable-next-line
  }, [])

  const columns = useMemo(() => {
    return schema.columns
      .filter(c => !!c.shares.find(s => s.principal === user?.id))
      .map(c => [c.id, c.concept_id])
      .map(([id, conceptId]) => [id, emptyTaxonomy(dataSpace?.key_id).deserialize(concepts[conceptId])])
      .filter((x): x is [string, ConceptA] => !!x[1])
  }, [ schema.columns, concepts, user, dataSpace?.key_id ])


  // The different search spaces

  // TODO: split per data type
  const columnMatchers = useMemo(() => {
    return [...new Set(columns.map(([id, c]) => c.name.slice(0, 2)))]
  }, [ columns ])

  const columnChars = useMemo(() => {
    return columns
      .map(([id, c]) => [id, c.name] as [string, string])
      .filter(([id, c]) => c.toLowerCase().startsWith(search.toLowerCase()))
      .slice(0, 10)
  }, [ columns, search ])

  const mFunc1Chars = useMemo(() => {
    return Object.keys(MathFunction1)
      .filter(c => c.toLowerCase().startsWith(search.toLowerCase()))
      .slice(0, 10)
  }, [ search ])

  const chars = useMemo(() => {
    if (searchType === SearchType.Column) {
      return columnChars.map(([id, c]) => c)
    }

    if (searchType === SearchType.MFunc1) {
      return mFunc1Chars
    }

    return []
  }, [ searchType, columnChars, mFunc1Chars ])


  // Slate handlers

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const { selection } = editor

    if (selection) {
      // Allow entering into inline block
      if (Range.isCollapsed(selection)) {
        switch (event.key) {
          case "ArrowLeft":
            event.preventDefault()
            Transforms.move(editor, { unit: 'offset', reverse: true })
            break

          case "ArrowRight":
            event.preventDefault()
            Transforms.move(editor, { unit: 'offset' })
            break
        }
      }

      const [ parent ] = SlateEditor.parent(editor, selection)

      // Ignore closing parentheses in a function block
      if (Element.isElement(parent) && parent.type === "function") {
        if (event.key === ")") {
          event.preventDefault()
          Transforms.move(editor, { unit: 'offset' })
        }
      }
    }

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

          if (searchType === SearchType.Column) {
            insertReference(editor, columnChars[index])
          } else if (searchType === SearchType.MFunc1) {
            insertFunction(editor, chars[index])
          }

          setTarget(undefined)
          break

        case "Escape":
          event.preventDefault()
          setTarget(undefined)
          break
      }
    }
  }, [ editor, chars, columnChars, index, target, searchType ])

  const onSlateChange = useCallback((value: Descendant[]) => {
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
        if (columnMatchers.indexOf(beforeText.trim().slice(0, 2)) !== -1) {
          setSearchType(SearchType.Column)
          beforeMatch = beforeText.trim()

        } else if (M_FUNC_1_MATCHERS.indexOf(beforeText.trim().slice(0, 2)) !== -1) {
          setSearchType(SearchType.MFunc1)
          beforeMatch = beforeText.trim()

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

    const isAstChange = editor.operations.some(
      op => 'set_selection' !== op.type
    )

    if (isAstChange && onChange) {
      onChange(JSON.stringify(value), value.map(v => serialize(v)).join("\n"))
    }

  }, [ editor, columnMatchers, onChange ])

  // Portal visibility
  useEffect(() => {
    if (ref.current) {
      if (target && chars.length > 0) {
        const domRange = ReactEditor.toDOMRange(editor, target)
        const rect = domRange.getBoundingClientRect()

        ref.current.style.top = `${rect.top + window.pageYOffset + 24}px`
        ref.current.style.left = `${rect.left + window.pageXOffset}px`
        ref.current.style.visibility = "visible"

      } else {
        ref.current.style.visibility = "hidden"
      }
    }
  }, [chars.length, editor, index, search, target])

  return (
    <div className="textarea is-hovered query-font" style={{overflow: "hidden"}}>
      <Slate editor={editor} value={initialValue} onChange={onSlateChange}>
        <Editable
          style={{width: "100%", whiteSpace: "nowrap"}}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={onKeyDown}
        />
        {target && chars.length > 0 && (
          <Portal>
            <div ref={ref} className="portal is-box">
              {chars.map((char, i) => (
                <div
                  key={char}
                  onClick={() => {
                    Transforms.select(editor, target)

                    if (searchType === SearchType.Column) {
                      insertReference(editor, columnChars[i])
                    } else if (searchType === SearchType.MFunc1) {
                      insertFunction(editor, chars[i])
                    }

                    setTarget(undefined)
                  }}
                  style={{
                    cursor: "pointer",
                    padding: "1px 3px",
                    borderRadius: "3px",
                    background: i === index ? "#B4D5FF" : "transparent",
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
    return element.type === Block.Reference || element.type === Block.Function ? true : isInline(element)
  }

  editor.isVoid = element => {
    return element.type === Block.Reference ? true : isVoid(element)
  }

  editor.markableVoid = element => {
    return element.type === Block.Reference || markableVoid(element)
  }

  return editor
}

const insertReference = (editor: CustomEditor, ref: [string, string]) => {
  Transforms.insertNodes(editor, {
    type: Block.Reference,
    id: ref[0],
    name: ref[1],
    children: [{ text: '' }],
  })
  Transforms.move(editor)
}

const insertFunction = (editor: CustomEditor, func: string) => {
  Transforms.insertText(editor, ' ')
  Transforms.insertNodes(editor, {
    type: Block.Function,
    function: func,
    children: [{ text: ''}],
  })
  Transforms.move(editor)
}


export default FormulaBuilder
