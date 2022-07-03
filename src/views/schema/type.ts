// TODO: detailed schema typing
export type SchemaFieldDesc = {
  type:
    | 'string'
    | 'integer'
    | 'boolean'
    | 'map'
    | 'set'
    | 'array'
    | 'record'
    | 'foreign'
  required?: boolean
  elements?: SchemaFieldDesc & {
    fields?: {
      [key: string]: SchemaFieldDesc
    }[]
  }
  fields?: {
    [key: string]: SchemaFieldDesc
  }[]
} & Record<string, any>

export type Schema = {
  fields: {
    [key: string]: SchemaFieldDesc
  }[]
}

export type FieldItem = {
  key: string
  label: string
  type: SchemaFieldDesc['type']
  controlType: string
  listItems: FieldItem[] | null
  recordList: FieldItem[] | null
  extraBindings: Record<string, string | number | boolean>
  rawDesc: SchemaFieldDesc
}
