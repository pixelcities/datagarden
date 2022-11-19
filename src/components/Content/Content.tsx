import React, { FC } from 'react'

import Editor from 'components/Editor'


interface ContentProps {
  id: string
}

const Content: FC<ContentProps> = ({ id }) => {
  // return (
  //   <iframe src={"http://localhost:5001/pages/content/ds1/" + id} sandbox="allow-scripts allow-same-origin" width="100%" height="100%" frameBorder="0" />
  // )

  return (
    <div>
      <Editor
        id={id}
        isEditing={true}
      />
    </div>
  )
}

export default Content
