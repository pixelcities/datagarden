import React, { FC } from 'react';

import { Schema, WAL, ConceptA } from 'types'
import CustomTransformer from './components/CustomTransformer'
import MergeTransformer from './components/MergeTransformer'
import FilterTransformer from './components/FilterTransformer'
import AggregateTransformer from './components/AggregateTransformer'
import FunctionTransformer from './components/FunctionTransformer'
import PrivatiseTransformer from './components/PrivatiseTransformer'
import AttributeTransformer from './components/AttributeTransformer'
import MPCTransformer from './components/MPCTransformer'


interface TransformerSettingsProps {
  id: string,
  type?: string,
  wal?: WAL,
  tableId: string | null,
  leftId: string | null,
  rightId: string | null,
  columns: {[key: string]: ConceptA},
  schemas: Schema[],
  dimensions: {height: number, width: number},
  setHeaderCallback: any,
  setSchemaCallback: any,
  onComplete: any,
  onClose: any
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

  } else if (transformerType === "filter") {
    return (
      <FilterTransformer
        schema={props.schemas[0]}
        {...props}
      />
    )

  } else if (transformerType === "aggregate") {
    return (
      <AggregateTransformer
        schema={props.schemas[0]}
        {...props}
      />
    )

  } else if (transformerType === "function") {
    return (
      <FunctionTransformer
        schema={props.schemas[0]}
        {...props}
      />
    )

  } else if (transformerType === "privatise") {
    return (
      <PrivatiseTransformer
        schema={props.schemas[0]}
        {...props}
      />
    )

  } else if (transformerType === "attribute") {
    return (
      <AttributeTransformer
        schema={props.schemas[0]}
        {...props}
      />
    )

  } else if (transformerType === "mpc") {
    return (
      <MPCTransformer
        schema={props.schemas[0]}
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
