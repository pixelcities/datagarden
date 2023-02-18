import React, { FC } from 'react'
import { useSelected, useFocused, RenderElementProps, RenderLeafProps } from 'slate-react'
import { Node, Element, Text } from 'slate'

import { Block } from 'types'


interface ReferenceElementProps {
  children: any,
  attributes?: RenderElementProps["attributes"],
  name?: string,
  func?: string
}

const ReferenceElement: FC<ReferenceElementProps> = ({ attributes, children, name }) => {
  const selected = useSelected()
  const focused = useFocused()
  const style: React.CSSProperties = {
    padding: "3px 3px 2px",
    margin: "0 1px",
    verticalAlign: "baseline",
    display: "inline-block",
    borderRadius: "4px",
    backgroundColor: "#eee",
    fontSize: "0.9em",
    boxShadow: selected && focused ? "0 0 0 2px #B4D5FF" : "none",
  }

  return (
    <span
      {...attributes}
      contentEditable={false}
      style={style}
    >
      {children}{name}
    </span>
  )
}

const FunctionElement: FC<ReferenceElementProps> = ({ attributes, children, func }) => {
  return (
    <span {...attributes}>
      <span className="fineprint-label label-size-2 has-text-weight-semibold">{func}(</span>
        {children}
      <span className="fineprint-label label-size-2">)</span>
    </span>
  )
}

export const renderLeaf = (props: RenderLeafProps) => {
  return (
    <span {...props.attributes}>{props.children}</span>
  )
}

export const renderElement = (props: RenderElementProps) => {
  const { children, attributes, element } = props

  switch (element.type) {
    case Block.Reference:
      return <ReferenceElement children={children} attributes={attributes} name={element.name} />
    case Block.Function:
      return <FunctionElement children={children} attributes={attributes} func={element.function} />
    default:
      return <p {...attributes}>{children}</p>
  }
}

export const serialize = (node: Node): string => {
  if (Text.isText(node)) {
    return node.text

  } else if (Element.isElement(node)) {
    const children = node.children
      .map(n => serialize(n))
      .filter(n => n.trim() !== "")

    switch (node.type) {
      case Block.Reference:
        return `${children.join("")} "${node.id}"`
      case Block.Function:
        return `${node.function}(${children.join(",")})`
      default:
        return children.join("")
    }

  } else {
    return ""
  }
}

