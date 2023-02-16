import React, { FC } from 'react'

import { useAppDispatch } from 'hooks'
import { updateTransformerWAL } from 'state/actions'

import { Schema, Identifier, WAL } from 'types'

import { useDataFusionContext } from 'contexts'


interface PrivatiseTransformerProps {
  id: string,
  wal?: WAL,
  tableId: string | null,
  leftId: string | null,
  rightId: string | null,
  columnNames: {[key: string]: string},
  schema: Schema,
  dimensions: {height: number, width: number},
  setHeaderCallback: any,
  onComplete: any,
  onClose: any
}

const PrivatiseTransformer: FC<PrivatiseTransformerProps> = ({ id, wal, tableId, leftId, rightId, columnNames, schema, dimensions, setHeaderCallback, onComplete, onClose }) => {
  const dispatch = useAppDispatch()

  const { dataFusion } = useDataFusionContext()

  const handlePrivatise = React.useCallback((e: any) => {
    e.preventDefault()

    if (tableId) {
      const cloneId = dataFusion?.clone_table(tableId, "")

      dataFusion?.synthesize_table(tableId, cloneId, 1.0).then(() => {
        dataFusion?.move_table(cloneId, tableId)
        onComplete()
      })

    } else {
      console.log("Cannot build query: missing identifier")
    }

  }, [ tableId, dataFusion, onComplete ])

  const handleCommit = () => {
    let identifiers: {[key: string]: Identifier} = {"1": {"id": id, "type": "table"}}
    for (let i = 0; i < schema.column_order.length; i++) {
      identifiers[1+i] = {"id": schema.column_order[i], "type": "column"}
    }

    dispatch(updateTransformerWAL({
      id: id,
      workspace: "default",
      wal: {
        identifiers: identifiers,
        values: {},
        transactions: [],
        artifacts: []
      }
    }))

    onClose()
  }

  return (
    <div className="control-body px-4 py-4">
      <div className="control-settings">
        <form onSubmit={handlePrivatise}>
          <div className="field pb-0">
            <label className="label">Privatise</label>
          </div>
          <p className="has-text-justified">
            Generate a synthesized dataset that no longer contains the original data, so that it can be shared with your collaborators.
          </p>

          <div className="field is-grouped is-grouped-right pt-0">
            <div className="control">
              <input type="submit" className="button is-text" value="Privatise" />
            </div>
          </div>
        </form>
      </div>

      <div className="commit-footer">
        <button className="button is-primary is-fullwidth" onClick={handleCommit}> Commit </button>
      </div>
    </div>
  )
}

export default PrivatiseTransformer
