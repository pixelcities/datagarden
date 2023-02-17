import { BaseEditor, Descendant } from 'slate'
import { ReactEditor } from 'slate-react'

export enum Align {
  Left = "left",
  Center = "center",
  Right = "right",
  Justify = "justify"
}

export enum Mark {
  Bold = "bold",
  Italic = "italic",
  Underline = "underline",
}

export enum Block {
  Code = "code",
  HeadingOne = "heading-one",
  HeadingTwo = "heading-two",
  Paragraph = "paragraph",
  BlockQuote = "block-quote",
  NumberedList = "numbered-list",
  BulletedList = "bulleted-list",
  ListItem = "list-item",
  Reference = "reference",
}


export type HeadingOneElement = {
  type: Block.HeadingOne
  align?: Align
  children: Descendant[]
}

export type HeadingTwoElement = {
  type: Block.HeadingTwo
  align?: Align
  children: Descendant[]
}

export type ParagraphElement = {
  type: Block.Paragraph
  align?: Align
  children: Descendant[]
}

export type CodeElement = {
  type: Block.Code
  align?: Align
  children: Descendant[]
}

export type BlockQuoteElement = {
  type: Block.BlockQuote
  align?: Align
  children: Descendant[]
}

export type NumberedListElement = {
  type: Block.NumberedList
  align?: Align
  children: Descendant[]
}

export type BulletedListElement = {
  type: Block.BulletedList
  align?: Align
  children: Descendant[]
}

export type ListItemElement = {
  type: Block.ListItem
  align?: Align
  children: Descendant[]
}

export type ReferenceElement = {
  type: Block.Reference
  name?: string
  align?: Align
  children: Descendant[]
}

export type CustomElement =
  | HeadingOneElement
  | HeadingTwoElement
  | ParagraphElement
  | CodeElement
  | BlockQuoteElement
  | NumberedListElement
  | BulletedListElement
  | ListItemElement
  | ReferenceElement

export type CustomText = {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  text: string
}

export type CustomEditor = BaseEditor & ReactEditor

declare module 'slate' {
  interface BaseElement {
    type: Block;
  }

  interface CustomTypes {
    Editor: CustomEditor
    Element: CustomElement
    Text: CustomText
  }
}
