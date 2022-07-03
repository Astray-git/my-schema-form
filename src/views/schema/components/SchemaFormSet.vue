<script lang="ts" setup>
import { computed, ref } from 'vue'
import { KButton } from '@kong/kongponents'
import { FormItem } from '@/components'
import SchemaFormControl from './SchemaFormControl.vue'
import type { FieldItem } from '../type'

type ValueTypes = null | string | number | boolean

const props = defineProps<{
  modelValue: any[] | Set<any>
  validateResult?: {
    [key: string]: { required?: boolean; index?: number; err?: string }
  }
  fieldItems: FieldItem[]
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()

const newVal = ref<Record<string, any>>({})
let initForm: Record<string, any> = {}

function init() {
  newVal.value = genSubForm(props.fieldItems)
}
init()

const isArrayList = computed(() => {
  return Array.isArray(props.modelValue)
})

function addItem() {
  const form = newVal.value
  // empty check for primitive form
  if (form._val !== undefined) {
    const fieldType = props.fieldItems[0].type
    if (fieldType === 'string' && !form._val.length) return
    if (fieldType === 'integer' && form._val == null) return
  }

  if (isArrayList.value) {
    emit('update:modelValue', (props.modelValue as any[]).push({ ...form }))
  } else {
    emit('update:modelValue', (props.modelValue as Set<any>).add({ ...form }))
  }
  newVal.value = { ...initForm }
}

function removeItem(index: number) {
  const newVal = Array.from(props.modelValue)
  newVal.splice(index, 1)
  if (isArrayList.value) {
    emit('update:modelValue', newVal)
  } else {
    emit('update:modelValue', new Set(newVal))
  }
}

/**
 * generate initial form data
 * @param fieldItems
 */
function genSubForm(fieldItems: FieldItem[]) {
  return fieldItems.reduce<Record<string, ValueTypes>>((form, item) => {
    let val: ValueTypes = ''
    if (item.rawDesc.default !== undefined) {
      val = item.rawDesc.default
    }
    form[item.key] = val
    initForm = { ...form }
    return form
  }, {})
}
</script>

<template>
  <ul>
    <li class="flex" v-for="(valueItem, index) in modelValue" :key="index">
      <div class="flex-1 max-w-md mr-2">
        <FormItem
          class="w-100"
          v-for="(field, itemIndex) in fieldItems"
          :key="itemIndex"
        >
          <SchemaFormControl
            :fieldItem="field"
            :validateResult="
              validateResult?._val?.index === index ? validateResult : {}
            "
            v-model="valueItem[field.key]"
          />
        </FormItem>
      </div>
      i: {{ index }}
      <div>
        <KButton @click="removeItem(index)">Remove</KButton>
      </div>
    </li>
    <li class="flex">
      <div class="flex-1 max-w-md mr-2">
        <FormItem
          class="w-100"
          v-for="(field, itemIndex) in fieldItems"
          :key="itemIndex"
        >
          <SchemaFormControl
            :fieldItem="field"
            v-model="newVal[field.key]"
            @keyup.enter="addItem"
          />
        </FormItem>
      </div>
      <div>
        <KButton @click="addItem">Add</KButton>
      </div>
    </li>
  </ul>
</template>
