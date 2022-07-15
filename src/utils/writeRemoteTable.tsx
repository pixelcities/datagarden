import { Schema, User, Share } from 'types'
import { getDataTokens } from 'utils/getDataTokens'

export const writeRemoteTable = (tableId: string, uri: string, schema: Schema, user: User | undefined, arrow: any, dataFusion: any, keyStore: any) => {
  return new Promise<void>((resolve, reject) => {
    const fragmentId = crypto.randomUUID()
    const path = `/${fragmentId}`

    // Get fresh session tokens
    getDataTokens(uri + `/${fragmentId}.parquet`, "write").then(tokens => {
      const s3_path = uri.split("s3://")[1] + `/${fragmentId}.parquet`

      // Get and prepare the secret keys
      let keymap = [
        "__FOOTER", schema.key_id, keyStore?.get_key(schema.key_id)
      ]

      for (let column of schema.columns) {
        if (!column.shares.find((share: Share) => share.principal === user?.email && (share.type === "owner" || share.type === "full") )) {
          console.log("Writing a table (fragment) requires full access to all columns.")

          return
        }

        keymap.push(column.id)
        keymap.push(column.key_id)
        keymap.push(keyStore?.get_key(column.key_id))
      }

      // Export from datafusion
      const table = dataFusion.export_table(tableId)
      arrow["FS"].writeFile(path, table)

      // Write the table to s3
      arrow.write_remote_parquet(path, s3_path, tokens.access_key, tokens.secret_key, tokens.session_token, keymap).then(() => {
        resolve()
      })
    })
  })
}

