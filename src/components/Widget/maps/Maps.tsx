import React, { FC, useMemo, useCallback, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faKey } from '@fortawesome/free-solid-svg-icons'
import Dropdown from 'components/Dropdown'
import Choropleth, { ChoroplethSettings } from './Choropleth'

import { useAppDispatch, useAppSelector } from 'hooks'
import { selectActiveDataSpace, selectPages, selectContentByWidgetId } from 'state/selectors'
import { putWidgetSetting, publishWidget, updateContent } from 'state/actions'
import { Schema, Share, WidgetSettings, Page } from 'types'
import { useKeyStoreContext } from 'contexts'
import { toASCII } from 'utils/helpers'
import { wrapMapContent } from 'utils/maps'

import '../Widget.sass'


interface MapProps {
  id: string,
  collectionId: string,
  columnNames: {[key: string]: string},
  schema: Schema,
  settings: WidgetSettings,
  access?: Share[],
  isPublished: boolean
}

const Maps: FC<MapProps> = ({ id, collectionId, columnNames, schema, settings, access, isPublished }) => {
  const dispatch = useAppDispatch()
  const [content, setContent] = useState<string | undefined>()
  const [height, setHeight] = useState<number | undefined>()
  const [newAccess, setNewAccess] = useState<Share[] | undefined>(access)

  const { keyStore } = useKeyStoreContext()
  const dataSpace = useAppSelector(selectActiveDataSpace)
  const pages = useAppSelector(selectPages)
  const contentBlocks = useAppSelector(state => selectContentByWidgetId(state, id))

  const pageMap = useMemo(() => pages.reduce((a: {[key: string]: Page}, b) => ({...a, [b.id]: b}), {}), [ pages ])

  const handleMapType = (item: string) => {
    if (item !== settings.type) {
      dispatch(putWidgetSetting({
        id: id,
        workspace: "default",
        key: "type",
        value: item
      }))
    }
  }

  const renderMap = useMemo(() => {
    const getContentCallback = (cb: () => {content: string | undefined, height: number | undefined}) => {
      const result = cb()

      setContent(result.content)
      setHeight(result.height)
    }

    if (settings.type === "Choropleth") {
      return (
        <Choropleth
          id={id}
          collectionId={collectionId}
          nameColumnId={settings.nameColumnId}
          valueColumnId={settings.valueColumnId}
          geomColumnId={settings.geomColumnId}
          valueFormat={settings.valueFormat}
          colorRamp={settings.colorRamp}
          getContentCallback={getContentCallback}
        />
      )
    }

  }, [ id, collectionId, settings, setContent ])

  const renderMapSettings = useMemo(() => {
    if (settings.type === "Choropleth") {
      return (
        <ChoroplethSettings
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
          const pageContent = wrapMapContent(content, c.height)

          if (page.access.filter(x => x.type === "internal").length > 0 && page.key_id) {
            dispatch(updateContent({...c, ...{
              content: keyStore?.encrypt_metadata(page.key_id, pageContent)
            }}))

          } else {
            dispatch(updateContent({...c, ...{
              content: btoa(toASCII(pageContent))
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
      <div className="map-container">
        { renderMap }
      </div>

      <div className="widget-control-container">
        <div className="is-relative px-4 py-4">
          <div className="field pb-0">
            <label className="label">Type</label>
          </div>

          <Dropdown
            items={["Choropleth"]}
            onClick={handleMapType}
            selected={settings.type}
            isDisabled={isPublished}
          />

          { renderMapSettings }

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

export default Maps
