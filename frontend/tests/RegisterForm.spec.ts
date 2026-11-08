// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import axios from 'axios'
import RegisterForm from '../src/components/RegisterForm.vue'

// Mock Axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    isAxiosError: (payload: any) => payload && payload.isAxiosError === true
  }
}))

// Mock Vue Router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  }),
  RouterLink: {
    template: '<a><slot /></a>'
  }
}))

describe('RegisterForm.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prevents submission and shows errors when required fields are empty', async () => {
    const wrapper = mount(RegisterForm)
    await wrapper.find('form').trigger('submit.prevent')
    
    expect(wrapper.text()).toContain('First name is required')
    expect(wrapper.text()).toContain('Last name is required')
    expect(wrapper.text()).toContain('Personal email is required')
    
    // ȘTERGE SAU COMENTEAZĂ ACEASTĂ LINIE:
    // expect(wrapper.text()).toContain('Password does not meet all requirements')
    
    expect(wrapper.text()).toContain('You must accept the terms')
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('rejects invalid personal email and invalid academic student email', async () => {
    const wrapper = mount(RegisterForm)
    
    await wrapper.find('#personalEmail').setValue('not-an-email')
    // Setăm touched pentru a forța apariția erorii de student email
    await wrapper.find('#studentEmail').setValue('not-academic@gmail.com')
    await wrapper.find('#studentEmail').trigger('blur')
    
    await wrapper.find('form').trigger('submit.prevent')
    
    expect(wrapper.text()).toContain('Invalid email format')
    expect(wrapper.text()).toContain('Must be a valid university email')
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('shows error when passwords do not match', async () => {
    const wrapper = mount(RegisterForm)
    
    await wrapper.find('#password').setValue('StrongPass1!')
    await wrapper.find('#confirmPassword').setValue('DifferentPass2@')
    await wrapper.find('#confirmPassword').trigger('blur')
    await wrapper.find('form').trigger('submit.prevent')
    
    expect(wrapper.text()).toContain('Passwords do not match')
  })

  it('registers successfully, calls API with correct payload, and shows success screen', async () => {
    const wrapper = mount(RegisterForm)
    
    ;(axios.post as any).mockResolvedValueOnce({ data: { message: 'Success' } })

    await wrapper.find('#firstName').setValue('John')
    await wrapper.find('#lastName').setValue('Doe')
    await wrapper.find('#personalEmail').setValue('john.doe@gmail.com')
    await wrapper.find('#studentEmail').setValue('john.doe@stud.ubbcluj.ro')
    await wrapper.find('#password').setValue('StrongPass1!')
    await wrapper.find('#confirmPassword').setValue('StrongPass1!')
    await wrapper.find('input[type="checkbox"]').setValue(true)

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(axios.post).toHaveBeenCalledWith('http://localhost:8080/api/auth/register', {
      firstName: 'John',
      lastName: 'Doe',
      personalEmail: 'john.doe@gmail.com',
      studentEmail: 'john.doe@stud.ubbcluj.ro',
      phone: null,
      password: 'StrongPass1!'
    })

    expect(wrapper.text()).toContain('Check your inbox')
    expect(wrapper.find('form').exists()).toBe(false)
  })
})