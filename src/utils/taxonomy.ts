import { keyStoreRef } from 'contexts/keystore/KeyStoreContext'
import { Concept, ConceptA } from 'types'


interface TaxonomyI {
  get(id: string): ConceptA | undefined,
  list(): ConceptA[],
  serialize(c: ConceptA): Concept | undefined,
  deserialize(c: Concept): ConceptA | undefined
}

class Taxonomy implements TaxonomyI {
  keyId: string
  concepts: {[key: string]: ConceptA} = {}

  constructor(keyId: string, concepts: Concept[] | undefined = undefined) {
    this.keyId = keyId

    if (concepts) {
      this.init(concepts)
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

  serialize(c: ConceptA) {
    if (keyStoreRef) {
      const concept = keyStoreRef.encrypt_metadata(this.keyId, JSON.stringify(c))

      return {
        id: c.id,
        workspace: c.workspace,
        concept: concept
      }
    }
  }

  deserialize(c: Concept) {
    if (keyStoreRef) {
      const concept = JSON.parse(keyStoreRef.decrypt_metadata(this.keyId, c.concept))

      return concept as ConceptA
    }
  }
}

export const emptyTaxonomy = (dsKeyId: string) => new Taxonomy(dsKeyId)
export const loadTaxonomy = (dsKeyId: string, concepts: Concept[]) => new Taxonomy(dsKeyId, concepts)
