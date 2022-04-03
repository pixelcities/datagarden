import React, { FC } from 'react';

import { Schema } from 'types'

import SourceTable from 'components/SourceTable'

interface CollectionProps {
  id: string,
  uri?: string,
  schema: Schema,
  onClose: () => void
}

const Collection: FC<CollectionProps> = (props) => {
  return (
    <SourceTable {...props} isCollection={true} />
  )
}

export default Collection

