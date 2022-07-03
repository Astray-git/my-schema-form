import { computed, watch } from 'vue'
import type { Ref } from 'vue'
import type { Entity } from './constants'
import type { FieldItem } from './type'

const SERVICE_PROTOCOL_CONDITIONAL_NULL_VALUE = {
  https: [],
  http: ['tls_verify', 'ca_certificates'],
  grpc: ['path', 'tls_verify', 'ca_certificates'],
  grpcs: ['path', 'tls_verify', 'ca_certificates'],
  tcp: ['path', 'tls_verify', 'ca_certificates'],
  udp: ['path', 'tls_verify', 'ca_certificates'],
  tls: ['path', 'tls_verify', 'ca_certificates'],
  tls_passthrough: ['tls_verify', 'ca_certificates'],
}
const ROUTE_PROTOCOL_CONDITIONAL_NULL_VALUE = {
  https: ['destinations', 'sources'],
  http: ['destinations', 'sources'],
  grpc: ['destinations', 'methods', 'sources', 'strip_path'],
  grpcs: ['destinations', 'methods', 'sources', 'strip_path'],
  tcp: ['headers', 'hosts', 'methods', 'paths'],
  udp: ['headers', 'hosts', 'methods', 'paths'],
  tls: ['headers', 'hosts', 'methods', 'paths'],
  tls_passthrough: ['headers', 'hosts', 'methods', 'paths'],
}
const ROUTE_PROTOCOL_ALL_CONDITIONAL = [
  'destinations',
  'sources',
  'headers',
  'hosts',
  'methods',
  'paths',
  'strip_path',
]
function getServiceConditionalFields(allFields: FieldItem[], protocol: string) {
  if (!protocol) return allFields
  const protocolVal =
    protocol as keyof typeof SERVICE_PROTOCOL_CONDITIONAL_NULL_VALUE
  // with all fields
  if (protocolVal === 'https') {
    return allFields
  }
  return allFields.filter(
    (item) =>
      SERVICE_PROTOCOL_CONDITIONAL_NULL_VALUE[protocolVal].includes(
        item.key
      ) === false
  )
}
function handleServiceConditionalFieldChange(form: Record<string, any>) {
  const protocol = form.value
    .protocol as keyof typeof SERVICE_PROTOCOL_CONDITIONAL_NULL_VALUE
  if (!protocol) return
  if (protocol === 'https') {
    // with all fields
    form.value = {
      ...form.value,
      path: '',
      tls_verify: false,
      ca_certificates: [],
    }
  }
  SERVICE_PROTOCOL_CONDITIONAL_NULL_VALUE[protocol].forEach((f) => {
    form.value[f] = null
  })
  if (['http', 'tls_passthrough'].includes(protocol)) {
    form.value.path = form.value.path === null ? '' : form.value.path
  }
}

function getRouteConditionalFields(
  allFields: FieldItem[],
  protocols: Set<string>
) {
  if (!protocols || !protocols.size) return allFields
  const protocol = protocols.values().next()
    .value as keyof typeof ROUTE_PROTOCOL_CONDITIONAL_NULL_VALUE
  return allFields.filter(
    (item) =>
      ROUTE_PROTOCOL_CONDITIONAL_NULL_VALUE[protocol].includes(item.key) ===
      false
  )
}

function handleRouteConditionalFieldChange(form: Record<string, any>) {
  const protocols = form.value.protocols as Set<string>
  if (!protocols) return
  const protocolVal = protocols.values().next()
    .value as keyof typeof ROUTE_PROTOCOL_CONDITIONAL_NULL_VALUE
  const hiddenFields = ROUTE_PROTOCOL_CONDITIONAL_NULL_VALUE[protocolVal]
  hiddenFields.forEach((f) => {
    form.value[f] = null
  })
  const filedsToReset = ROUTE_PROTOCOL_ALL_CONDITIONAL.filter((f) => {
    return hiddenFields.includes(f) === false
  })
  filedsToReset.forEach((f) => {
    let val
    switch (f) {
      case 'destinations':
      case 'sources':
      case 'methods':
        val = new Set()
        break
      case 'hosts':
      case 'paths':
        val = []
        break
      case 'headers':
        val = {}
        break
      case 'strip_path':
        val = true
        break
      default:
        val = ''
        break
    }
    form.value[f] = val
  })
}

function getConditionalFields(
  entities: string,
  allFields: FieldItem[],
  protocol: string,
  protocols: Set<string>
) {
  if (entities === 'service') {
    return getServiceConditionalFields(allFields, protocol)
  }
  if (entities === 'route') {
    return getRouteConditionalFields(allFields, protocols)
  }
  return allFields
}

function handleConditionalFieldsChange(
  entities: string,
  form: Record<string, any>
) {
  if (entities === 'service') {
    return handleServiceConditionalFieldChange(form)
  }
  if (entities === 'route') {
    return handleRouteConditionalFieldChange(form)
  }
}

export function useConditionalFields(
  props: { entity: Entity },
  allSchemaFileds: Ref<FieldItem[]>,
  sForm: Ref<Record<string, any>>
) {
  const schemaFields = computed(() => {
    return getConditionalFields(
      props.entity,
      allSchemaFileds.value,
      sForm.value.protocol ?? '',
      sForm.value.protocols ?? []
    )
  })
  function handleFormChange() {
    watch(
      [
        () => props.entity,
        () => sForm.value.protocol,
        () => sForm.value.protocols,
      ],
      ([newEntity, newProtocol, newProtocols]) => {
        if (newProtocol || newProtocols) {
          handleConditionalFieldsChange(newEntity, sForm)
        }
      },
      {
        immediate: true,
      }
    )
  }

  return {
    schemaFields,
    handleFormChange,
  }
}
