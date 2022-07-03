<!-- for mutually_exclusive_subsets -->
<script lang="ts" setup>
import { computed, ref } from 'vue'
import { KSelect } from '@kong/kongponents'
import type { FieldItem } from '../type'

const props = defineProps<{
  modelValue: any[] | Set<any>
  fieldItem: FieldItem
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()
const checkboxVal = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
  },
})

const subSetOptions = computed(() => {
  return props.fieldItem.rawDesc.mutually_exclusive_subsets.map(
    (subset: string[]) => {
      const defaultVal = props.fieldItem.rawDesc?.default
      return {
        label: subset.join(', '),
        value: subset.join(','),
        selected: subset === defaultVal,
      }
    }
  )
})
const selected = ref<string>((props.fieldItem.rawDesc?.default ?? []).join(','))
const optionList = computed(() => {
  return selected.value ? selected.value.split(',') : []
})

function subSetChange() {
  emit('update:modelValue', new Set())
}
</script>

<template>
  <div>
    <KSelect
      appearance="select"
      :items="subSetOptions"
      v-model="selected"
      @change="subSetChange"
    />
    <ul class="flex">
      <li class="mr-2" v-for="option in optionList" :key="option">
        <!-- use native input for array binding -->
        <label class="k-checkbox">
          <input
            type="checkbox"
            class="k-input"
            :value="option"
            v-model="checkboxVal"
          />
          <code>{{ option }}</code>
        </label>
      </li>
    </ul>
  </div>
</template>
