import React, { FC, useMemo, useCallback, useEffect, useState } from 'react'

import { getDataTokens } from 'utils/getDataTokens'
import { useDataFusionContext } from 'contexts'
import { useKeyStoreContext } from 'contexts'
import { useAuthContext } from 'contexts';

import { useAppDispatch, useAppSelector } from 'hooks'
import { createSource, createMetadata, createDataURI } from 'state/actions'
import { selectDataURIById } from 'state/selectors'
import { Source } from 'types'


// https://github.com/denoland/deno/issues/12754
declare global {
  interface Crypto {
    randomUUID: () => string;
  }
}

const loadCsv = (text: string | ArrayBuffer | null | undefined) => {
  if ( typeof(text) === "string") {
    const ln = text.indexOf("\n")
    const header = text.substr(0, ln)
    const rest = text.substr(ln)

    const attributes = header.split(",").map((column) => {
      return {
        id: crypto.randomUUID(),
        name: column
      }
    })

    const csv = attributes.map(c => c.id).join(",") + rest

    return {
      csv,
      attributes
    }
  }
}

interface CsvSourceProps {
  onComplete: (source: Source) => void
}

const CsvSource: FC<CsvSourceProps> = ({onComplete}) => {
  const { arrow, dataFusion, loadArrow } = useDataFusionContext();
  const { user } = useAuthContext();
  const { keyStore } = useKeyStoreContext();
  const dispatch = useAppDispatch()

  useEffect(() => loadArrow(), [ loadArrow ])

  const tableId = useMemo(() => crypto.randomUUID(), [])

  const [isLoaded, setIsLoaded] = useState<boolean>(false)

  const dataURI = useAppSelector(state => selectDataURIById(state, tableId))

  const loadTable = (e: any) => {
    const f = e.target.files[0];
    const name = f.name;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = loadCsv(ev?.target?.result)

      if (!parsed) {
        console.log("Error while parsing csv")
        return
      }

      const { csv, attributes } = parsed
      const path = `/${name}`
      const uri = dataURI?.uri ?? ""

      // Get fresh session tokens
      getDataTokens(uri).then(tokens => {
        const s3_path = uri.split("s3://")[1] + `/${tableId}.parquet`

        // Load the csv and transform it to an arrow table
        arrow.load_csv(csv, path)

        // Pre-load it into datafusion, and also extract the schema
        const _table = arrow["FS"].readFile(path, {})
        dataFusion.load_table(_table, tableId)

        // Publish the title
        dispatch(createMetadata({
          id: tableId,
          workspace: "default",
          metadata: keyStore?.encrypt_metadata(name)
        }))

        // Publish the named columns
        for (let attribute of attributes) {
          dispatch(createMetadata({
            id: attribute.id,
            workspace: "default",
            metadata: keyStore?.encrypt_metadata(attribute.name)
          }))
        }

        // Generate the keys
        generateColumnsWithKeys(attributes, user?.email ?? "").then((columns) => {
          keyStore?.generate_key(16).then((key_id: string) => {
            const schema = {
              id: tableId,
              key_id: key_id,
              column_order: columns.map(c => c.id),
              columns: columns,
              shares: [
                {
                  type: "owner",
                  principal: user?.email
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
            arrow.write_remote_parquet(path, s3_path, tokens.access_key, tokens.secret_key, tokens.session_token, keymap)

            // Save the metadata
            const source = {
              id: tableId,
              workspace: "default",
              type: "csv",
              uri: uri,
              schema: schema,
              is_published: false
            }

            dispatch(createSource(source))
            onComplete(source)

            setIsLoaded(true)
          })
        })
      })
    }
    reader.readAsText(f)
  }

  const generateColumnsWithKeys = useCallback(async (attributes: any, email: string) => {
    let columns = []

    for (let attribute of attributes) {
      const key_id = await keyStore?.generate_key(16)

      columns.push({
        id: attribute.id,
        key_id: key_id,
        shares: [
          {
            type: "owner",
            principal: email
          }
        ]
      })
    }

    return columns
  }, [ keyStore ])

  useEffect(() => {
    dispatch(createDataURI({
      id: tableId,
      workspace: "default"
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

export default CsvSource
