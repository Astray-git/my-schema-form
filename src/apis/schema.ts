import { http } from '@/utils'
import type { Entity, Plugin } from '@/views/schema/constants'
import type { Schema } from '@/views/schema/type'

export function fetchEntitySchema(entityName: Entity) {
  return http.get<Schema>(`/schemas/${entityName}s`)
}

export async function validateSchema(
  entityName: Entity | 'plugin',
  formData: any
) {
  return http.post<{ message: string }>(
    `/schemas/${entityName}s/validate`,
    formData
  )
}

export function fetchPluginSchema(plugin: Plugin) {
  return http.get<Schema>(`/schemas/plugins/${plugin}`)
}
