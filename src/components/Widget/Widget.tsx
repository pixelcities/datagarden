import React, { FC } from 'react';


interface WidgetProps {
  id: string,
  collection?: string,
  onClose: () => void
}

const Widget: FC<WidgetProps> = ({ id, collection, onClose }) => {
  return (
    <>
    </>
  )
}

export default Widget

