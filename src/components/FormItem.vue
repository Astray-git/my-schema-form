<script lang="ts" setup>
import { KLabel } from '@kong/kongponents'

withDefaults(
  defineProps<{
    label?: string
    required?: boolean
    inline?: boolean
  }>(),
  { required: false, inline: false }
)
</script>

<template>
  <div
    :class="[
      'mb-2',
      {
        flex: inline,
        'items-baseline': inline,
      },
    ]"
  >
    <KLabel v-if="label" :class="inline ? 'mr-2' : 'block'">
      <span>{{ label }}</span
      ><span v-if="required" class="px-1 text-red-500 text-base">*</span>
    </KLabel>
    <div>
      <slot></slot>
    </div>
  </div>
</template>
