import { BaseEditor, BaseElement, Descendant } from 'slate'
import { ReactEditor } from 'slate-react'

export type HeadingElement = {
  type: 'heading'
  align?: string
  children: Descendant[]
}

export type ParagraphElement = {
  type: 'paragraph'
  align?: string
  children: Descendant[]
}

export type CodeElement = {
  type: 'code'
  align?: string
  children: Descendant[]
}

type CustomElement =
  | HeadingElement
  | ParagraphElement
  | CodeElement


export type CustomText = {
  bold?: boolean
  italic?: boolean
  code?: boolean
  text: string
}

export type CustomEditor = BaseEditor & ReactEditor

declare module 'slate' {
  interface BaseElement {
    type: string;
  }

  interface CustomTypes {
    Editor: CustomEditor
    Element: CustomElement
    Text: CustomText
  }
}
