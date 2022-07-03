<script lang="ts" setup>
import { getCurrentInstance, ref, watch } from 'vue'
import { KAlert, KButton } from '@kong/kongponents'
import { FormItem } from '@/components'
import { validateSchema } from '@/apis/schema'
import { labelFromKey } from '@/utils'
import { useSchemaStore } from '../useSchemaStore'
import type { Plugin } from '../constants'
import type { FieldItem, Schema, SchemaFieldDesc } from '../type'
import SchemaFormControl from './SchemaFormControl.vue'
import { validators } from '../validators'

type Primitives = string | number | boolean
type ValueTypes =
  | null
  | string
  | number
  | boolean
  | Record<string, Primitives>
  | []
  | Primitives[]
  | Set<Record<string, Primitives>>

const props = defineProps<{
  plugin: Plugin
}>()
const emit = defineEmits(['form-dirty'])
const { getPluginSchema } = useSchemaStore()

const $toaster =
  getCurrentInstance()?.appContext.config.globalProperties.$toaster
// data
const sForm = ref<Record<string, any>>({})
const schemaFields = ref<FieldItem[]>([])
const uniqueKeys = ref<string[]>([])

async function init() {
  if (props.plugin) {
    uniqueKeys.value = []
    const schemaData = await getPluginSchema(props.plugin)
    schemaFields.value = (schemaData?.fields ?? [])
      .map(parseField)
      .filter((item) => !item.rawDesc.auto && item.type !== 'foreign')

    sForm.value = genForm(schemaFields.value)
    // watch once
    const unwatch = watch(
      sForm,
      () => {
        emit('form-dirty')
        unwatch()
      },
      {
        deep: true,
      }
    )
  }
}
init()
watch(() => props.plugin, init)

/**
 * generate initial form data
 * @param schemaFields
 */
function genForm(schemaFields: FieldItem[]) {
  const schemaForm = schemaFields.reduce<Record<string, ValueTypes>>(
    (form, item) => {
      let val: ValueTypes = null
      switch (item.type) {
        case 'boolean':
          val = false
          break
        case 'map':
          val = {}
          break
        case 'array':
          val = []
          break
        case 'set':
          val = new Set()
          break
        case 'record':
          val =
            item.recordList?.reduce<Record<string, Primitives>>(
              (obj, recordItem) => {
                let itemVal: Primitives = ''
                if (recordItem.type === 'boolean') {
                  itemVal = false
                }
                obj[recordItem.key] = itemVal
                return obj
              },
              {}
            ) ?? {}
          break
        default:
          val = ''
          break
      }
      if (item.rawDesc.default !== undefined) {
        if (item.type === 'set') {
          const defVal = item.rawDesc.default
          // set with default value only involves string type element, treat as { _val: value }
          if (Array.isArray(defVal)) {
            defVal.forEach((v) => {
              ;(val as Set<any>).add(v)
            })
          } else {
            ;(val as Set<any>).add(defVal)
          }
        } else {
          val = item.rawDesc.default
        }
      }
      form[item.key] = val
      return form
    },
    {}
  )
  return {
    name: props.plugin,
    ...schemaForm,
  }
}

/**
 * parse fields in schema
 * @param item one field item
 */
function parseField(item: Schema['fields']['0']): FieldItem {
  const key = Object.keys(item)[0] // assume { [key]: {...} }
  const label = labelFromKey(key)
  const desc = item[key]
  if (desc.unique) {
    uniqueKeys.value.push(key)
  }
  return parseFieldDesc(desc, key, label)
}

/**
 * parse field in desc
 * @param item one field item
 */
function parseFieldDesc(
  desc: SchemaFieldDesc,
  key = '_val',
  label = ''
): FieldItem {
  const itemType = desc.type
  // determine form control component
  let controlType = 'input'
  if (itemType === 'boolean') {
    controlType = 'checkbox'
  } else if (itemType === 'map') {
    controlType = 'map'
  } else if (desc.one_of) {
    controlType = 'radio'
  }
  // store v-bind attrs on form control
  let extraBindings = {}
  if (desc.between) {
    const [min, max] = desc.between
    extraBindings = {
      ...extraBindings,
      min,
      max,
    }
  }
  if (desc.starts_with) {
    extraBindings = {
      ...extraBindings,
      placeholder: `Starts with ${desc.starts_with}`,
    }
  }
  // record
  let recordList = null
  if (itemType === 'record' && desc.fields) {
    recordList = desc.fields.map(parseField)
  }

  return {
    key,
    label,
    type: itemType,
    controlType,
    listItems: null,
    recordList,
    extraBindings,
    rawDesc: desc,
  }
}

/**
 * verify form data
 */
async function validateForm() {
  verifyFields(schemaFields.value, sForm.value)
  if (Object.keys(validateResult.value).length > 0) {
    return
  }
  const form = Object.entries(sForm.value).reduce<Record<string, any>>(
    (res, [key, val]) => {
      let value = val
      if (val instanceof Set) {
        value = Array.from(val).map((item) => {
          if (item._val) {
            return item._val
          }
          return item
        })
      }
      res[key] = value
      return res
    },
    {}
  )
  try {
    const res = await validateSchema('plugin', form)
    $toaster.open({
      appearance: 'success',
      message: res.message,
    })
  } catch (error: any) {
    $toaster.open({
      appearance: 'danger',
      message: error.message,
    })
  }
}

// validation result for form control
const validateResult = ref<Record<string, any>>({})
/**
 * verify all fields of form
 * @param fields
 * @param form
 */
function verifyFields(fields: FieldItem[], form: Record<string, any>) {
  validateResult.value = {}
  fields.forEach((item) => {
    const itemKey = item.key
    const formValue = form[itemKey]
    // handle list value
    if (item.listItems) {
      const itemFields = item.listItems
      formValue.forEach((elem: Record<string, any>) => {
        verifyFields(itemFields, elem)
      })
      return
    }

    Object.entries(item.rawDesc).forEach(([key, val]) => {
      if (key === 'required') {
        if (formValue == null || formValue.length === 0) {
          validateResult.value[itemKey] = {
            ...validateResult.value[itemKey],
            required: true,
          }
        }
        return
      }
      if (key in validators) {
        const fn = validators[key as keyof typeof validators](val)
        const res = fn(formValue)
        if (res !== true) {
          validateResult.value[itemKey] = {
            ...validateResult.value[itemKey],
            err: res,
          }
        }
      }
    })
  })
}
</script>

<template>
  <KAlert v-if="uniqueKeys.length">
    <template v-slot:alertMessage>
      A unique
      <template v-for="(key, index) in uniqueKeys" :key="key">
        <code>{{ key }}</code>
        <span v-if="index !== uniqueKeys.length - 1"> or </span>
      </template>
      is required.
    </template>
  </KAlert>
  <form @submit.prevent>
    <FormItem label="Plugin Name" inline>
      {{ plugin }}
    </FormItem>
    <FormItem
      v-for="(item, index) in schemaFields"
      :key="index"
      :label="item.controlType !== 'checkbox' ? item.label : ''"
      :required="item.rawDesc.required"
    >
      <SchemaFormControl
        v-if="['set', 'record'].includes(item.type) === false"
        class="max-w-md"
        :fieldItem="item"
        :validateResult="validateResult"
        v-model="sForm[item.key]"
      />

      <ul
        v-else-if="item.type === 'set' && item.rawDesc?.elements?.one_of"
        class="flex"
      >
        <li
          class="mr-2"
          v-for="option in item.rawDesc?.elements?.one_of"
          :key="option"
        >
          <!-- use native input for array binding -->
          <label class="k-checkbox">
            <input
              type="checkbox"
              class="k-input"
              :value="option"
              v-model="sForm[item.key]"
            />
            <code>{{ option }}</code>
          </label>
        </li>
      </ul>
      <div v-if="item.recordList" class="pl-2 border-l">
        <FormItem
          v-for="(recordItem, rIndex) in item.recordList"
          :key="rIndex"
          :label="recordItem.label"
          :required="recordItem.rawDesc.required"
        >
          <SchemaFormControl
            class="max-w-md"
            :fieldItem="recordItem"
            :validateResult="validateResult"
            v-model="sForm[item.key][recordItem.key]"
          />
        </FormItem>
      </div>
    </FormItem>

    <div>
      <KButton appearance="primary" :isRounded="false" @click="validateForm"
        >Validate Form</KButton
      >
    </div>
  </form>
</template>

<style module></style>
