import React, { FC, useState } from 'react'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileCsv, faFileExcel } from '@fortawesome/free-solid-svg-icons'
import { faGoogleDrive } from '@fortawesome/free-brands-svg-icons'

import { Source } from 'types'

import CsvSource from './components/CsvSource'

interface SourceCreatorProps {
  isActive: boolean,
  onClose: () => void,
  onComplete: (source: Source) => void
}

const SourceCreator: FC<SourceCreatorProps> = (props) => {
  const { isActive, onClose, onComplete } = props

  const [fileType, setFileType] = useState("")


  const fileTypePicker = (
    <p className="buttons">
      <button className="button is-large" onClick={() => setFileType("csv")}>
        <span className="icon is-medium has-tooltip-right" data-tooltip="Upload a CSV file">
          <FontAwesomeIcon icon={faFileCsv} color="#4f4f4f" size="lg"/>
        </span>
      </button>

      <button className="button is-large" disabled onClick={() => setFileType("spreadsheet")}>
        <span className="icon is-medium">
          <FontAwesomeIcon icon={faFileExcel} color="#4f4f4f" size="lg"/>
        </span>
      </button>

      <button className="button is-large" disabled onClick={() => setFileType("gsheet")}>
        <span className="icon is-medium">
          <FontAwesomeIcon icon={faGoogleDrive} color="#4f4f4f" size="lg"/>
        </span>
      </button>

    </p>
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
    if (fileType === "csv") {
      return <CsvSource onComplete={handleOnComplete} />
    }

    return fileTypePicker
  }

  return (
    <>
      <div className={"modal " + (isActive ? "is-active" : "")}>
        <div className="modal-background"></div>
        <div className="modal-content">
          <div className="box">
            { renderContent() }
          </div>
        </div>

         <button className="modal-close is-large" aria-label="close" onClick={handleClose}></button>
      </div>
    </>
  )
}

export default SourceCreator
