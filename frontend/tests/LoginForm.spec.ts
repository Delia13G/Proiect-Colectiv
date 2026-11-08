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

    // Acesta va eșua în continuare deoarece nu respectă structura standard (nume@domeniu.com)
    await wrapper.find('input[type="email"]').setValue('andreistudent')
    await wrapper.find('input[type="password"]').setValue('parola123')
    
    await wrapper.find('form').trigger('submit.prevent')

    // UPDATED: Noul mesaj de eroare generic
    expect(wrapper.text()).toContain('Please enter a valid email address')
    expect(wrapper.text()).not.toContain('Password is required')
  })

  // NEW: Test adăugat pentru a verifica cerința din PRO-25
  it('accepts a generic valid email format without university domain restriction', async () => {
    const wrapper = mount(LoginForm)

    // Setăm un email valid, dar non-universitar
    await wrapper.find('input[type="email"]').setValue('andrei@gmail.com')
    await wrapper.find('input[type="password"]').setValue('parola123')
    
    await wrapper.find('form').trigger('submit.prevent')

    // Verificăm că nu apare nicio eroare de validare a emailului
    expect(wrapper.text()).not.toContain('Please enter a valid email address')
    expect(wrapper.text()).not.toContain('Email is required')
  })
})