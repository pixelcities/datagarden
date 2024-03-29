import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons'

import { useAppSelector, useAppDispatch } from 'hooks'
import { selectSignaturesByTransformerId, selectActiveDataSpace } from 'state/selectors'
import { createMPC, approveTransformer, updateTransformerWAL, sendLocalNotification } from 'state/actions'

import Dropdown from 'components/Dropdown'
import { Schema, WAL, ConceptA } from 'types'
import { getColumnIds } from 'utils/helpers'
import { getIdentifiers } from 'utils/query'

import { useAuthContext } from 'contexts'
import { useKeyStoreContext } from 'contexts'
import { useDataFusionContext } from 'contexts'


interface MPCTransformerProps {
  id: string,
  wal?: WAL,
  tableId: string | null,
  leftId: string | null,
  rightId: string | null,
  columns: {[key: string]: ConceptA},
  schema: Schema,
  dimensions: {height: number, width: number},
  setHeaderCallback: any,
  onComplete: any,
  onClose: any
}

const MPCTransformer: FC<MPCTransformerProps> = ({ id, wal, tableId, leftId, rightId, columns, schema, dimensions, setHeaderCallback, onComplete, onClose }) => {
  const dispatch = useAppDispatch()

  const [selectedColumns, setSelectedColumns] = useState<([string, string] | null)[]>([null, null, null])
  const [groupClauses, setGroupClauses] = useState<([string, string] | null)[]>([])
  const [outputColumn, setOutputColumn] = useState<([string, string] | null)>(null)
  const [log, setLog] = useState<WAL>(wal ?? {identifiers: {}, values: {}, transactions: [], artifacts: []})

  const [startup, setStartup] = useState(true)
  const [replay, setReplay] = useState(false)
  const [isDisabled, setIsDisabled] = useState(true)

  const { user } = useAuthContext()
  const { keyStore, protocol } = useKeyStoreContext()
  const { dataFusion } = useDataFusionContext()

  const dataSpace = useAppSelector(selectActiveDataSpace)
  const signatures = useAppSelector(state => selectSignaturesByTransformerId(state, id))

  const isLocked = useMemo(() => (wal && wal.transactions.length > 0), [ wal ])
  const columnNames: [string, string][] = useMemo(() => Object.entries(columns).map(([id, concept]) => [id, concept.name]), [ columns ])

  const onError = useCallback((error: string) => {
    console.error(error)

    dispatch(sendLocalNotification({
      id: crypto.randomUUID(),
      type: "error",
      message: error,
      is_urgent: true,
      is_local: true
    }))
  }, [ dispatch ])

  // Rebuild state
  useEffect(() => {
    if (tableId && startup && wal && wal.transactions.length > 0) {
      let selectNames: [string, string][] = []
      let groupClauses: [string, string][] = []
      let outName: ([string, string] | null) = null

      for (const transaction of wal.transactions) {
        for (const match of transaction.matchAll(/SUM\(([[0-9I%$]+)\) AS ([[0-9I%$]+)/g)) {
          if (match[1] && match[2]) {
            const inId = Number(match[1].match(/%([0-9]+)\$I/)![1])
            const outId = Number(match[2].match(/%([0-9]+)\$I/)![1])

            const columnId = wal.identifiers[inId]?.id
            const columnName = columns[columnId]?.name

            const outputId = wal.identifiers[outId]?.id
            const outputName = columns[outputId]?.name

            if (columnId && outputId) {
              selectNames.push([columnId, columnName])
              outName = [outputId, outputName]
            }
          }
        }
      }

      if (wal.transactions[0].indexOf("GROUP BY") !== -1) {
        for (const match of wal.transactions[0].split("GROUP BY")[1].matchAll(/ *%([0-9]+)\$I/g)) {
          if (match[1]) {
            const columnId = wal.identifiers[Number(match[1])]?.id
            const columnName = columns[columnId]?.name

            if (columnName) {
              groupClauses.push([columnId, columnName])
            }
          }
        }
      }

      setSelectedColumns(selectNames)
      setGroupClauses(groupClauses)
      setOutputColumn(outName)

      setStartup(false)
      setReplay(true)
      setIsDisabled(true)
    }
  }, [ tableId, startup, wal, columns ])

  const execute = useCallback(async () => {
    const columnIds = selectedColumns.filter((x): x is [string, string] => !!x).map(x => x[0])
    const groupIds = groupClauses.filter((x): x is [string, string] => !!x).map(x => x[0])
    const outputId = outputColumn?.[0]

    const ownedIds = getColumnIds(user, schema).filter(x => columnIds.indexOf(x) !== -1)

    if (ownedIds.length !== 1) {
      throw new Error("Invalid access to one of the input columns")
    }

    if (tableId && outputId) {
      const { identifiers, ids } = getIdentifiers(log.identifiers, [tableId], [...columnIds, ...groupIds, ...[outputId]])

      const groupIdClauses = groupIds.map((groupId, i) => `%${ids[groupId]}$I`)
      const groupNameClauses = groupIds.map((groupId, i) => `"${groupId}"`)
      const groupBy = (groupIds.length > 0) ? "GROUP BY" : ""

      let transactions: string[] = []
      let queries: string[] = []

      for (const columnId of columnIds) {
        const selectIdClauses = [...groupIdClauses, ...[`SUM(%${ids[columnId]}$I) AS %${ids[outputId]}$I`]]
        const selectNameClauses = [...groupNameClauses, ...[`SUM("${columnId}") AS "${outputId}"`]]

        transactions.push(`SELECT ${selectIdClauses.join(",")} FROM %${ids[tableId]}$I ${groupBy} ${groupIdClauses.join(",")}`)
        queries.push(`SELECT ${selectNameClauses.join(",")} FROM "${tableId}" ${groupBy} ${groupNameClauses.join(",")}`)
      }

      const offset = columnIds.indexOf(ownedIds[0])
      const artifact = await dataFusion?.query(tableId, queries[offset])

      onComplete()

      return {
        identifiers: identifiers,
        transactions: transactions,
        artifacts: transactions.map(_ => artifact),
        values: {}
      }

    } else {
      throw new Error("Cannot build query: missing identifier")
    }
  }, [ tableId, schema, log, onComplete, user, dataFusion, selectedColumns, groupClauses, outputColumn ])

  // Replay if old state was loaded
  useEffect(() => {
    if (tableId && replay && selectedColumns.length > 0) {
      setReplay(false)

      dataFusion?.clone_table(leftId, tableId)
      execute()
        .catch((e) => onError(e ? e.message : "Error executing query"))
    }
  }, [ leftId, tableId, replay, selectedColumns, execute, dataFusion, onError ])

  const handlePreview = (e: any) => {
    e.preventDefault()

    dataFusion?.clone_table(leftId, tableId)
    execute()
      .then((result) => {
        setLog(result)
        setIsDisabled(false)
      })
      .catch((e) => onError(e ? e.message : "Error executing query"))
  }

  const handleCommit = () => {
    const nrRows = dataFusion?.nr_rows(tableId)

    // Generate a random value for rows * parties. This is meant to safeguard the values from the server,
    // so it's okay to just generate one big array up front. If a party colludes with the server all bets
    // are off anyways.
    let randomArray: number[] = []

    // Generate the values as BigInt to get nice and large numbers, but convert to Number afterwards to be
    // able to convert to json. When executing the sum, the real value will be added to the random value based
    // on the type (e.g. decimals are multiplied first), which _could_ overflow and should use BigInt.
    //
    // To compute the result, BigInt has to be used again.
    const buffer = new BigInt64Array(selectedColumns.length * nrRows)
    window.crypto.getRandomValues(buffer)

    for (const random of buffer) {
      randomArray.push(Number(random))
    }

    const data = keyStore?.encrypt_metadata(dataSpace?.key_id, JSON.stringify({
      selected: selectedColumns.map(x => x![0]),
      groups: groupClauses.map(x => x![0]),
      output: outputColumn![0],
      randoms: randomArray
    }))

    protocol?.sign(id + Object.values(log.identifiers).map(x => x.id).join() + log.transactions.join()).then((signature: string) => {
      dispatch(createMPC({
        id: id,
        nr_parties: selectedColumns.length
      }))

      dispatch(updateTransformerWAL({
        id: id,
        workspace: "default",
        wal: {...log, ...{
          data: data
        }}
      }))

      if (user) {
        dispatch(approveTransformer({
          id: id,
          workspace: "default",
          nr_parties: selectedColumns.length,
          signatures: [`${user.id}:${signature}`]
        }))
      }

      onClose()
    })
  }

  const handleApprove = useCallback(() => {
    if (user) {
      protocol?.sign(id + Object.values(log.identifiers).map(x => x.id).join() + log.transactions.join()).then((signature: string) => {
        dispatch(approveTransformer({
          id: id,
          workspace: "default",
          signatures: [...(signatures || []), ...[`${user.id}:${signature}`]]
        }))
      })
    }

    onClose()
  }, [ id, user, protocol, dispatch, signatures, log, onClose ])

  const columnSelection = React.useMemo(() => {
    return selectedColumns.map((column, i) => {
      return (
        <div key={"columnselection" + (column !== null) + i} className="field has-addons is-horizontal pb-0">
          <Dropdown
            items={columnNames}
            maxWidth={110}
            onClick={item => setSelectedColumns(selectedColumns.map((x, j) => i === j ? item : x)) }
            selected={column}
          />
        </div>
      )
    })
  }, [ selectedColumns, columnNames, setSelectedColumns ])

  const handleAddColumn = (e: any) => {
    e.preventDefault()

    setSelectedColumns([...selectedColumns, null])
  }

  const handleDelColumn = (e: any) => {
    e.preventDefault()

    if (selectedColumns.length > 3) {
      setSelectedColumns(selectedColumns.slice(0, -1))
    }
  }

  const groupSelection = React.useMemo(() => {
    return groupClauses.map((group, i) => {
      return (
        <div key={"groupselection" + (group !== null) + i} className="field has-addons is-horizontal pb-0">
          <Dropdown
            items={columnNames}
            maxWidth={110}
            onClick={item => setGroupClauses(groupClauses.map((x, j) => i === j ? item : x)) }
            selected={group}
            isDisabled={isLocked}
          />
        </div>
      )
    })
  }, [ groupClauses, columnNames, setGroupClauses, isLocked ])

  const handleAddGroup = (e: any) => {
    e.preventDefault()

    setGroupClauses([...groupClauses, null])
  }

  const handleDelGroup = (e: any) => {
    e.preventDefault()

    if (groupClauses.length > 0) {
      setGroupClauses(groupClauses.slice(0, -1))
    }
  }

  const approvalOverview = useMemo(() => {
    const approvedUsers = signatures?.map(x => x.split(":")[0]) ?? []

    return selectedColumns.filter(x => x !== null).map((selectedColumn, i) => {
      const column = schema.columns.find(x => x.id === selectedColumn![0])
      const approvedColumn = column && !!column.shares.find(x => approvedUsers.indexOf(x.principal!) !== -1)
      const showApprove = column && !!column.shares.find(x => x.principal === user?.id)

      return (
        <tr key={i}>
          <td>
            <input className="input" style={{marginTop: "0.1rem", width: 125}} disabled={true} value={selectedColumn![1]} />
          </td>

          <td>
            { (showApprove && !approvedColumn) ?
              <button className="button is-fullwidth is-primary" onClick={handleApprove}> Approve </button>
            :
              <input className="input has-text-centered" style={{marginTop: "0.1rem", width: 125}} disabled={true} value={(approvedColumn ? "Approved" : "Not Approved")} />
            }
          </td>
        </tr>
      )
    })
  }, [ selectedColumns, schema, signatures, user, handleApprove ])

  const renderCreate = (
    <div className="control-body px-4 py-4">
      <div className="control-settings">
        <form onSubmit={handlePreview}>
          <div className="field pb-0">
            <div className="hover-buttons is-right">
              <button className="hover-button is-small" onClick={handleDelColumn}>
                <span className="icon is-small">
                  <FontAwesomeIcon icon={faMinus} size="sm"/>
                </span>
              </button>
              <button className="hover-button is-small" onClick={handleAddColumn}>
                <span className="icon is-small">
                  <FontAwesomeIcon icon={faPlus} size="sm"/>
                </span>
              </button>
            </div>
            <label className="label">Input Columns</label>
          </div>

          { columnSelection }

          <div className="field pb-0">
            <div className="hover-buttons is-right">
              <button className="hover-button is-small" onClick={handleDelGroup}>
                <span className="icon is-small">
                  <FontAwesomeIcon icon={faMinus} size="sm"/>
                </span>
              </button>
              <button className="hover-button is-small" onClick={handleAddGroup}>
                <span className="icon is-small">
                  <FontAwesomeIcon icon={faPlus} size="sm"/>
                </span>
              </button>
            </div>
            <label className="label">Group Columns</label>
          </div>

          { groupSelection }

          <div className="field pb-0">
            <label className="label">Output Column</label>

            <Dropdown
              items={columnNames}
              maxWidth={110}
              onClick={item => setOutputColumn(item)}
              selected={outputColumn}
            />
          </div>

          <div className="field is-grouped is-grouped-right pt-0">
            <div className="control">
              <input type="submit" className="button is-text" value="Preview" />
            </div>
          </div>

        </form>
      </div>

      <div className="commit-footer">
        <button className="button is-primary is-fullwidth" onClick={handleCommit} disabled={isDisabled}> Compute Secure Sum </button>
      </div>
    </div>
  )

  const renderApprove = (
    <div className="control-body px-4 py-4">
      <div className="control-settings">
        <div className="field pb-0">
          <label className="label">Input Columns</label>
        </div>

        <table className="table is-hoverable is-narrow is-fullwidth">
          <thead>
            <tr>
              <th style={{minWidth: "125px"}}><span style={{fontSize: "small"}}> Name </span></th>
              <th><span style={{fontSize: "small"}}> Status </span></th>
            </tr>
          </thead>

          <tbody>
            { approvalOverview }
          </tbody>
        </table>

        <div className="field pb-0">
          <label className="label">Group By</label>
        </div>

        { groupSelection }

      </div>
    </div>
  )

  return isLocked ? renderApprove : renderCreate
}

export default MPCTransformer
