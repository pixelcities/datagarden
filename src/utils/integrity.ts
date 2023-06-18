import objectHash from 'object-hash'

import { UnverifiedSchema, Schema } from 'types'
import { toHex, fromHex } from './helpers'


const getKey = (secret: string): Promise<CryptoKey> => {
  return crypto.subtle.importKey(
    "raw",
    fromHex(secret),
    {
      "name": "HMAC",
      "hash": "SHA-256"
    },
    false,
    ["sign", "verify"]
  )
}

const sign = (message: Buffer, secret: string) => {
  return new Promise<string>((resolve, reject) => {
    getKey(secret).then(key => {
      crypto.subtle.sign("HMAC", key, message).then(tag => {
        resolve(toHex(new Uint8Array(tag)))
      })
    })
  })
}

const verify = (message: Buffer, tag: string, secret: string) => {
  return new Promise<boolean>((resolve, reject) => {
    getKey(secret).then(key => {
      crypto.subtle.verify("HMAC", key, fromHex(tag), message).then(result => {
        resolve(result)
      })
    })
  })
}

const hashSchema = (schema: UnverifiedSchema | Schema): Buffer => {
  return objectHash(schema, {encoding: "buffer", excludeKeys: (k: string) => k === "tag" || k === "lineage", unorderedArrays: true})
}

/*
 * Use the schema key to sign the JSON schema
 *
 * The schema is passed around as JSON for easy utility, and to allow
 * the backend to understand the context. However, because the schema
 * also holds information about the shares its integrity should be
 * verified when actions such as resharing operate on this information.
 *
 * If not verified, a malicious server could alter the shares and gain
 * access to the column keys when a transformer creates a new collection.
 */
export const signSchema = (schema: UnverifiedSchema | Schema, secret: string): Promise<Schema> => {
  return sign(hashSchema(schema), secret).then(tag => {
    return {...schema, ...{tag: tag}}
  })
}

/*
 * Verify a schema
 *
 * Uses the tag within the schema to verify it with the shared secret. The
 * tag is removed before hashing the schema.
 *
 * Should be used before making decisions on shares or before signing an
 * updated schema.
 */
export const verifySchema = (schema: Schema, secret: string): Promise<boolean> => {
  const tag = schema.tag

  return verify(hashSchema(schema), tag, secret)
}

