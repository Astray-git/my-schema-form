<script lang="ts" setup>
import { computed } from 'vue'
import { KCheckbox, KInput, KRadio } from '@kong/kongponents'
import type { FieldItem } from '../type'

const props = defineProps<{
  modelValue: any
  fieldItem: FieldItem
  validateResult?: { [key: string]: { required?: boolean; err?: string } }
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()

const errorData = computed(() => {
  const key = props.fieldItem.key
  const errorRes = props.validateResult?.[key]
  let msg = ''
  if (errorRes?.err) {
    msg = errorRes.err
  } else if (errorRes?.required) {
    msg = `${key} is required`
  }
  return {
    hasError: errorRes != null,
    errorMessage: msg,
  }
})

const formModel = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
  },
})
</script>

<template>
  <KInput
    v-if="fieldItem.controlType === 'input' && fieldItem.type === 'string'"
    class="w-100"
    v-bind="fieldItem.extraBindings"
    :hasError="errorData.hasError"
    :errorMessage="errorData.errorMessage"
    v-model="formModel"
  />
  <KInput
    v-else-if="fieldItem.type === 'integer'"
    class="w-100"
    type="number"
    v-bind="fieldItem.extraBindings"
    :hasError="errorData.hasError"
    :errorMessage="errorData.errorMessage"
    v-model.number="formModel"
  />

  <KCheckbox
    v-else-if="fieldItem.controlType === 'checkbox'"
    v-model="formModel"
    ><span class="font-semibold">{{ fieldItem.label }}</span></KCheckbox
  >
  <template v-else-if="fieldItem.controlType === 'radio'">
    <ul class="flex flex-wrap">
      <li class="mb-1 mr-2" v-for="opt in fieldItem.rawDesc.one_of" :key="opt">
        <KRadio :selectedValue="opt" v-model="formModel">
          <code>{{ opt }}</code>
        </KRadio>
      </li>
    </ul>
  </template>
</template>
