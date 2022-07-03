<script lang="ts" setup>
import { nextTick, ref } from 'vue'
import { KButton, KPrompt } from '@kong/kongponents'
import { labelFromKey } from '@/utils'
import SchemaPluginForm from './components/SchemaPluginForm.vue'
import SchemaForm from './components/SchemaForm.vue'
import { Entity } from './constants'
import { Plugin } from './constants'

const allEntities = [Entity.Consumer, Entity.Service, Entity.Route].map(
  toOptions
)
const allPlugins = [Plugin.BasicAuth].map(toOptions)
function toOptions(s: Entity | Plugin) {
  return {
    value: s,
    label: labelFromKey(s),
  }
}
const showConfirm = ref(false)
let promptResolve: (r: boolean) => void | null
function promptForConfirm() {
  showConfirm.value = true
  return new Promise<boolean>((res) => {
    promptResolve = res
  })
}
function confirmPrompt(confirmed: boolean) {
  promptResolve && promptResolve(confirmed)
  showConfirm.value = false
}

const formDirty = ref(false)
const selected = ref<Entity | Plugin | null>(null)
async function changeForm(schemaName: Entity | Plugin) {
  // show confirm on dirty form
  if (formDirty.value) {
    const proceed = await promptForConfirm()
    if (!proceed) return
  }
  formDirty.value = false
  // create new component each time
  selected.value = null
  nextTick(() => {
    selected.value = schemaName
  })
}
</script>

<template>
  <div>
    <div class="flex py-2 mb-2 shadow-sm">
      <div class="mr-2 border-r border-slate-400">
        <h5>Entities</h5>
        <ul class="flex mt-2">
          <li class="mr-2" v-for="entity in allEntities" :key="entity.value">
            <KButton
              :appearance="selected === entity.value ? 'primary' : 'outline'"
              @click="changeForm(entity.value)"
              >{{ entity.label }}</KButton
            >
          </li>
        </ul>
      </div>
      <div>
        <h5>Plugins</h5>
        <ul class="flex mt-2">
          <li class="mr-2" v-for="plugin in allPlugins" :key="plugin.value">
            <KButton
              :appearance="selected === plugin.value ? 'primary' : 'outline'"
              @click="changeForm(plugin.value)"
              >{{ plugin.label }}</KButton
            >
          </li>
        </ul>
      </div>
    </div>
    <div>
      <SchemaForm
        v-if="selected && selected !== Plugin.BasicAuth"
        :entity="selected"
        @form-dirty="formDirty = true"
      />
      <SchemaPluginForm
        v-if="selected && selected === Plugin.BasicAuth"
        :plugin="selected"
        @form-dirty="formDirty = true"
      />
      <div v-if="!selected">
        <p>Choose a schema above</p>
      </div>
    </div>
    <KPrompt
      :is-visible="showConfirm"
      message="There is an un-submitted form, are you sure you want to switch the form?"
      @canceled="confirmPrompt(false)"
      @proceed="confirmPrompt(true)"
    />
  </div>
</template>
