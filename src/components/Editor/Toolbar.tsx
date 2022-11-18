import React, { FC } from 'react'
import { useSlate } from 'slate-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { faBold, faItalic, faUnderline, faCode, faAlignLeft, faAlignRight, faAlignCenter, faAlignJustify, faQuoteRight, faHeading, faListOl, faListUl } from '@fortawesome/free-solid-svg-icons'

import { toggleMark, toggleBlock, toggleAlign, isMarkActive, isBlockActive, isAlignActive } from './commands'
import { CustomEditor, Mark, Block, Align } from 'types'


const Toolbar: FC = (props) => {
  return (
    <div className="pb-3">
      <MarkButton format={Mark.Bold} icon={faBold} />
      <MarkButton format={Mark.Italic} icon={faItalic} />
      <MarkButton format={Mark.Underline} icon={faUnderline} />

      <BlockButton format={Block.Code} icon={faCode} />
      <BlockButton format={Block.BlockQuote} icon={faQuoteRight} />
      <BlockButton format={Block.HeadingOne} icon={faHeading} />
      <BlockButton format={Block.HeadingTwo} icon={faHeading} />
      <BlockButton format={Block.NumberedList} icon={faListOl} />
      <BlockButton format={Block.BulletedList} icon={faListUl} />

      <AlignButton format={Align.Left} icon={faAlignLeft} />
      <AlignButton format={Align.Center} icon={faAlignCenter} />
      <AlignButton format={Align.Right} icon={faAlignRight} />
      <AlignButton format={Align.Justify} icon={faAlignJustify} />

      <div style={{borderBottom: "1px solid #dbdbdb"}} />
    </div>
  )
}

const handleHotKeys = (editor: CustomEditor, event: React.KeyboardEvent<HTMLDivElement>) => {
  if (!event.ctrlKey) {
    return
  }

  switch (event.key) {
    case '`': {
      event.preventDefault()
      toggleBlock(editor, Block.Code)
      break
    }

    case 'b': {
      event.preventDefault()
      toggleMark(editor, Mark.Bold)
      break
    }
  }
}

interface MarkButtonProps {
  format: Mark,
  icon: IconProp
}

const MarkButton: FC<MarkButtonProps> = ({ format, icon }) => {
  const editor = useSlate()
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault()

    toggleMark(editor, format)
  }

  const isActive = isMarkActive(editor, format)

  return (
    <div className="icon is-medium" onClick={onClick}>
      <FontAwesomeIcon icon={icon} color={isActive ? "#363636" : "#dbdbdb"} size="sm" />
    </div>
  )
}

interface BlockButtonProps {
  format: Block,
  icon: IconProp
}

const BlockButton: FC<BlockButtonProps> = ({ format, icon }) => {
  const editor = useSlate()
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault()

    toggleBlock(editor, format)
  }

  const isActive = isBlockActive(editor, format)

  return (
    <div className="icon is-medium" onClick={onClick}>
      <FontAwesomeIcon icon={icon} color={isActive ? "#363636" : "#dbdbdb"} size="sm" />
    </div>
  )
}

interface AlignButtonProps {
  format: Align,
  icon: IconProp
}

const AlignButton: FC<AlignButtonProps> = ({ format, icon }) => {
  const editor = useSlate()
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault()

    toggleAlign(editor, format)
  }

  const isActive = isAlignActive(editor, format)

  return (
    <div className="icon is-medium" onClick={onClick}>
      <FontAwesomeIcon icon={icon} color={isActive ? "#363636" : "#dbdbdb"} size="sm" />
    </div>
  )
}


export default Toolbar
export {
  handleHotKeys
}
