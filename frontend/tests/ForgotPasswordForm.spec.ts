// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import axios from 'axios'
import ForgotPasswordForm from '../src/components/ForgotPasswordForm.vue'

// Mock pentru Axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn()
  }
}))

// Mock pentru Vue Router
vi.mock('vue-router', () => ({
  RouterLink: {
    template: '<a><slot /></a>'
  }
}))

describe('ForgotPasswordForm.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prevents submission when email is empty', async () => {
    const wrapper = mount(ForgotPasswordForm)
    
    await wrapper.find('form').trigger('submit.prevent')
    
    expect(wrapper.text()).toContain('Email is required')
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('shows invalid email format error', async () => {
    const wrapper = mount(ForgotPasswordForm)
    
    await wrapper.find('input[type="email"]').setValue('invalidemailformat')
    await wrapper.find('form').trigger('submit.prevent')
    
    expect(wrapper.text()).toContain('Please enter a valid email address')
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('makes API call and shows success message on valid email', async () => {
    const wrapper = mount(ForgotPasswordForm)
    // Simulăm un răspuns de succes de la server (200 OK)
    ;(axios.post as any).mockResolvedValueOnce({})

    await wrapper.find('input[type="email"]').setValue('andrei@gmail.com')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(axios.post).toHaveBeenCalledWith('http://localhost:8080/auth/reset-password', {
      email: 'andrei@gmail.com'
    })
    expect(wrapper.text()).toContain('If the email exists, a reset link has been sent.')
  })

  it('shows error message when API call fails', async () => {
    const wrapper = mount(ForgotPasswordForm)
    // Simulăm o eroare de rețea sau de la server
    ;(axios.post as any).mockRejectedValueOnce(new Error('Network Error'))

    await wrapper.find('input[type="email"]').setValue('andrei@gmail.com')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('An error occurred while attempting to send the reset link.')
  })
})