import React, { FC, useMemo, useCallback, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faKey } from '@fortawesome/free-solid-svg-icons'
import Dropdown from 'components/Dropdown'
import Histogram, { HistogramSettings } from './Histogram'
import Donut, { DonutSettings } from './Donut'

import { useAppDispatch, useAppSelector } from 'hooks'
import { selectActiveDataSpace } from 'state/selectors'
import { putWidgetSetting, publishWidget } from 'state/actions'
import { Schema, Share, WidgetSettings } from 'types'
import { useKeyStoreContext } from 'contexts'

import './Widget.sass'


interface GraphProps {
  id: string,
  collectionId: string,
  columnNames: {[key: string]: string},
  schema: Schema,
  settings: WidgetSettings,
  access?: Share[],
  isPublished: boolean
}

const Graph: FC<GraphProps> = ({ id, collectionId, columnNames, schema, settings, access, isPublished }) => {
  const dispatch = useAppDispatch()
  const [content, setContent] = useState<string | undefined>()
  const [newAccess, setNewAccess] = useState<Share[] | undefined>(access)

  const { keyStore } = useKeyStoreContext()
  const dataSpace = useAppSelector(selectActiveDataSpace)

  const handleGraphType = (item: string) => {
    if (item !== settings.type) {
      dispatch(putWidgetSetting({
        id: id,
        workspace: "default",
        key: "type",
        value: item
      }))
    }
  }

  const renderGraph = useMemo(() => {
    const getContentCallback = (cb: () => string | undefined) => {
      setContent(cb())
    }

    if (settings.type === "Histogram") {
      return (
        <Histogram
          id={id}
          collectionId={collectionId}
          columnId={settings.column}
          xLabel={settings.xLabel}
          yLabel={settings.yLabel}
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
    }

  }, [ id, collectionId, settings, setContent ])

  const renderGraphSettings = useMemo(() => {
    if (settings.type === "Histogram") {
      return (
        <HistogramSettings
          id={id}
          columnNames={columnNames}
          settings={settings}
        />
      )
    } else if (settings.type === "Donut") {
      return (
        <DonutSettings
          id={id}
          columnNames={columnNames}
          settings={settings}
        />
      )
    }

  }, [ id, columnNames, settings ])

  const handlePublish = useCallback(() => {
    if (content && newAccess) {
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
          content: keyStore?.encrypt_metadata(dataSpace?.key_id, content)
        }}))

      } else if (isPublic) {
        dispatch(publishWidget({...payload, ...{
          content: content,
        }}))
      }
    }
  }, [ id, content, newAccess, isPublished, dispatch, dataSpace?.key_id, keyStore ])

  return (
    <>
      <div className="graph-container">
        { renderGraph }
      </div>

      <div className="widget-control-container">
        <div className="is-relative px-4 py-4">
          <div className="field pb-0">
            <label className="label">Type</label>
          </div>

          <Dropdown
            items={["Histogram", "Donut"]}
            onClick={handleGraphType}
            selected={settings.type}
          />

          { renderGraphSettings }

          <div className="field pb-0 pt-5">
            <label id="publish" className="label pb-2"> Release process </label>

            <div className="control has-icons-left pb-4">
              <div className="select is-fullwidth">
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

export default Graph
