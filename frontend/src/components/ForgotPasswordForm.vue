<script setup lang="ts">
import { ref } from 'vue'
import { Loader2, Mail } from 'lucide-vue-next'
import axios from 'axios'

const email = ref('')
const isLoading = ref(false)
const emailError = ref('')
const serverMessage = ref('') // Poate fi mesaj de eroare sau de succes

const validateEmail = () => {
  if (!email.value) {
    emailError.value = 'Email is required'
    return false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    emailError.value = 'Please enter a valid email address'
    return false
  }
  emailError.value = ''
  return true
}

const handleReset = async () => {
  if (!validateEmail() || isLoading.value) return
  
  isLoading.value = true
  serverMessage.value = ''
  
  try {
    // Apelăm endpoint-ul de resetare din Quarkus (colegii trebuie să îl implementeze)
    await axios.post('http://localhost:8080/auth/reset-password', {
      email: email.value
    })

    // Dacă a reușit, afișăm un mesaj de succes
    serverMessage.value = 'If the email exists, a reset link has been sent.'
  } catch (error) {
    console.error('Reset eșuat:', error)
    serverMessage.value = 'An error occurred while attempting to send the reset link.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="relative z-10 w-full max-w-[90%] md:max-w-md p-6 md:p-10 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
    
    <div class="text-center mb-8 md:mb-10">
      <h1 class="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-rose-400 to-emerald-400 pb-1">
        Reset Password
      </h1>
      <p class="text-slate-400 mt-2 text-xs md:text-sm">
        Enter your email to receive a reset link.
      </p>
    </div>

    <!-- Mesaj dinamic de la server -->
    <p v-if="serverMessage" class="text-center text-sm mb-6" :class="serverMessage.includes('error') ? 'text-rose-400' : 'text-emerald-400'">
      {{ serverMessage }}
    </p>

    <form class="space-y-4 md:space-y-5" @submit.prevent="handleReset" novalidate>
      <div>
        <label for="reset-email" class="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
        <div class="relative">
          <input 
            id="reset-email"
            v-model="email"
            type="email" 
            placeholder="e.g., andrei@example.com" 
            :aria-invalid="!!emailError"
            :disabled="isLoading"
            class="w-full px-4 py-3 pl-10 bg-black/20 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
            :class="emailError ? 'border-rose-500 focus:ring-rose-500' : 'border-white/5 focus:ring-indigo-500'"
          />
          <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>
        <p v-if="emailError" class="text-rose-400 text-xs mt-1.5">{{ emailError }}</p>
      </div>

      <button 
        type="submit" 
        :disabled="isLoading"
        class="w-full flex items-center justify-center py-3 mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 ease-out hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
      >
        <Loader2 v-if="isLoading" class="w-5 h-5 mr-2 animate-spin" />
        {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
      </button>
    </form>

    <div class="text-center mt-6">
      <router-link to="/login" class="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">
        &larr; Back to Login
      </router-link>
    </div>
  </div>
</template>