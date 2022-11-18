import React, { FC } from 'react'
import ReactDOMServer from 'react-dom/server'
import { Node, Element, Text } from 'slate'
import { RenderElementProps, RenderLeafProps } from 'slate-react'

import { CustomText, Align } from 'types'


interface ElementProps {
  style: {[key: string]: string},
  children: any,
  attributes?: RenderElementProps["attributes"]
}

interface LeafProps {
  style: {[key: string]: string},
  children: any,
  leaf?: RenderLeafProps["leaf"],
  attributes?: RenderLeafProps["attributes"]
}


const CodeElement: FC<ElementProps> = ({ style, children, attributes }) => {
  return (
    <pre style={style} {...attributes}>
      <code>{children}</code>
    </pre>
  )
}

const BlockQuoteElement: FC<ElementProps> = ({ style, children, attributes }) => {
  return (
    <blockquote style={style} {...attributes}>
      {children}
    </blockquote>
  )
}

const HeadingOneElement: FC<ElementProps> = ({ style, children, attributes }) => {
  return (
    <h1 style={style} {...attributes}>
      {children}
    </h1>
  )
}

const HeadingTwoElement: FC<ElementProps> = ({ style, children, attributes }) => {
  return (
    <h2 style={style} {...attributes}>
      {children}
    </h2>
  )
}

const ListItemElement: FC<ElementProps> = ({ style, children, attributes }) => {
  return (
    <li style={style} {...attributes}>
      {children}
    </li>
  )
}

const NumberedListElement: FC<ElementProps> = ({ style, children, attributes }) => {
  return (
    <ol style={style} {...attributes}>
      {children}
    </ol>
  )
}

const BulletedListElement: FC<ElementProps> = ({ style, children, attributes }) => {
  return (
    <ul style={style} {...attributes}>
      {children}
    </ul>
  )
}

const DefaultElement: FC<ElementProps> = ({ style, children, attributes }) => {
  return (
    <p style={style} {...attributes}>{children}</p>
  )
}

const Leaf: FC<LeafProps> = ({ style, children, leaf, attributes }) => {
  if (leaf) {
    if (leaf.bold) {
      style.fontWeight = "bold"
    }

    if (leaf.italic) {
      style.fontStyle = "italic"
    }

    if (leaf.underline) {
      style.textDecoration = "underline"
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

const render = (type: string, children: any, align?: Align, attributes?: RenderElementProps["attributes"], leaf?: CustomText) => {
  let style: {[key: string]: string} = {}

  if (align) {
    style.textAlign = align
  }

  switch (type) {
    case 'code':
      return <CodeElement style={style} children={children} attributes={attributes} />
    case 'block-quote':
      return <BlockQuoteElement style={style} children={children} attributes={attributes} />
    case 'heading-one':
      return <HeadingOneElement style={style} children={children} attributes={attributes} />
    case 'heading-two':
      return <HeadingTwoElement style={style} children={children} attributes={attributes} />
    case 'numbered-list':
      return <NumberedListElement style={style} children={children} attributes={attributes} />
    case 'bulleted-list':
      return <BulletedListElement style={style} children={children} attributes={attributes} />
    case 'list-item':
      return <ListItemElement style={style} children={children} attributes={attributes} />
    case 'leaf':
      return <Leaf style={style} children={children} leaf={leaf} />
    default:
      return <DefaultElement style={style} children={children} attributes={attributes} />
  }
}

const renderHTML = (node: Node): React.ReactElement<any> => {
  if (Text.isText(node)) {
    return render("leaf", node.text, undefined, undefined, node)

  } else if (Element.isElement(node)) {
    const children = node.children.map((n, i) => {
      return <React.Fragment key={i}>{renderHTML(n)}</React.Fragment>
    })

    return render(node.type, children, node.align)

  } else {
    return <></>
  }
}

export const renderLeaf = (props: RenderLeafProps) => {
  return <Leaf style={{}} {...props} />
}

export const renderElement = (props: RenderElementProps) => {
  return render(props.element.type as string, props.children, props.element.align, props.attributes)
}

export const serialize = (node: Node): string => {
  return ReactDOMServer.renderToStaticMarkup(renderHTML(node))
}

