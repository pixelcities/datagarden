import { Schema, User, Share } from 'types'
import { getDataTokens } from 'utils/getDataTokens'

export const writeRemoteTable = (tableId: string, uri: string, schema: Schema, user: User | undefined, arrow: any, dataFusion: any, keyStore: any) => {
  return new Promise<void>((resolve, reject) => {
    const fragmentId = crypto.randomUUID()
    const path = `/${fragmentId}`

    // Get fresh session tokens
    getDataTokens(uri + `/${fragmentId}.parquet`, "write").then(tokens => {
      const s3_path = uri.split("s3://")[1] + `/${fragmentId}.parquet`
      const arrow_schema = dataFusion?.get_schema(tableId)

      // Get and prepare the secret keys
      let keymap = [
        "__FOOTER", schema.key_id, keyStore?.get_key(schema.key_id)
      ]

      for (let column of schema.columns) {
        if (!column.shares.find((share: Share) => share.principal === user?.email && (share.type === "owner" || share.type === "full") )) {
          console.log("Writing a table (fragment) requires full access to all columns.")

          return
        }

        // The parquet encryption encrypts _parquet_ columns. This is not actually the same as an arrow
        // schema field, and the naming convention is different as well. Nested fields are seperate nodes,
        // with list types being stored in a 3 tier structure.
        //
        // When we have nested data, adjust the column "id" to a proper column path.
        //
        // TODO: Dynamically create column dot string path, to support N-nested fields.
        const field = arrow_schema.fields.find((field: any) => field.name === column.id)
        if (field?.children.length > 0) {
          keymap.push(column.id + ".list.item")
        } else {
          keymap.push(column.id)
        }

        keymap.push(column.key_id)
        keymap.push(keyStore?.get_key(column.key_id))
      }

      // Export from datafusion
      const table = dataFusion.export_table(tableId)
      arrow["FS"].writeFile(path, table)

      // Write the table to s3
      arrow.write_remote_parquet(path, s3_path, tokens.access_key, tokens.secret_key, tokens.session_token, keymap).then(() => {
        resolve()
      }).catch((e: any) => {
        console.error(arrow.print_exception(e))
        reject()
      })
    })
  })
}

