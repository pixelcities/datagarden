import { Mutex } from 'async-mutex'
import { Schema, User, Share } from 'types'
import { getDataTokens } from 'utils/getDataTokens'

const mutex = new Mutex()

export const loadRemoteTable = (tableId: string, uri: [string, string], schema: Schema, user: User | undefined, arrow: any, dataFusion: any, keyStore: any, fragments?: string[]) => {
  return new Promise<void>((resolve, reject) => {
    mutex
      .acquire()
      .then((release) => {
        const path = `/${tableId}`

        if (arrow["FS"].analyzePath(path, false).exists) {
          arrow["FS"].unlink(path)
        }

        // Get fresh session tokens
        getDataTokens(uri[0], uri[1], "read").then(tokens => {
          const s3_path = uri[0].split("s3://")[1]

          // Get and prepare the secret keys
          let keymap = [
            "__FOOTER", schema.key_id, keyStore?.get_key(schema.key_id)
          ]

          for (let column of schema.columns) {
            if (!!fragments) {
              if (fragments.indexOf(column.id) === -1) {
                continue
              }
            }

            if (!!column.shares.find((share: Share) => share.principal === user?.id && (share.type === "owner" || share.type === "full") )) {
              keymap.push(column.id)
              keymap.push(column.key_id)
              keymap.push(keyStore?.get_key(column.key_id))
            }
          }

          // Load the remote table
          arrow.read_remote_parquet(s3_path, path, tokens.access_key, tokens.secret_key, tokens.session_token, keymap).then(() => {

            // Move to datafusion
            try {
              dataFusion.load_table(arrow["FS"].readFile(path, {}), tableId)
            } catch (e) { // Error loading table
              console.error(e)

              reject()
              release()
              return
            }

            resolve()
            release()
          })
        })
      })

  })
}

