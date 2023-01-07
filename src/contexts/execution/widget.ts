import { EnhancedStore } from '@reduxjs/toolkit'

import { ExecutionError, DataSpace, User, Task, Content, Page, Share } from 'types'
import { RootState } from 'state/store'
import { publishWidget, updateContent } from 'state/actions'
import { toASCII } from 'utils/helpers'
import { renderDonut, renderHistogram, wrapChartContent } from 'utils/charts'

import { loadRemoteTable } from 'utils/loadRemoteTable'

export const handleTask = (task: Task, user: User, dataSpace: DataSpace, store: EnhancedStore<RootState>, keyStore: any, arrow: any, dataFusion: any) => {
  return new Promise<{actions: any[], metadata: {[key: string]: any}}>((resolve, reject) => {
    const instruction = task.task["instruction"]
    const widget_id = task.task["widget_id"]

    const widget = store.getState().widgets.entities[widget_id]
    const collection = widget?.collection && store.getState().collections.entities[widget.collection]

    const content = Object.values(store.getState().content.entities).filter((x): x is Content => !!x && x?.widget_id === widget?.id)
    const pages = Object.values(store.getState().pages.entities).filter((x): x is Page => !!x).reduce((a: {[key: string]: Page}, b) => ({...a, [b.id]: b}), {})

    if (!widget || !collection) {
      reject(ExecutionError.Retry)
      return
    }

    console.log("Received a widget task: ", task.task)

    let actions: any[] = []
    const access: Share[] = widget.access || []
    const settings = widget.settings
    const fragments = collection.schema.column_order

    return new Promise<void>((resolve, reject) => {
      if (dataFusion?.table_exists(collection?.id)) {
        resolve()

      } else if (collection?.id && collection?.uri) {
        loadRemoteTable(collection.id, collection.uri, collection.schema, user, arrow, dataFusion, keyStore, fragments).then(() => resolve())
      }
    }).then(() => {
      if (instruction === "update_content") {
        const nrRows = dataFusion?.nr_rows(collection.id)

        let data = []
        for (let i = 0; i < nrRows; i++) {
          data.push(dataFusion?.get_row(collection.id, i))
        }

        let svg = ''
        if (settings.type === "Histogram") {
          svg = renderHistogram(data, settings.columnId, settings.xLabel, settings.yLabel, parseInt(settings.nrBins)).outerHTML
        } else if (settings.type === "Donut") {
          svg = renderDonut(data, settings.nameColumnId, settings.valueColumnId).outerHTML
        }

        if (content.length > 0) {
          for (const c of content) {
            const page = pages[c.page_id]
            const pageContent = wrapChartContent(svg, c.height)

            if (page.access.filter(x => x.type === "internal").length > 0 && page.key_id) {
              actions.push(updateContent({...c, ...{
                content: keyStore?.encrypt_metadata(page.key_id, pageContent)
              }}))

            } else {
              actions.push(updateContent({...c, ...{
                content: btoa(toASCII(pageContent))
              }}))
            }
          }
        }

        if (access.filter(access => access.type === "internal").length > 0) {
          actions.push(publishWidget({...widget, ...{
            access: access,
            content: keyStore?.encrypt_metadata(dataSpace?.key_id, svg)
          }}))

        } else if (access.filter(access => access.type === "public").length > 0) {
          actions.push(publishWidget({...widget, ...{
            access: access,
            content: svg
          }}))
        }

        resolve({
          actions: actions,
          metadata: {}
        })
      }
    })
  })
}
