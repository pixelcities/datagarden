import React, { FC } from 'react'
import ReactDOMServer from 'react-dom/server'
import { Node, Element, Text } from 'slate'
import { RenderElementProps, RenderLeafProps } from 'slate-react'

import { CustomText } from 'types'


interface ElementProps {
  children: any,
  attributes?: RenderElementProps["attributes"]
}

interface LeafProps {
  children: any,
  leaf?: RenderLeafProps["leaf"],
  attributes?: RenderLeafProps["attributes"]
}


const CodeElement: FC<ElementProps> = ({ children, attributes }) => {
  return (
    <pre {...attributes}>
      <code>{children}</code>
    </pre>
  )
}

const DefaultElement: FC<ElementProps> = ({ children, attributes }) => {
  return (
    <p {...attributes}>{children}</p>
  )
}

const Leaf: FC<LeafProps> = ({ children, leaf, attributes }) => {
  let style: {[key: string]: string} = {}

  if (leaf) {
    if (leaf.bold) {
      style.fontWeight = "bold"
    }
  }

  if (children === "") {
    return <></>
  }

  return (
    <span
      {...attributes}
      style={style}
    >
      {children}
    </span>
  )
}

const render = (type: string, children: any, attributes?: RenderElementProps["attributes"], leaf?: CustomText) => {
  switch (type) {
    case 'code':
      return <CodeElement children={children} attributes={attributes} />
    case 'leaf':
      return <Leaf children={children} leaf={leaf} />
    default:
      return <DefaultElement children={children} attributes={attributes} />
  }
}

const renderHTML = (node: Node): React.ReactElement<any> => {
  if (Text.isText(node)) {
    return render("leaf", node.text, undefined, node)

  } else if (Element.isElement(node)) {
    const children = node.children.map((n, i) => {
      return <React.Fragment key={i}>{renderHTML(n)}</React.Fragment>
    })

    return render(node.type, children)

  } else {
    return <></>
  }
}

export const renderLeaf = (props: RenderLeafProps) => {
  return <Leaf {...props} />
}

export const renderElement = (props: RenderElementProps) => {
  return render(props.element.type as string, props.children, props.attributes)
}

export const serialize = (node: Node): string => {
  return ReactDOMServer.renderToStaticMarkup(renderHTML(node))
}

