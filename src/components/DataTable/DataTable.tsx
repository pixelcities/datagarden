import React, { FC, useRef, useState, useLayoutEffect, useEffect } from 'react';
import { useTable as _useTable, useBlockLayout, useResizeColumns } from 'react-table'
import { FixedSizeList } from 'react-window'
import { TweenLite } from 'gsap'

import { useAppSelector } from 'hooks'
import { selectConceptMap, selectActiveDataSpace } from 'state/selectors'
import { Schema } from 'types'

import { useDataFusionContext } from 'contexts'
import { emptyTaxonomy } from 'utils/taxonomy'

import './DataTable.sass'
import HeaderDropdown from './components/HeaderDropdown'
import { columnPadding, scrollbarWidth } from './utils'

interface DataTableProps {
  id: string,
  schema: Schema,
  interactiveHeader: boolean,
  style?: any,
  versionId?: number,
  isSource?: boolean,
  highlightHeader?: boolean,
  highlightColumn?: string,
  onHeaderClick?: (id: string) => void,
  headerMapping?: {[key: string]: string},
  preview?: boolean
}

const DataTable: FC<DataTableProps> = ({ id, schema, interactiveHeader, style, versionId, isSource, highlightHeader, highlightColumn, onHeaderClick, headerMapping, preview }) => {
  const heightRef = useRef<HTMLDivElement | null>(null)
  const popupRef = useRef<HTMLDivElement | null>(null)
  const constraintRef = useRef<HTMLDivElement | null>(null)

  const [dimensions, setDimensions] = useState({height: 0, width: 0});
  const [lastClick, setLastClick] = useState("")
  const [columnId, setColumnId] = useState("")
  const [constraintErrors, setConstraintErrors] = useState<{[key: string]: string}>({})
  const [constraintMessage, setConstraintMessage] = useState("")

  const { dataFusion } = useDataFusionContext();

  const concepts = useAppSelector(selectConceptMap)
  const dataSpace = useAppSelector(selectActiveDataSpace)

  const nrRows = React.useMemo(() => {
    const rows = dataFusion.nr_rows(id)

    if (preview === true) {
      return Math.min(rows, 10)
    } else {
      return rows
    }

  // eslint-disable-next-line
  }, [ dataFusion, id, preview, versionId ])

  useLayoutEffect(() => {
    if (heightRef.current) {
      const rect = heightRef.current.getBoundingClientRect()

      setDimensions({
        height: rect.height,
        width: rect.width
      })
    }
  }, [ heightRef ]);

  const defaultColumn = React.useMemo(
    () => ({
      minWidth: 30,
      width: 100,
      maxWidth: 400,
    }),
    []
  )

  const columns = React.useMemo(() => {
    let attributes: {accessor: string, Header: string}[] = []

    schema.column_order.forEach(cid => {
      const column = schema.columns.find(column => column.id === cid)

      if (column) {
        const maybe_concept = emptyTaxonomy(dataSpace?.key_id).deserialize(concepts[column.concept_id])
        const name = maybe_concept ? maybe_concept.name : headerMapping && headerMapping[column.id] !== undefined ? headerMapping[column.id] : column.id

        attributes.push({
          accessor: column.id,
          Header: name
        })
      }
    })

    return preview === true ? attributes : columnPadding(attributes)
  }, [ dataSpace, schema, concepts, preview, headerMapping ])

  useEffect(() => {
    (async () => {
      if (columns) {
        let errors: {[key: string]: string} = {}

        for (const column of columns) {
          if (column.Header !== "") {
            const concept_id = schema.columns.find(c => c.id === column.accessor)?.concept_id

            if (concept_id) {
              const maybe_concept = emptyTaxonomy(dataSpace?.key_id).deserialize(concepts[concept_id])

              if (maybe_concept && maybe_concept.constraints !== undefined && maybe_concept.constraints.length > 0) {
                for (const constraint of maybe_concept.constraints) {
                  const isValid = await dataFusion?.test_constraint(id, column.accessor, constraint.condition)

                  if (!isValid) {
                    errors[column.accessor] = constraint.name
                  }
                }
              }
            }

          }
        }

        setConstraintErrors(errors)
      }
    })()
  }, [ columns, concepts, schema.columns, dataFusion, dataSpace?.key_id, id, versionId ])

  const scrollBarSize = React.useMemo(() => scrollbarWidth(), [])

  const useTable: any = (_useTable as any)
  const {
     getTableProps,
     getTableBodyProps,
     headerGroups,
     totalColumnsWidth,
     rows,
     prepareRow,
  } = useTable(
    {
      columns: columns,
      data: [{}], // lazy load
      defaultColumn: defaultColumn
    },
    useBlockLayout,
    useResizeColumns
  )

  const renderRow = React.useCallback(
    ({ index, style }) => {
      // we only care about the object structure
      const row = rows[0]
      const data = dataFusion.get_row(id, index)

      row.values = {...row.values, ...data}

      prepareRow(row)

      return (
        <div role="row" className="tr" {...row.getRowProps({style})}>
          <div role="row" className="index"> { index } </div>
          {row.cells.map((cell: any) => {
            return (
              <div role="cell" className={"td" + (cell.column.id === highlightColumn ? " is-highlight" : "")} {...cell.getCellProps()}>
                {cell.render('Cell')}
              </div>
            )
          })}
        </div>
      )
    },
    [ prepareRow, rows, id, dataFusion, highlightColumn ]
  )

  const handleHeaderClick = (id: string, e: any) => {
    if (onHeaderClick) {
      onHeaderClick(id)
    }

    if (interactiveHeader) {
      const rect = e.target.getBoundingClientRect()

      if (e.target.id === lastClick) {
        TweenLite.set([popupRef.current], {
          visibility: "hidden"
        })
        setLastClick("")

      } else {
        TweenLite.set([popupRef.current], {
          x: rect.left,
          y: rect.bottom,
          visibility: "visible"
        })
        setLastClick(e.target.id)
      }

      setColumnId(id)
    }
  }

  const showConstraintError = (e: any, message: string) => {
    const rect = e.target.getBoundingClientRect()

    TweenLite.set([constraintRef.current], {
      x: rect.right,
      y: rect.top,
      visibility: "visible"
    })

    setConstraintMessage(message)
  }

  const hideConstraintError = (e: any) => {
    TweenLite.set([constraintRef.current], {
      visibility: "hidden"
    })

    setConstraintMessage("")
  }

  const renderTable = (
    <div role="table" className="data" {...getTableProps()}>
      <div role="rowgroup" className="thead" style={highlightHeader ? {zIndex: 100, position: "sticky"} : {}}>
        {headerGroups.map((headerGroup: any) => (
          <div role="row" className="tr" {...headerGroup.getHeaderGroupProps()}>
            <div role="row" className="index"/>
            {headerGroup.headers.map((column: any) => (
              <div role="row" className={"th" + (constraintErrors[column.id] ? " is-error": "") + (column.id === highlightColumn ? " is-highlight" : "")}
                id={column.id}
                {...column.getHeaderProps()}
                onClick={(e) => column.Header !== "" && handleHeaderClick(column.id, e)}
                onMouseEnter={e => constraintErrors[column.id] && showConstraintError(e, constraintErrors[column.id])}
                onMouseLeave={constraintErrors[column.id] && hideConstraintError}
              >
                {column.render('Header')}
                <div {...column.getResizerProps()} className="resizer" />
              </div>
            ))}
          </div>
        ))}
      </div>
      <FixedSizeList
        height={dimensions.height-35-scrollBarSize+0} // height - header - scrollbar + buffer
        itemCount={nrRows}
        itemSize={35}
        width={totalColumnsWidth+scrollBarSize}
        style={{overflow: "scroll"}}
        versionId={versionId}
        {...getTableBodyProps()}
      >
        { renderRow }
      </FixedSizeList>
    </div>
  )

  return (
    <>
      <div ref={popupRef} className="header-popup" style={{visibility: "hidden"}}>
        <HeaderDropdown fieldId={columnId} fieldName={columns && columns.find(c => c.accessor === columnId)?.Header} inputId={id} settings={true} isSource={isSource} />
      </div>

      <div ref={constraintRef} className="constraint-popup" style={{visibility: "hidden"}}>
        <div className="box">
          <p className="has-text-danger hax-text-weight-semibold">
            Constraint error:
          </p>
          <p>
            { constraintMessage }
          </p>
        </div>
      </div>

      <div ref={heightRef} style={{position: "absolute", height: (style && "height" in style) ? style.height :"100%", width: "0"}} />

      <div key={id} className="data-container" style={style}>
        { renderTable }
      </div>
    </>
  )
}

export default DataTable

