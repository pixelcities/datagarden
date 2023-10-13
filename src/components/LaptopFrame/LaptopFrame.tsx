import React, { FC } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlayCircle } from '@fortawesome/free-solid-svg-icons'

import './LaptopFrame.sass'


interface LaptopFrameProps {
  image: string,
  onClick?: () => void
}

const LaptopFrame: FC<LaptopFrameProps> = ({ image, onClick }) => {
  const style = onClick ?
    {
      backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.4)), url(${image})`,
      backgroundSize: "cover",
      cursor: "pointer"
    }
  :
    {
      backgroundImage: `url(${image})`,
      backgroundSize: "cover"
    }

  return (
    <div className="laptop" style={style} onClick={onClick}>
      { onClick &&
        <span className="overlay">
          <span className="icon is-large">
            <FontAwesomeIcon icon={faPlayCircle} size="3x"/>
          </span>
        </span>
      }
      <div className="base" />
    </div>
  )
}

export default LaptopFrame;
