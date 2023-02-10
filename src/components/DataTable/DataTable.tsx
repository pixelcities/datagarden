import React, { FC, useRef, useState, useLayoutEffect } from 'react';
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
  highlightHeader?: boolean,
  onHeaderClick?: (id: string) => void
}

const DataTable: FC<DataTableProps> = ({ id, schema, interactiveHeader, style, versionId, highlightHeader, onHeaderClick }) => {
  const heightRef = useRef<HTMLDivElement | null>(null)
  const popupRef = useRef<HTMLDivElement | null>(null)

  const [dimensions, setDimensions] = useState({height: 0, width: 0});
  const [lastClick, setLastClick] = useState("")
  const [columnId, setColumnId] = useState("")

  const { dataFusion } = useDataFusionContext();

  const concepts = useAppSelector(selectConceptMap)
  const dataSpace = useAppSelector(selectActiveDataSpace)

  const nrRows = React.useMemo(() => {
    return dataFusion.nr_rows(id)

  // eslint-disable-next-line
  }, [ dataFusion, id, versionId ]);

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
        const name = maybe_concept ? maybe_concept.name : column.id

        attributes.push({
          accessor: column.id,
          Header: name
        })
      }
    })

    return columnPadding(attributes)
  }, [ dataSpace, schema, concepts ])

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
              <div role="cell" className="td" {...cell.getCellProps()}>
                {cell.render('Cell')}
              </div>
            )
          })}
        </div>
      )
    },
    [ prepareRow, rows, id, dataFusion ]
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

  const renderTable = (
    <div role="table" className="data" {...getTableProps()}>
      <div role="rowgroup" className="thead" style={highlightHeader ? {zIndex: 100, position: "sticky"} : {}}>
        {headerGroups.map((headerGroup: any) => (
          <div role="row" className="tr" {...headerGroup.getHeaderGroupProps()}>
            <div role="row" className="index"/>
            {headerGroup.headers.map((column: any) => (
              <div role="row" className="th"
                id={column.id}
                {...column.getHeaderProps()}
                onClick={(e) => handleHeaderClick(column.id, e)}
              >
                {column.render('Header')}
                <div {...column.getResizerProps()} className="resizer" />
              </div>
            ))}
          </div>
        ))}
      </div>
      <FixedSizeList
        height={dimensions.height-35-scrollBarSize+10} // height - header - scrollbar + buffer
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
        <HeaderDropdown fieldId={columnId} fieldName={columns && columns.find(c => c.accessor === columnId)?.Header} inputId={id} settings={true} />
      </div>

      <div ref={heightRef} style={{position: "absolute", height: "100%", width: "0"}} />

      <div className="data-container" style={style}>
        { renderTable }
      </div>
    </>
  )
}

export default DataTable

