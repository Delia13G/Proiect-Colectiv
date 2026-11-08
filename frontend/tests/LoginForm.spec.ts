// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import axios from 'axios'
import LoginForm from '../src/components/LoginForm.vue'
import { createTestingPinia } from '@pinia/testing'
import { useAuthStore } from '../src/stores/auth'

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn()
}))

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    isAxiosError: (payload: any) => payload && payload.isAxiosError === true
  }
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  }),
  RouterLink: {
    template: '<a><slot /></a>'
  }
}))

describe('LoginForm.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear() // Curățăm localStorage înainte de fiecare test
  })

  const createWrapper = () => {
    return mount(LoginForm, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              auth: { token: null }
            }
          })
        ]
      }
    })
  }

  it('prevents submission and shows errors when fields are empty', async () => {
    const wrapper = createWrapper()
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('Email is required')
    expect(wrapper.text()).toContain('Password is required')
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('accepts generic valid email, sets token in Pinia, and routes to dashboard on success', async () => {
    const wrapper = createWrapper()
    const authStore = useAuthStore()
    
    ;(axios.post as any).mockResolvedValueOnce({ data: { token: 'fake-jwt-token' } })

    await wrapper.find('input[type="email"]').setValue('andrei@gmail.com')
    await wrapper.find('input[type="password"]').setValue('parola123')
    
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).not.toContain('Please enter a valid email address')
    expect(authStore.setToken).toHaveBeenCalledWith('fake-jwt-token')
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('displays correct error message on 401 Unauthorized', async () => {
    const wrapper = createWrapper()
    
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

  // NEW: Teste pentru funcționalitatea Remember Me
  it('loads remembered email from localStorage on mount', async () => {
    // Setăm un email în memorie înainte să montăm componenta
    localStorage.setItem('rememberedEmail', 'saved@gmail.com')
    
    const wrapper = createWrapper()
    await flushPromises() // Așteptăm executarea lui onMounted
    
    const emailInput = wrapper.find('input[type="email"]').element as HTMLInputElement
    const checkbox = wrapper.find('input[type="checkbox"]').element as HTMLInputElement
    
    expect(emailInput.value).toBe('saved@gmail.com')
    expect(checkbox.checked).toBe(true)
  })

  it('saves email to localStorage when Remember Me is checked during login', async () => {
    const wrapper = createWrapper()
    ;(axios.post as any).mockResolvedValueOnce({ data: { token: 'fake-jwt-token' } })

    await wrapper.find('input[type="email"]').setValue('newuser@gmail.com')
    await wrapper.find('input[type="password"]').setValue('parola123')
    await wrapper.find('input[type="checkbox"]').setValue(true) // Bifăm "Remember Me"
    
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(localStorage.getItem('rememberedEmail')).toBe('newuser@gmail.com')
  })
})