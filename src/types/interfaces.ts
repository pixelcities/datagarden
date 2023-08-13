import { DataType } from './enums'

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
  },
  connectionState: string,
  isLoading: boolean
}

export interface Component {
  id: string,
  workspace: string,
  type: string,
  targets: string[],
  position: number[],
  color?: string,
  date?: string,
  is_ready: boolean
}

export interface Attribute {
  Header: string,
  accessor: string
}

export interface Row {
  [key: string]: string
}

export interface Identifier {
  id: string,
  type: "table" | "column",
  action?: "add" | "drop" | "alter",
  params?: any[]
}

export interface WAL {
  identifiers: {[key: number]: Identifier},
  values: {[key: number]: string},
  transactions: string[],
  artifacts: string[],
  data?: string
}

export interface Collection extends Component {
  uri: [string, string],
  schema: Schema,
  mergedColors?: string[]
}

export interface Transformer extends Component {
  collections: string[],
  transformers: string[],
  wal?: WAL,
  error?: string,
  nr_parties?: number,
  signatures?: string[]
}

export interface WidgetSettings {
  [key: string]: string
}

export interface Widget extends Component {
  collection?: string,
  settings: WidgetSettings,
  access?: Share[],
  content?: string,
  height?: number,
  is_published: boolean
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
  concept_id: string,
  key_id: string,
  lineage: string | null,
  shares: Share[],
  metadata?: any
}

export interface Schema {
  id: string,
  key_id: string,
  tag: string,
  column_order: string[],
  columns: Column[],
  shares: Share[],
  metadata?: any
}

export type UnverifiedSchema = Omit<Schema, "tag">

export interface Source {
  id: string,
  workspace: string,
  type: string,
  owner?: string,
  uri?: [string, string],
  date?: string,
  sizeHint?: string,
  accessHint?: string,
  schema: Schema,
  is_published: boolean
}

export interface User {
  id: string,
  email: string,
  role: string,
  name: string,
  picture: string,
  last_active_at: string,
  confirmed_at?: Date,
  relation?: string
}

export interface UserInvite {
  email: string,
  role: string,
  date: string,
  id?: string
}

export interface Metadata {
  id: string,
  workspace: string,
  metadata: string
}

// ConceptAnnotations
export interface ConceptA {
  id: string,
  workspace: string,
  name: string, // rdfs:label | dc:title | skos:prefLabel
  dataType?: DataType, // rdfs:range
  aggregateFn?: string,
  broader?: string[], // skos:broader
  narrower?: string[], // skos::narrower
  related?: string[], // skos:related
  description?: string, // dc:description
  subject?: string, // dc:subject
  creator?: string, // dc:creator
  constraints?: Rule[]
}

export interface Concept {
  id: string,
  workspace: string,
  concept: string
}

export interface DataURI {
  id: string,
  workspace?: string,
  type?: string,
  uri?: string,
  tag?: string
}

export interface Secret {
  key_id: string,
  owner: string,
  receiver: string,
  ciphertext: string,
  message_id?: string
}

export interface Task {
  id: string,
  type: string,
  task: any,
  worker?: string,
  fragments: string[],
  metadata: {[key: string]: any},
  ttl: number,
  expires_at?: number,
  is_completed?: boolean,
  date?: string
}

export interface DataSpace {
  id: string,
  handle: string,
  key_id: string,
  name?: string
}

export interface Page {
  id: string,
  workspace: string,
  access: Share[],
  key_id?: string,
  content_order?: string[],
  date?: string
}

export interface Content {
  id: string,
  page_id: string,
  workspace: string,
  type: string,
  access: Share[],
  content?: string,
  draft?: string,
  widget_id?: string,
  height?: number,
  date?: string
}

export interface NotificationMsg {
  id: string,
  type: "info" | "error",
  message: string,
  receiver?: string,
  is_urgent?: boolean,
  is_read?: boolean,
  is_local?: boolean
}

export interface Subscription {
  subscription_id: string,
  plan_name: string,
  status: string,
  cancel_url: string,
  update_url: string,
  valid_to?: Date
}

export interface MPC {
  id: string,
  nr_parties?: number,
  partitions?: string[],
  values?: string[]
}


export type NumericOperator =
  "IS NOT NULL" |
  ">" |
  ">=" |
  "<" |
  "<="

export interface Rule {
  name: string,
  condition: string,
  operator: NumericOperator,
  values: string[],
}

