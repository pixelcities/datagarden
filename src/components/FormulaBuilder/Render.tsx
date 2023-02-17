import React, { FC } from 'react'
import { useSelected, useFocused, RenderElementProps, RenderLeafProps } from 'slate-react'

import { Block } from 'types'


interface ReferenceElementProps {
  children: any,
  attributes?: RenderElementProps["attributes"],
  name?: string
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
    default:
      return <p {...attributes}>{children}</p>
  }
}

