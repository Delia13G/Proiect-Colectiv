// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import axios from 'axios'
import LoginForm from '../src/components/LoginForm.vue'

// 1. Suprascriem mock-ul Axios pentru a-i oferi o implementare reală funcției isAxiosError
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    isAxiosError: (payload: any) => payload && payload.isAxiosError === true
  }
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  }),
  RouterLink: {
    template: '<a><slot /></a>'
  }
}))

describe('LoginForm.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prevents submission and shows errors when fields are empty', async () => {
    const wrapper = mount(LoginForm)

    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('Email is required')
    expect(wrapper.text()).toContain('Password is required')
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('accepts a generic valid email format without university domain restriction', async () => {
    const wrapper = mount(LoginForm)
    
    ;(axios.post as any).mockResolvedValueOnce({ data: { token: 'fake-jwt-token' } })

    await wrapper.find('input[type="email"]').setValue('andrei@gmail.com')
    await wrapper.find('input[type="password"]').setValue('parola123')
    
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).not.toContain('Please enter a valid email address')
    expect(axios.post).toHaveBeenCalledWith('/api/auth/login', {
      email: 'andrei@gmail.com',
      password: 'parola123',
      rememberMe: false
    })
  })

  it('displays correct error message on 401 Unauthorized', async () => {
    const wrapper = mount(LoginForm)
    
    // 2. Acum obiectul nostru de eroare va fi recunoscut de mock-ul isAxiosError definit sus
    const mockError = {
      isAxiosError: true,
      response: { status: 401 }
    }
    ;(axios.post as any).mockRejectedValueOnce(mockError)

    await wrapper.find('input[type="email"]').setValue('andrei@example.com')
    await wrapper.find('input[type="password"]').setValue('wrongpassword')
    
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('Invalid email or password.')
  })
})