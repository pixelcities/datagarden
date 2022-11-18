import { Transforms, Element as SlateElement, Editor as SlateEditor } from 'slate'
import { CustomEditor, CustomElement, Mark, Block, Align } from 'types'


const LIST_TYPES = ['numbered-list', 'bulleted-list']
const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify']

export const toggleAlign = (editor: CustomEditor, format: Align) => {
  const isActive = isAlignActive(editor, format)

  Transforms.unwrapNodes(editor, {
    match: n =>
      !SlateEditor.isEditor(n) &&
      SlateElement.isElement(n) &&
      !TEXT_ALIGN_TYPES.includes(format),
    split: true,
  })
  let newProperties: Partial<SlateElement>
  newProperties = {
    align: isActive ? undefined : format,
  }

  Transforms.setNodes<SlateElement>(editor, newProperties)
}


export const toggleBlock = (editor: CustomEditor, format: Block) => {
  const isActive = isBlockActive(editor, format)
  const isList = LIST_TYPES.includes(format)

  Transforms.unwrapNodes(editor, {
    match: n =>
      !SlateEditor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes(n.type) &&
      !TEXT_ALIGN_TYPES.includes(format),
    split: true,
  })
  let newProperties: Partial<SlateElement>
  newProperties = {
    type: isActive ? Block.Paragraph : isList ? Block.ListItem : (format as Block),
  }

  Transforms.setNodes<SlateElement>(editor, newProperties)

  if (!isActive && isList) {
    const block = { type: format, children: [] }
    Transforms.wrapNodes(editor, block)
  }
}

export const toggleMark = (editor: CustomEditor, format: Mark) => {
  const isActive = isMarkActive(editor, format)

  if (isActive) {
    SlateEditor.removeMark(editor, format)
  } else {
    SlateEditor.addMark(editor, format, true)
  }
}

export const isBlockActive = (editor: CustomEditor, format: Block) => {
  const { selection } = editor
  if (!selection) return false

  const [match] = Array.from(
    SlateEditor.nodes(editor, {
      at: SlateEditor.unhangRange(editor, selection),
      match: n =>
        !SlateEditor.isEditor(n) &&
        SlateElement.isElement(n) &&
        isBlock(n, format)
    })
  )

  return !!match
}

export const isAlignActive = (editor: CustomEditor, format: Align) => {
  const { selection } = editor
  if (!selection) return false

  const [match] = Array.from(
    SlateEditor.nodes(editor, {
      at: SlateEditor.unhangRange(editor, selection),
      match: n =>
        !SlateEditor.isEditor(n) &&
        SlateElement.isElement(n) &&
        isAlign(n, format)
    })
  )

  return !!match
}

export const isMarkActive = (editor: CustomEditor, format: Mark) => {
  const marks = SlateEditor.marks(editor)
  return marks ? marks[format] === true : false
}

const isAlign = (node: CustomElement, format: Align) => {
  if (Object.values(Align).includes(format)) {
    return node.align === format
  }

  return false
}

const isBlock = (node: CustomElement, format: Block) => {
  if (Object.values(Block).includes(format)) {
    return node.type === format
  }

  return false
}

