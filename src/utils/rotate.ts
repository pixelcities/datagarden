import { Mutex } from 'async-mutex'

import store from 'state/store'

import { publishWidget, updateTransformer, updateMetadata, updateConcept, shareSecret } from 'state/actions'
import { getCSRFToken } from 'utils/getCSRFToken'
import { emptyTaxonomy, loadTaxonomy } from 'utils/taxonomy'
import { signObject, verifyObject } from 'utils/integrity'

import { DataSpace, User, Concept, Widget, Metadata, Transformer } from 'types'


export const rotateKeys = async (dataSpace: DataSpace, user: User, keyStore: any, protocol: any, dispatch: any, mutex: Mutex) => {
  mutex.runExclusive(async () => {
    if (user && keyStore && protocol && dataSpace && dispatch) {
      // Clone all the state, so that it's not updated while we are rotating
      const _dataSpace: DataSpace = JSON.parse(JSON.stringify(dataSpace))
      const _concepts: Concept[] = JSON.parse(JSON.stringify(Object.values(store.getState().concepts.entities)))
      const _metadata: Metadata[] = JSON.parse(JSON.stringify(Object.values(store.getState().metadata.entities)))
      const _widgets: Widget[] = JSON.parse(JSON.stringify(Object.values(store.getState().widgets.entities)))
      const _transformers: Transformer[] = JSON.parse(JSON.stringify(Object.values(store.getState().transformers.entities)))


      const resp = await fetch(process.env.REACT_APP_API_BASE_PATH + `/spaces/${_dataSpace.handle}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }
      })
      const { manifest } = await resp.json()

      const manifestIsOk = await verifyObject(manifest, keyStore?.get_key(dataSpace.key_id))

      if (!manifestIsOk) {
        throw new Error("Invalid manifest signature")
      }

      // First update the key, so that other clients cannot use this ds until everything is ready
      const key_id = await keyStore.generate_key(32)
      await fetch(process.env.REACT_APP_API_BASE_PATH + `/spaces/${_dataSpace.handle}/rotate`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCSRFToken()
        },
        body: JSON.stringify({
          "key_id": key_id
        })
      })

      // Clear local cache
      localStorage.removeItem(_dataSpace.handle)
      sessionStorage.removeItem("spaces")

      // Rotate all metadata
      for (const meta of _metadata) {
        dispatch(updateMetadata({...meta, ...{
          metadata: keyStore.encrypt_metadata(key_id, keyStore.decrypt_metadata(_dataSpace.key_id, meta.metadata))
        }}))
      }

      // Rotate concepts
      const taxonomy = loadTaxonomy(_dataSpace.key_id, _concepts)
      const newTaxonomy = emptyTaxonomy(key_id)

      for (const concept of taxonomy.list()) {
        const action = newTaxonomy.serialize(concept)
        if (action) {
          dispatch(updateConcept(action))
        }
      }

      // Rotate internal widgets
      for (const widget of _widgets) {
        if (widget.access && widget.access.filter(access => access.type === "internal").length > 0) {
          dispatch(publishWidget({...widget, ...{
            access: widget.access,
            content: keyStore.encrypt_metadata(key_id, keyStore.decrypt_metadata(_dataSpace.key_id, widget.content))
          }}))
        }
      }

      // Rotate data in transformers
      for (const transformer of _transformers) {
        if (transformer.type === "mpc" || transformer.type === "privatise") {
          if (transformer.wal && transformer.wal.data) {
            dispatch(updateTransformer({...transformer, ...{
              wal: {...transformer.wal, ...{
                data: keyStore.encrypt_metadata(key_id, keyStore.decrypt_metadata(_dataSpace.key_id, transformer.wal.data))
              }}
            }}))
          }
        }
      }

      // When everything is rotated, share the key with the rest
      for (const userId of manifest.users) {
        if (userId !== user.id) {
          const ciphertext = await protocol?.encrypt(userId, keyStore.get_key(key_id))
          dispatch(shareSecret({
            key_id: key_id,
            owner: user.id,
            receiver: userId,
            ciphertext: ciphertext
          }))
        }
      }

      await protocol.sync()

      // Finally, update the manifest
      const signedManifest = await signObject(manifest, keyStore?.get_key(key_id))
      await fetch(process.env.REACT_APP_API_BASE_PATH + `/spaces/${_dataSpace.handle}/manifest`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCSRFToken()
        },
        body: JSON.stringify({
          "manifest": signedManifest
        })
      })

      window.location.href = "/logout"
    }
  })
}

