import React, { FC, useMemo, useCallback, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faKey } from '@fortawesome/free-solid-svg-icons'
import Dropdown from 'components/Dropdown'
import Histogram, { HistogramSettings } from './Histogram'
import Donut, { DonutSettings } from './Donut'
import Bar, { BarSettings } from './Bar'
import Line, { LineSettings } from './Line'
import Area, { AreaSettings } from './Area'

import { useAppDispatch, useAppSelector } from 'hooks'
import { selectActiveDataSpace, selectPages, selectContentByWidgetId } from 'state/selectors'
import { putWidgetSetting, publishWidget, updateContent } from 'state/actions'
import { Schema, Share, WidgetSettings, Page } from 'types'
import { useKeyStoreContext } from 'contexts'
import { wrapChartContent } from 'utils/charts'

import '../Widget.sass'


interface ChartProps {
  id: string,
  collectionId: string,
  columnNames: {[key: string]: string},
  schema: Schema,
  settings: WidgetSettings,
  access?: Share[],
  isPublished: boolean
}

const Chart: FC<ChartProps> = ({ id, collectionId, columnNames, schema, settings, access, isPublished }) => {
  const dispatch = useAppDispatch()
  const [content, setContent] = useState<string | undefined>()
  const [height, setHeight] = useState<number | undefined>()
  const [newAccess, setNewAccess] = useState<Share[] | undefined>(access)

  const { keyStore } = useKeyStoreContext()
  const dataSpace = useAppSelector(selectActiveDataSpace)
  const pages = useAppSelector(selectPages)
  const contentBlocks = useAppSelector(state => selectContentByWidgetId(state, id))

  const pageMap = useMemo(() => pages.reduce((a: {[key: string]: Page}, b) => ({...a, [b.id]: b}), {}), [ pages ])

  const handleChartType = (item: string) => {
    if (item !== settings.type) {
      dispatch(putWidgetSetting({
        id: id,
        workspace: "default",
        key: "type",
        value: item
      }))
    }
  }

  const renderChart = useMemo(() => {
    const getContentCallback = (cb: () => {content: string | undefined, height: number | undefined}) => {
      const result = cb()

      setContent(result.content)
      setHeight(result.height)
    }

    if (settings.type === "Histogram") {
      return (
        <Histogram
          id={id}
          collectionId={collectionId}
          columnId={settings.column}
          xLabel={settings.xLabel}
          yLabel={settings.yLabel}
          color={settings.color}
          nrBins={parseInt(settings.nrBins)}
          getContentCallback={getContentCallback}
        />
      )
    } else if (settings.type === "Donut") {
      return (
        <Donut
          id={id}
          collectionId={collectionId}
          nameColumnId={settings.nameColumnId}
          valueColumnId={settings.valueColumnId}
          getContentCallback={getContentCallback}
        />
      )
    } else if (settings.type === "Bar") {
      return (
        <Bar
          id={id}
          collectionId={collectionId}
          nameColumnId={settings.nameColumnId}
          valueColumnId={settings.valueColumnId}
          xLabel={settings.xLabel}
          yLabel={settings.yLabel}
          yFormat={settings.yFormat}
          color={settings.color}
          sort={settings.sort}
          getContentCallback={getContentCallback}
        />
      )
    } else if (settings.type === "Line") {
      return (
        <Line
          id={id}
          collectionId={collectionId}
          timeColumnId={settings.timeColumnId}
          valueColumnId={settings.valueColumnId}
          xLabel={settings.xLabel}
          yLabel={settings.yLabel}
          color={settings.color}
          getContentCallback={getContentCallback}
        />
      )
    } else if (settings.type === "Area") {
      return (
        <Area
          id={id}
          collectionId={collectionId}
          timeColumnId={settings.timeColumnId}
          valueColumnId={settings.valueColumnId}
          xLabel={settings.xLabel}
          yLabel={settings.yLabel}
          color={settings.color}
          getContentCallback={getContentCallback}
        />
      )
    }

  }, [ id, collectionId, settings, setContent ])

  const renderChartSettings = useMemo(() => {
    if (settings.type === "Histogram") {
      return (
        <HistogramSettings
          id={id}
          columnNames={columnNames}
          settings={settings}
          isPublished={isPublished}
        />
      )
    } else if (settings.type === "Donut") {
      return (
        <DonutSettings
          id={id}
          columnNames={columnNames}
          settings={settings}
          isPublished={isPublished}
        />
      )
    } else if (settings.type === "Bar") {
      return (
        <BarSettings
          id={id}
          columnNames={columnNames}
          settings={settings}
          isPublished={isPublished}
        />
      )
    } else if (settings.type === "Line") {
      return (
        <LineSettings
          id={id}
          columnNames={columnNames}
          settings={settings}
          isPublished={isPublished}
        />
      )
    } else if (settings.type === "Area") {
      return (
        <AreaSettings
          id={id}
          columnNames={columnNames}
          settings={settings}
          isPublished={isPublished}
        />
      )
    }

  }, [ id, columnNames, settings, isPublished ])

  const handlePublish = useCallback(() => {
    if (content && newAccess) {
      // Start with updating all the linked content (if any)
      if (contentBlocks.length > 0 && !isPublished) {
        for (const c of contentBlocks) {
          const page = pageMap[c.page_id]
          const pageContent = wrapChartContent(content, c.height)

          if (page.access.filter(x => x.type === "internal").length > 0 && page.key_id) {
            dispatch(updateContent({...c, ...{
              content: keyStore?.encrypt_metadata(page.key_id, pageContent)
            }}))

          } else {
            dispatch(updateContent({...c, ...{
              content: btoa(encodeURIComponent(pageContent))
            }}))
          }
        }
      }

      // Next, update the widget itself
      const payload = {
        id: id,
        workspace: "default",
        access: newAccess,
        is_published: !isPublished
      }

      const isInternal = newAccess.filter(access => access.type === "internal").length > 0
      const isPublic = newAccess.filter(access => access.type === "public").length > 0

      if (isInternal) {
        dispatch(publishWidget({...payload, ...{
          content: keyStore?.encrypt_metadata(dataSpace?.key_id, content),
          height: height
        }}))

      } else if (isPublic) {
        dispatch(publishWidget({...payload, ...{
          content: content,
          height: height
        }}))
      }
    }
  }, [ id, content, height, newAccess, isPublished, contentBlocks, pageMap, dispatch, dataSpace?.key_id, keyStore ])

  return (
    <>
      <div className="chart-container">
        { renderChart }
      </div>

      <div className="widget-control-container">
        <div className="is-relative px-4 py-4">
          <div className="field pb-0">
            <label className="label">Type</label>
          </div>

          <Dropdown
            items={["Histogram", "Donut", "Bar", "Line", "Area"]}
            onClick={handleChartType}
            selected={settings.type}
            isDisabled={isPublished}
          />

          { renderChartSettings }

          <div className="field pb-0 pt-5">
            <label id="publish" className="label pb-2"> Release process </label>

            <div className="control has-icons-left pb-4">
              <div className={"select is-fullwidth" + (isPublished ? " is-disabled" : "")} style={isPublished ? {pointerEvents: "none"} : {}}>
                <select onChange={(e: any) => setNewAccess([{"type": e.target.value}])} value={(newAccess && newAccess.length > 0) ? newAccess[0].type : ""}>
                  <option value="internal">Internal</option>
                  <option value="public">Public</option>
                </select>
              </div>
              <div className="icon is-small is-left pb-2">
                <FontAwesomeIcon icon={faKey} size="sm"/>
              </div>
            </div>

            <div onClick={() => handlePublish()}>
              <input type="checkbox" className="switch" checked={isPublished} readOnly={true} />
              <label>
                { isPublished ? "Published" : "Unpublished" }
              </label>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

export default Chart
