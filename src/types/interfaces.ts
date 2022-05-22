// interfaces.ts

export interface Coords {
  x: number,
  y: number
}

export interface WindowDimensions {
  height: number,
  width: number
}

export interface ComponentDimensions  {
  id: string,
  height: number,
  width: number
}

export interface UserInterface {
  offset: Coords,
  coords: Coords,
  dimensions: WindowDimensions,
  components: {
    [key: string]: ComponentDimensions
  }
}

export interface Component {
  id: string,
  workspace: string,
  type: string,
  targets: string[],
  position: number[],
  color?: string,
  is_ready: boolean
}

export interface Attribute {
  Header: string,
  accessor: string
}

export interface Row {
  [key: string]: string
}

export interface WAL {
  identifiers: {[key: number]: string},
  values: {[key: number]: string},
  transactions: string[],
  artifacts: string[]
}

export interface Collection extends Component {
  uri: string,
  schema: Schema,
  mergedColors?: string[]
}

export interface Transformer extends Component {
  collections: string[],
  transformers: string[],
  wal?: WAL
}

export interface Workspace extends Component {
  workspaceTarget: string
}

export interface Organisation {
  id: string,
  name: string,
  color: string
}

export interface Share {
  type: string,
  principal?: string
}

export interface Column {
  id: string,
  key_id: string,
  shares: Share[],
  metadata?: any
}

export interface Schema {
  id: string,
  key_id: string,
  column_order: string[],
  columns: Column[],
  shares: Share[],
  metadata?: any
}

export interface Source {
  id: string,
  workspace: string,
  type: string,
  owner?: string,
  uri?: string,
  updatedAt?: string,
  sizeHint?: string,
  accessHint?: string,
  schema: Schema,
  is_published: boolean
}

export interface User {
  id: string,
  email: string,
  name: string,
  picture: string,
  relation?: string
}

export interface Metadata {
  id: string,
  workspace: string,
  metadata: string
}

export interface DataURI {
  id: string,
  workspace?: string,
  uri?: string
}

export interface Secret {
  key_id: string,
  owner: string,
  receiver: string,
  ciphertext: string
}

export interface Task {
  id: string,
  type: string,
  task: string,
  worker?: string,
  is_complete?: boolean
}

