<script lang="ts" setup>
import { getCurrentInstance, ref, watch } from 'vue'
import { KAlert, KButton } from '@kong/kongponents'
import { FormItem } from '@/components'
import { validateSchema } from '@/apis/schema'
import { labelFromKey } from '@/utils'
import { useSchemaStore } from '../useSchemaStore'
import type { Entity } from '../constants'
import type { FieldItem, Schema, SchemaFieldDesc } from '../type'
import { validators } from '../validators'
import { useConditionalFields } from '../useConditionalFields'
import SchemaFormControl from './SchemaFormControl.vue'
import SchemaFormMap from './SchemaFormMap.vue'
import SchemaFormSet from './SchemaFormSet.vue'
import SchemaFormRecord from './SchemaFormRecord.vue'
import SchemaFormMES from './SchemaFormMES.vue'

type Primitives = string | number | boolean
type ValueTypes =
  | null
  | string
  | number
  | boolean
  | Record<string, string>
  | []
  | Primitives[]
  | Set<Record<string, Primitives>>

const props = defineProps<{
  entity: Entity
}>()
const emit = defineEmits(['form-dirty'])
const { getEntitySchema } = useSchemaStore()

const $toaster =
  getCurrentInstance()?.appContext.config.globalProperties.$toaster
// data
const sForm = ref<Record<string, any>>({})
const parsedSchemaFields = ref<FieldItem[]>([])
const uniqueKeys = ref<string[]>([])

const { schemaFields, handleFormChange } = useConditionalFields(
  props,
  parsedSchemaFields,
  sForm
)

async function init() {
  if (props.entity) {
    uniqueKeys.value = []
    const schemaData = await getEntitySchema(props.entity)
    parsedSchemaFields.value = (schemaData?.fields ?? [])
      .map(parseField)
      .filter((item) => !item.rawDesc.auto && item.type !== 'foreign')

    sForm.value = genForm(parsedSchemaFields.value)
    handleFormChange()
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
watch(() => props.entity, init)

/**
 * generate initial form data
 * @param schemaFields
 */
function genForm(schemaFields: FieldItem[]) {
  return schemaFields.reduce<Record<string, ValueTypes>>((form, item) => {
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
      default:
        val = ''
        break
    }
    if (item.rawDesc.default !== undefined) {
      if (item.type === 'set') {
        const defVal = item.rawDesc.default
        if (item.controlType === 'mes') {
          defVal.forEach((v: Primitives) => {
            ;(val as Set<any>).add(v)
          })
        }
        // set with default value only involves string type element, treat as { _val: value }
        else if (Array.isArray(defVal)) {
          defVal.forEach((v) => {
            ;(val as Set<any>).add({
              _val: v,
            })
          })
        } else {
          ;(val as Set<any>).add({
            _val: defVal,
          })
        }
      } else {
        val = item.rawDesc.default
      }
    }
    // if (item.type === 'set') {
    //   if (Array.isArray(val)) {
    //     val = new Set(
    //       (val as Primitives[]).map((v) => ({
    //         _val: v,
    //       }))
    //     )
    //   } else {
    //     const content = val !== null ? [{ _val: val as Primitives }] : null
    //     val = new Set(content)
    //   }
    // }
    form[item.key] = val
    return form
  }, {})
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
  } else if (desc.mutually_exclusive_subsets) {
    controlType = 'mes'
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
  // "list" fields: array, set
  let listItems = null
  let recordList = null
  if (
    ['array', 'set'].includes(itemType) &&
    desc.elements &&
    controlType !== 'mes'
  ) {
    if (desc.elements.type !== 'record') {
      listItems = [parseFieldDesc(desc.elements as SchemaFieldDesc)]
    } else if (desc.elements.fields) {
      recordList = desc.elements.fields.map(parseField)
    }
  }

  return {
    key,
    label,
    type: itemType,
    controlType,
    listItems,
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
  console.log('validate res', validateResult.value)
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
  console.log('submit form: ', form)
  try {
    const res = await validateSchema(props.entity, form)
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
function verifyFields(
  fields: FieldItem[],
  form: Record<string, any>,
  index: number | null = null
) {
  validateResult.value = {}
  fields.forEach((item) => {
    const itemKey = item.key
    const formValue = form[itemKey]
    // handle list value
    if (item.listItems) {
      const itemFields = item.listItems
      // tag element required, turns out empty list is allowed by server
      // const listRequired = itemFields.some((f) => f.rawDesc.required)
      // if (listRequired && !formValue.length) {
      //   validateResult.value[itemKey] = {
      //     ...validateResult.value[itemKey],
      //     required: true,
      //   }
      //   return
      // }
      let idx = 0
      formValue.forEach((elem: Record<string, any>) => {
        verifyFields(itemFields, elem, idx++)
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
            index,
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
    <FormItem
      v-for="(item, index) in schemaFields"
      :key="index"
      :label="item.controlType !== 'checkbox' ? item.label : ''"
      :required="item.rawDesc.required"
    >
      <!-- <KAlert v-if="item.rawDesc.mutually_exclusive_subsets" class="mb-2">
        <template v-slot:alertMessage>
          !!! create a subset control
          subsetForm:{ protocol: currentSubset }
          with checkboxies of subsetform[key] should ignore one_of
          <p>config should be these mutually exclusive subsets:</p>
          <div class="flex flex-wrap">
            <code
              class="m-1"
              v-for="(subset, index) in item.rawDesc.mutually_exclusive_subsets"
              :key="index"
            >
              {{ subset }}
            </code>
          </div>
        </template>
      </KAlert> -->

      <SchemaFormMES
        v-if="item.controlType === 'mes'"
        :fieldItem="item"
        v-model="sForm[item.key]"
      />

      <template v-else>
        <SchemaFormControl
          v-if="!item.listItems && item.controlType !== 'map'"
          class="max-w-md"
          :fieldItem="item"
          :validateResult="validateResult"
          v-model="sForm[item.key]"
        />

        <SchemaFormMap
          v-if="!item.listItems && item.controlType === 'map'"
          v-model="sForm[item.key]"
        />

        <SchemaFormSet
          v-else-if="item.listItems"
          :fieldItems="item.listItems"
          :validateResult="validateResult"
          v-model="sForm[item.key]"
        />

        <SchemaFormRecord
          v-else-if="item.recordList"
          :fieldItems="item.recordList"
          v-model="sForm[item.key]"
        />
      </template>

      <!-- record element -->
      <!-- <ul v-else-if="item.recordList">
        <li
          class="flex justify-between"
          v-for="(recordItem, recordIndex) in item.recordList"
          :key="recordIndex"
        >
          <div>
            <SchemaFormControl
              v-for="(recordFieldItem, rIndex) in item.recordList"
              :key="`${recordFieldItem.key}-${rIndex}`"
              :fieldItem="recordFieldItem"
              v-model="sForm[item.key][index]"
            />
          </div>
          <div>
            <KButton>+</KButton>
            <KButton>-</KButton>
          </div>
        </li>
      </ul> -->
    </FormItem>

    <div>
      <KButton appearance="primary" :isRounded="false" @click="validateForm"
        >Validate Form</KButton
      >
    </div>
  </form>
</template>

<style module></style>
