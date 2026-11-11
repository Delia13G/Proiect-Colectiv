// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import RegisterForm from '../src/components/RegisterForm.vue'
import axios from 'axios'

// 1. Facem mock la Vue Router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  }),
  RouterLink: {
    template: '<a><slot /></a>'
  }
}))

// 2. Facem mock la Axios pentru a nu face request-uri reale către Quarkus în timpul testelor
vi.mock('axios')

describe('RegisterForm.vue', () => {
  
  it('prevents submission when fields are empty', async () => {
    const wrapper = mount(RegisterForm)
    
    // Declanșăm direct submit-ul
    await wrapper.find('form').trigger('submit.prevent')
    
    // Verificăm erorile apărute din funcția `computed`
    expect(wrapper.text()).toContain('First name is required')
    expect(wrapper.text()).toContain('Personal email is required')
    expect(wrapper.text()).toContain('You must accept the terms')
  })

  it('rejects non-academic emails', async () => {
    const wrapper = mount(RegisterForm)
    const emailInput = wrapper.find('input[id="studentEmail"]')
    
    // Introducem un email non-academic
    await emailInput.setValue('student_oarecare@gmail.com')
    await emailInput.trigger('blur')
    
    // Așteptăm ca Vue să actualizeze interfața
    await wrapper.vm.$nextTick()
    
    // Verificăm validarea specifică
    expect(wrapper.text()).toContain('Must be a valid university email')
  })

  it('shows error when passwords do not match', async () => {
    const wrapper = mount(RegisterForm)
    
    await wrapper.find('input[id="password"]').setValue('ParolaPuternica1!')
    await wrapper.find('input[id="confirmPassword"]').setValue('AltaParolaTotalDiferita!')
    await wrapper.find('input[id="confirmPassword"]').trigger('blur')
    
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Passwords do not match')
  })
})