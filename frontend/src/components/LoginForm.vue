<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { Eye, EyeOff, Loader2, AlertTriangle, Check, AlertCircle } from 'lucide-vue-next'

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)
const capsLockOn = ref(false)
const isLoading = ref(false)

const router = useRouter()
const authStore = useAuthStore()

const emailError = ref('')
const passwordError = ref('')
const serverError = ref('')

const checkCapsLock = (event: KeyboardEvent) => {
  capsLockOn.value = event.getModifierState('CapsLock')
}

const validateForm = () => {
  let isValid = true
  emailError.value = ''
  passwordError.value = ''
  serverError.value = ''

  if (!email.value) {
    emailError.value = 'Email is required'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    // UPDATED: Generic error message instead of university domain restriction
    emailError.value = 'Please enter a valid email address'
    isValid = false
  }

  if (!password.value) {
    passwordError.value = 'Password is required'
    isValid = false
  }

  return isValid
}

const handleLogin = async () => {
  if (!validateForm() || isLoading.value) return
  
  isLoading.value = true
  serverError.value = ''
  
  try {
    const response = await axios.post('http://localhost:8080/auth/login', {
      email: email.value,
      password: password.value,
      rememberMe: rememberMe.value
    })

    console.log('Login successful')
    
    if (response.data && response.data.token) {
      authStore.setToken(response.data.token)
    }

    router.push('/dashboard')
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      
      if (status === 401) {
        serverError.value = 'Invalid email or password.'
      } else if (status === 404) {
        serverError.value = 'User account not found.'
      } else if (status === 500) {
        serverError.value = 'Internal server error. Please try again later.'
      } else {
        serverError.value = 'A network error occurred. Please check your connection.'
      }
    } else {
      serverError.value = 'An unexpected error occurred.'
    }
    console.error('Autentificare eșuată:', error)
  } finally {
    isLoading.value = false
  }
}

const togglePassword = () => {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <div class="relative z-10 w-full max-w-[90%] md:max-w-md p-6 md:p-10 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
    
    <div class="text-center mb-8 md:mb-10">
      <h1 class="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-rose-400 to-emerald-400 bg-[length:200%_auto] animate-gradient tracking-widest drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] pb-1 ml-3">
        Cliq
      </h1>
      <!-- UPDATED: Removed "university" from the subtitle -->
      <p class="text-slate-400 mt-2 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase">
        Enter your network
      </p>
    </div>

    <!-- Alertă globală pentru erori de la backend -->
    <transition enter-active-class="transition ease-out duration-300" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition ease-in duration-200" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-2">
      <div v-if="serverError" class="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start">
        <AlertCircle class="w-5 h-5 text-rose-400 mr-2.5 flex-shrink-0 mt-0.5" />
        <p class="text-sm text-rose-300">{{ serverError }}</p>
      </div>
    </transition>

    <form class="space-y-4 md:space-y-5" @submit.prevent="handleLogin" novalidate>
      
      <!-- Email Field -->
      <div>
        <!-- UPDATED: Changed label to Email Address -->
        <label for="email" class="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
        <input 
          id="email"
          v-model="email"
          type="email" 
          placeholder="e.g., andrei@example.com" 
          :aria-invalid="!!emailError"
          :disabled="isLoading"
          class="w-full px-4 py-3 bg-black/20 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
          :class="emailError ? 'border-rose-500 focus:ring-rose-500' : 'border-white/5 focus:ring-indigo-500'"
        />
        <p v-if="emailError" class="text-rose-400 text-xs mt-1.5">{{ emailError }}</p>
      </div>

      <!-- Password Field -->
      <div>
        <label for="password" class="block text-sm font-medium text-slate-300 mb-1">Password</label>
        <div class="relative">
          <input 
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'" 
            placeholder="••••••••" 
            :aria-invalid="!!passwordError"
            :disabled="isLoading"
            @keyup="checkCapsLock"
            class="w-full px-4 py-3 pr-12 bg-black/20 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
            :class="passwordError ? 'border-rose-500 focus:ring-rose-500' : 'border-white/5 focus:ring-indigo-500'"
          />
          <button 
            type="button"
            @click="togglePassword"
            :aria-pressed="showPassword"
            aria-label="Toggle password visibility"
            :disabled="isLoading"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors focus:outline-none disabled:opacity-50"
          >
            <EyeOff v-if="showPassword" class="w-5 h-5" />
            <Eye v-else class="w-5 h-5" />
          </button>
        </div>
        <p v-if="passwordError" class="text-rose-400 text-xs mt-1.5">{{ passwordError }}</p>

        <!-- Caps Lock Warning -->
        <transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 -translate-y-1" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-1">
          <p v-if="capsLockOn" class="text-amber-400 text-xs mt-1.5 flex items-center">
            <AlertTriangle class="w-3.5 h-3.5 mr-1.5" /> 
            Caps Lock is ON
          </p>
        </transition>
      </div>

      <!-- Remember Me & Forgot Password -->
      <div class="flex items-center justify-between mt-2">
        <label class="flex items-center text-xs md:text-sm text-slate-400 hover:text-slate-300 cursor-pointer transition-colors group relative">
          <input 
            type="checkbox" 
            v-model="rememberMe"
            :disabled="isLoading"
            class="sr-only peer" 
          />
          <div class="mr-2.5 w-4.5 h-4.5 rounded flex items-center justify-center border transition-all duration-200 ease-in-out
                      peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-slate-900
                      peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
                      bg-black/20 border-white/10 group-hover:border-white/30
                      peer-checked:bg-indigo-500 peer-checked:border-indigo-500">
            <Check 
              class="w-3.5 h-3.5 text-white stroke-[3] transition-transform duration-200 ease-out"
              :class="rememberMe ? 'scale-100 opacity-100' : 'scale-50 opacity-0'" 
            />
          </div>
          Remember me
        </label>
        
        <a href="#" class="text-xs md:text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
          Forgot password?
        </a>
      </div>

      <!-- CTA Button -->
      <button 
        type="submit" 
        :disabled="isLoading"
        class="w-full flex items-center justify-center py-3 mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 ease-out hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
      >
        <Loader2 v-if="isLoading" class="w-5 h-5 mr-2 animate-spin" />
        {{ isLoading ? 'Authenticating...' : 'Authenticate' }}
      </button>
    </form>

    <p class="text-center text-xs md:text-sm text-slate-400 mt-6">
      Don't have an account? 
      <router-link to="/register" class="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Start the Vibe Check</router-link>
    </p>
  </div>
</template>