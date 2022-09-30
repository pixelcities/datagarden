import React, { FC } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'


interface AccordionProps {
  title?: string,
  onClick?: any
}

const Accordion: FC<AccordionProps> = ({ title, onClick, children} ) => {
  return (
    <details className="message-box" onClick={onClick}>
      <summary className="message-header label-size-2">
        { title ?
          title
        :
          <span className="icon is-medium" style={{marginLeft: "auto", marginRight: "auto"}}>
            <FontAwesomeIcon icon={faPlus} color="#f8cd30" size="lg" />
          </span>
        }
      </summary>

      <div className="message-body">
        { children }
      </div>
    </details>
  )
}

export default Accordion
