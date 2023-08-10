import React, { FC, useMemo, useCallback, useEffect, useState } from 'react'

import { getDataTokens } from 'utils/getDataTokens'
import { useDataFusionContext } from 'contexts'
import { useKeyStoreContext } from 'contexts'
import { useAuthContext } from 'contexts';

import { useAppDispatch, useAppSelector } from 'hooks'
import { createSource, createMetadata, createConcept, createDataURI } from 'state/actions'
import { selectDataURIById, selectActiveDataSpace } from 'state/selectors'
import { Source, DataType } from 'types'
import { emptyTaxonomy } from 'utils/taxonomy'
import { signSchema } from 'utils/integrity'

// https://github.com/denoland/deno/issues/12754
declare global {
  interface Crypto {
    randomUUID: () => string;
  }
}

interface LocalSourceProps {
  type: "csv" | "spreadsheet",
  onComplete: (source: Source) => void
}

const LocalSource: FC<LocalSourceProps> = ({type, onComplete}) => {
  const { arrow, dataFusion, loadArrow } = useDataFusionContext();
  const { user } = useAuthContext();
  const { keyStore } = useKeyStoreContext();
  const dispatch = useAppDispatch()

  useEffect(() => loadArrow(), [ loadArrow ])

  const tableId = useMemo(() => crypto.randomUUID(), [])

  const [isLoaded, setIsLoaded] = useState<boolean>(false)

  const dataURI = useAppSelector(state => selectDataURIById(state, tableId))
  const dataSpace = useAppSelector(selectActiveDataSpace)

  const loadTable = (e: any) => {
    const f = e.target.files[0];
    const name = f.name;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const buf = ev?.target?.result

      if (!buf || typeof(buf) === "string") {
        return
      }

      if (!user) {
        return
      }

      const data = new Uint8Array(buf)
      if (type === "csv") {
        dataFusion.load_csv(data, tableId)
      } else {
        dataFusion.load_sheet(data, tableId)
      }

      const originalSchema = dataFusion.get_schema(tableId)

      let attributes: {id: string, concept_id: string, name: string}[] = []
      let fields = []

      for (const field of originalSchema.fields) {
        const id = crypto.randomUUID()

        fields.push({...field, ...{name: id}})
        attributes.push({
          id: id,
          concept_id: crypto.randomUUID(),
          name: field.name
        })
      }

      dataFusion.update_schema(tableId, {...originalSchema, ...{fields: fields}})

      const path = `/${name}`
      const uri = dataURI?.uri ?? ""
      const tag = dataURI?.tag ?? ""

      // Get fresh session tokens
      getDataTokens(uri + `/${tableId}.parquet`, tag, "write").then(tokens => {
        const s3_path = uri.split("s3://")[1] + `/${tableId}.parquet`

        // Get a table description
        dataFusion.describe_table(tableId).then((tableDescription: any) => {

          // Publish the title
          dispatch(createMetadata({
            id: tableId,
            workspace: "default",
            metadata: keyStore?.encrypt_metadata(dataSpace?.key_id, name)
          }))

          // Publish the concepts
          const taxonomy = emptyTaxonomy(dataSpace?.key_id)

          for (let attribute of attributes) {
            const description = tableDescription.descriptions.find((d: any) => d.name === attribute.id)

            let dataType = DataType.Other
            let aggregateFn = "array_agg"

            if (description) {
              if (description.data_type.indexOf("Int") !== -1 || description.data_type.indexOf("Float") !== -1) {
                // Very basic check to auto assign the right aggregate function type
                if (description.min > 0 && (description.max <= 1 || description.max <= 100)) {
                  dataType = description.data_type.indexOf("Int") !== -1 ? DataType.RelativeInteger : DataType.RelativeDecimal
                  aggregateFn = "avg"

                } else {
                  dataType = description.data_type.indexOf("Int") !== -1 ? DataType.AbsoluteInteger : DataType.AbsoluteDecimal
                  aggregateFn = "sum"
                }
              }

              if (description.data_type === "Utf8") {
                dataType = DataType.String
              }
            }

            const concept = taxonomy.serialize({
              id: attribute.concept_id,
              workspace: "default",
              name: attribute.name,
              dataType: dataType,
              aggregateFn: aggregateFn
            })

            if (concept) {
              dispatch(createConcept(concept))
            }
          }

          // Generate the keys
          generateColumnsWithKeys(attributes, user.id).then((columns) => {
            keyStore?.generate_key(16).then((key_id: string) => {
              const schema = {
                id: tableId,
                key_id: key_id,
                column_order: columns.map(c => c.id),
                columns: columns,
                shares: [
                  {
                    type: "owner",
                    principal: user?.id
                  }
                ]
              }

              // TODO: this should be the metadata key when it is shared internally
              let keymap = [
                "__FOOTER", key_id, keyStore?.get_key(key_id)
              ]

              for (let column of columns) {
                keymap.push(column.id)
                keymap.push(column.key_id)
                keymap.push(keyStore?.get_key(column.key_id))
              }

              // Save the table
              const table = dataFusion.export_table(tableId)
              arrow["FS"].writeFile(path, table)

              arrow.write_remote_parquet(path, s3_path, tokens.access_key, tokens.secret_key, tokens.session_token, keymap).then(() => {
                signSchema(schema, keyStore?.get_key(key_id)).then(signedSchema => {
                  // Save the metadata
                  const source = {
                    id: tableId,
                    workspace: "default",
                    type: type,
                    uri: [uri, tag] as [string, string],
                    schema: signedSchema,
                    is_published: false
                  }

                  dispatch(createSource(source))
                  onComplete(source)

                  setIsLoaded(true)
                })
              })
            })
          })
        })
      }).catch(() => {
        console.log("Error getting data tokens")
      })
    }
    reader.readAsArrayBuffer(f)
  }

  const generateColumnsWithKeys = useCallback(async (attributes: any, userId: string) => {
    let columns = []

    for (let attribute of attributes) {
      const key_id = await keyStore?.generate_key(16)

      columns.push({
        id: attribute.id,
        concept_id: attribute.concept_id,
        key_id: key_id,
        lineage: null,
        shares: [
          {
            type: "owner",
            principal: userId
          }
        ]
      })
    }

    return columns
  }, [ keyStore ])

  useEffect(() => {
    dispatch(createDataURI({
      id: tableId,
      workspace: "default",
      type: "source"
    }))
  }, [tableId, dispatch])

  if (dataURI && !isLoaded) {
    return (
      <div>
        <input type="file" name="file" onChange={loadTable} />
      </div>
    )

  } else {
    return (
      <></>
    )
  }
}

export default LocalSource
