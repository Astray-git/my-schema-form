import { fetchEntitySchema, fetchPluginSchema } from '@/apis/schema'
import { logger } from '@/utils'
import type { Entity, Plugin } from './constants'
import type { Schema } from './type'

const schemaStore = new Map<string, Schema>()
const pluginSchemaStore = new Map<string, Schema>()

export function useSchemaStore() {
  async function getEntitySchema(entityName: Entity) {
    if (schemaStore.has(entityName)) {
      return schemaStore.get(entityName) as Schema
    }
    try {
      const schemaData = await fetchEntitySchema(entityName)
      schemaData && schemaStore.set(entityName, schemaData)
      return schemaData
    } catch (error) {
      logger.error(error)
    }
    return null
  }
  async function getPluginSchema(plugin: Plugin) {
    if (pluginSchemaStore.has(plugin)) {
      return pluginSchemaStore.get(plugin) as Schema
    }
    try {
      const schemaData = await fetchPluginSchema(plugin)
      schemaData && pluginSchemaStore.set(plugin, schemaData)
      return schemaData
    } catch (error) {
      logger.error(error)
    }
    return null
  }
  return { getEntitySchema, getPluginSchema }
}
