import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // Inițializăm token-ul citind direct din localStorage
  const token = ref<string | null>(localStorage.getItem('token'))

  // Un computed property util pentru a verifica rapid dacă userul e logat
  const isAuthenticated = computed(() => !!token.value)

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const logout = () => {
    token.value = null
    localStorage.removeItem('token')
  }

  return { token, isAuthenticated, setToken, logout }
})