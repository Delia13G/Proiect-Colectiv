// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import axios from 'axios'
import LoginForm from '../src/components/LoginForm.vue'
import { createTestingPinia } from '@pinia/testing'
import { useAuthStore } from '../src/stores/auth'

// Folosim vi.hoisted pentru a crea o referință unică pentru push.
// Aceeași funcție va fi folosită de componentă și verificată în test.
const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn()
}))

// Mock Axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    isAxiosError: (payload: any) => payload && payload.isAxiosError === true
  }
}))

// Mock Vue Router care folosește referința unică mockPush
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
  })

  // Helper pentru a monta componenta cu Pinia injectat
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
    
    // Configurăm axios să returneze un token fals
    ;(axios.post as any).mockResolvedValueOnce({ data: { token: 'fake-jwt-token' } })

    // Validăm formularul cu un email generic
    await wrapper.find('input[type="email"]').setValue('andrei@gmail.com')
    await wrapper.find('input[type="password"]').setValue('parola123')
    
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).not.toContain('Please enter a valid email address')
    
    expect(axios.post).toHaveBeenCalledWith('http://localhost:8080/auth/login', {
      email: 'andrei@gmail.com',
      password: 'parola123',
      rememberMe: false
    })

    expect(authStore.setToken).toHaveBeenCalledWith('fake-jwt-token')

    // Verificăm rutarea folosind direct mockPush
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
})