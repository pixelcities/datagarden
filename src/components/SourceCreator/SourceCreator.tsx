import React, { FC, useState } from 'react'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileCsv, faFileExcel } from '@fortawesome/free-solid-svg-icons'
import { faGoogleDrive } from '@fortawesome/free-brands-svg-icons'

import { Source } from 'types'

import LocalSource from './components/LocalSource'

interface SourceCreatorProps {
  isActive: boolean,
  onClose: () => void,
  onComplete: (source: Source) => void
}

const SourceCreator: FC<SourceCreatorProps> = (props) => {
  const { isActive, onClose, onComplete } = props

  const [fileType, setFileType] = useState("")


  const fileTypePicker = (
    <div className="modal-content">
      <div className="box">

        <p className="buttons">
          <button className="button is-large" onClick={() => setFileType("csv")}>
            <span className="icon is-medium has-tooltip-right" data-tooltip="Upload a CSV file">
              <FontAwesomeIcon icon={faFileCsv} color="#4f4f4f" size="lg"/>
            </span>
          </button>

          <button className="button is-large" onClick={() => setFileType("spreadsheet")}>
            <span className="icon is-medium has-tooltip-right" data-tooltip="Upload a spreadsheet">
              <FontAwesomeIcon icon={faFileExcel} color="#4f4f4f" size="lg"/>
            </span>
          </button>

          <button className="button is-large" disabled onClick={() => setFileType("gsheet")}>
            <span className="icon is-medium">
              <FontAwesomeIcon icon={faGoogleDrive} color="#4f4f4f" size="lg"/>
            </span>
          </button>

        </p>
      </div>
    </div>
  )

  const handleOnComplete = (source: Source) => {
    onComplete(source)
    setFileType("")
    onClose()
  }

  const handleClose = () => {
    setFileType("")
    onClose()
  }

  const renderContent = () => {
    if (fileType === "csv" || fileType === "spreadsheet") {
      return <LocalSource type={fileType} onComplete={handleOnComplete} onClose={handleClose} />
    }

    return fileTypePicker
  }

  return (
    <>
      <div className={"modal " + (isActive ? "is-active" : "")}>
        <div className="modal-background"></div>

          { renderContent() }

         <button className="modal-close is-large" aria-label="close" onClick={handleClose}></button>
      </div>
    </>
  )
}

export default SourceCreator
