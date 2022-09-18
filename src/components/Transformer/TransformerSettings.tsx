import React, { FC } from 'react';

import { Schema, WAL } from 'types'
import CustomTransformer from './components/CustomTransformer'
import MergeTransformer from './components/MergeTransformer'


interface TransformerSettingsProps {
  id: string,
  type?: string,
  wal?: WAL,
  tableId: string | null,
  leftId: string | null,
  rightId: string | null,
  columnNames: {[key: string]: string},
  schemas: Schema[],
  dimensions: {height: number, width: number},
  setHeaderCallback: any,
  onComplete: any
}


const TransformerSettings: FC<TransformerSettingsProps> = (props) => {
  const transformerType = props["type"]

  if (transformerType === "custom") {
    return (
      <CustomTransformer
        schema={props.schemas[0]}
        {...props}
      />
    )

  } else if (transformerType === "merge") {
    return (
      <MergeTransformer
        leftSchema={props.schemas[0]}
        rightSchema={props.schemas[1]}
        {...props}
      />
    )

  } else {
    return (
      <></>
    )
  }
}

export default TransformerSettings