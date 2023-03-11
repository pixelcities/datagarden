import React, { FC } from 'react'

import './LaptopFrame.sass'


interface LaptopFrameProps {
  image: string
}

const LaptopFrame: FC<LaptopFrameProps> = ({ image }) => {
  return (
    <div className="laptop" style={{backgroundImage: `url(${image})`, backgroundSize: "cover"}}>
      <div className="base" />
    </div>
  )
}

export default LaptopFrame;
