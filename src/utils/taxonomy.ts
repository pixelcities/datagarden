import { keyStoreRef } from 'contexts/keystore/KeyStoreContext'
import { Concept, ConceptA } from 'types'


interface TaxonomyI {
  get(id: string): ConceptA | undefined,
  list(): ConceptA[],
  serialize(c: ConceptA | undefined): Concept | undefined,
  deserialize(c: Concept | undefined): ConceptA | undefined
}

export class Taxonomy implements TaxonomyI {
  keyId: string
  concepts: {[key: string]: ConceptA} = {}

  constructor(keyId: string, concepts: Concept[] | undefined = undefined) {
    this.keyId = keyId

    if (concepts) {
      this.init(concepts)
      this.link()
    }
  }

  init(concepts: Concept[]) {
    this.concepts = concepts
      .map(c => this.deserialize(c))
      .filter((c): c is ConceptA => c !== undefined)
      .reduce((acc, data) => ({...acc, [data.id]: data}), {})
  }

  get(id: string) {
    return this.concepts[id]
  }

  list() {
    return Object.values(this.concepts)
  }

  root() {
    return this.list().filter(c => c.narrower !== undefined && c.narrower.length > 0 && (c.broader === undefined || c.broader.length === 0))
  }

  isolated() {
    return this.list().filter(c => (c.narrower === undefined || c.narrower.length === 0) && (c.broader === undefined || c.broader.length === 0))
  }

  link() {
    for (const c of Object.values(this.concepts)) {
      if (c.broader !== undefined && c.broader.length > 0) {
        for (const parent of c.broader) {
          if (this.concepts[parent]) {
            if (this.concepts[parent].narrower === undefined) {
              this.concepts[parent].narrower = [c.id]
            } else if (this.concepts[parent].narrower!.indexOf(c.id) === -1) {
              this.concepts[parent].narrower!.push(c.id)
            }
          }
        }
      }
    }
  }

  serialize(c: ConceptA | undefined) {
    if (c && keyStoreRef) {
      const concept = keyStoreRef.encrypt_metadata(this.keyId, JSON.stringify(c))

      return {
        id: c.id,
        workspace: c.workspace,
        concept: concept
      }
    }
  }

  deserialize(c: Concept | undefined) {
    if (c && keyStoreRef) {
      const concept = JSON.parse(keyStoreRef.decrypt_metadata(this.keyId, c.concept))

      return concept as ConceptA
    }
  }
}

export const emptyTaxonomy = (dsKeyId: string) => new Taxonomy(dsKeyId)
export const loadTaxonomy = (dsKeyId: string, concepts: Concept[]) => new Taxonomy(dsKeyId, concepts)
