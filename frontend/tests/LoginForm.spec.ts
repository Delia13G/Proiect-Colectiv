// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import LoginForm from '../src/components/LoginForm.vue'

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  }),
  RouterLink: {
    template: '<a><slot /></a>'
  }
}))

describe('LoginForm.vue', () => {
  it('prevents submission and shows errors when fields are empty', async () => {
    const wrapper = mount(LoginForm)

    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('Email is required')
    expect(wrapper.text()).toContain('Password is required')
  })

  it('shows invalid email format error', async () => {
    const wrapper = mount(LoginForm)

    await wrapper.find('input[type="email"]').setValue('andreistudent')
    await wrapper.find('input[type="password"]').setValue('parola123')
    
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('Please enter a valid university email')
    expect(wrapper.text()).not.toContain('Password is required')
  })
})