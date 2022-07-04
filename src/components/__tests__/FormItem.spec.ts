import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import FormItem from '../FormItem.vue'

describe('FormItem', () => {
  it('renders label properly', () => {
    const wrapper = mount(FormItem, {
      props: { label: 'Name' },
    })
    expect(wrapper.text()).toContain('Name')
    expect(wrapper.text()).not.toContain('*')
  })
  it('renders require *', () => {
    const wrapper = mount(FormItem, {
      props: { label: 'Foo', required: true },
    })
    expect(wrapper.text()).toContain('Foo')
    expect(wrapper.text()).toContain('*')
  })
  it('renders properly with no label prop', () => {
    const wrapper = mount(FormItem, {
      props: {},
    })
    expect(wrapper.find('label').exists()).toBe(false)
  })
  it('renders inline label', () => {
    const wrapper = mount(FormItem, {
      props: { label: 'Foo' },
    })
    const wrapperInline = mount(FormItem, {
      props: { label: 'Foo', inline: true },
    })
    expect(wrapper.find('label').classes('block')).toBe(true)
    expect(wrapperInline.find('label').classes('block')).toBe(false)
  })
})
