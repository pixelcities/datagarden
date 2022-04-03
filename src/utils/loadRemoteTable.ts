import { Schema, User, Share } from 'types'
import { getDataTokens } from 'utils/getDataTokens'

export const loadRemoteTable = (tableId: string, uri: string, schema: Schema, user: User | undefined, arrow: any, dataFusion: any, keyStore: any, onComplete: () => void) => {
  const path = `/${tableId}`

  // Get fresh session tokens
  getDataTokens(uri).then(tokens => {
    const s3_path = uri.split("s3://")[1]

    // Get and prepare the secret keys
    let keymap = [
      "__FOOTER", schema.key_id, keyStore?.get_key(schema.key_id)
    ]

    for (let column of schema.columns) {
      if (!!column.shares.find((share: Share) => share.principal === user?.email && (share.type === "owner" || share.type === "full") )) {
        keymap.push(column.id)
        keymap.push(column.key_id)
        keymap.push(keyStore?.get_key(column.key_id))
      }
    }

    // Load the remote table
    arrow.read_remote_parquet(s3_path, path, tokens.access_key, tokens.secret_key, tokens.session_token, keymap)

    // The arrow call is non-blocking, and still runs in the background. We have to wait
    // for the resulting dataset to be downloaded, but it does not return a promise. Simple
    // solution is to ping the "filesystem".
    //
    // TODO: Actually return a promise somehow
    const interval = setInterval(() => {
      const fs = arrow["FS"].analyzePath(path, false)

      if (fs.exists) {
        clearInterval(interval)

        // Move to datafusion
        dataFusion.load_table(arrow["FS"].readFile(path, {}), tableId)

        onComplete()
      }
    }, 100)
  })
}

