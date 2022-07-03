<script lang="ts" setup>
import { ref } from 'vue'
import { KButton, KInput, KLabel } from '@kong/kongponents'

const props = defineProps<{
  modelValue: Record<string, string>
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()

const newVal = ref({
  key: '',
  value: '',
})
const initForm = {
  key: '',
  value: '',
}

function updateValue(key: string, val: string) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: val,
  })
}

function addItem() {
  const form = newVal.value
  // empty check
  if (!form.key || !form.value) {
    return
  }
  emit('update:modelValue', {
    ...props.modelValue,
    [form.key]: form.value,
  })
  newVal.value = { ...initForm }
}

function removeItem(key: string) {
  const newVal = { ...props.modelValue }
  delete newVal[key]
  emit('update:modelValue', newVal)
}
</script>

<template>
  <ul>
    <li class="flex">
      <div class="flex w-100 max-w-md">
        <KLabel class="flex-1 mr-2">Keys</KLabel>
        <KLabel class="flex-1">Values</KLabel>
      </div>
    </li>
    <li class="flex mb-2" v-for="(value, key) in modelValue" :key="key">
      <div class="flex-1 flex max-w-md mr-2">
        <div class="flex-1 mr-2 flex items-center">
          {{ key }}
        </div>
        <div class="flex-1">
          <KInput
            class="w-100"
            :modelValue="modelValue[key]"
            @update:modelValue="updateValue(key, $event)"
          />
        </div>
      </div>
      <div>
        <KButton @click="removeItem(key)">Remove</KButton>
      </div>
    </li>
    <li class="flex">
      <div class="flex-1 flex max-w-md mr-2">
        <div class="flex-1 mr-2">
          <KInput class="w-100" v-model="newVal.key"></KInput>
        </div>
        <div class="flex-1">
          <KInput class="w-100" v-model="newVal.value"></KInput>
        </div>
      </div>
      <div>
        <KButton @click="addItem">Add</KButton>
      </div>
    </li>
  </ul>
</template>
