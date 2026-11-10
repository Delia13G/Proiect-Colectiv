<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, Loader2, AlertTriangle, Check, Circle } from 'lucide-vue-next'
import axios from 'axios'

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const confirmPassword = ref('')

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const acceptTerms = ref(false)
const capsLockOn = ref(false)
const isLoading = ref(false)
const serverError = ref('')
const router = useRouter()

// Urmărim dacă utilizatorul a interacționat cu câmpul
const touched = ref({
  firstName: false,
  lastName: false,
  email: false,
  password: false,
  confirmPassword: false,
  terms: false
})

const checkCapsLock = (event: KeyboardEvent) => {
  capsLockOn.value = event.getModifierState('CapsLock')
}

const isAcademicEmail = (emailStr: string) => {
  const domainParts = emailStr.split('@')
  if (domainParts.length !== 2) return false
  
  const domain = domainParts[1].toLowerCase()
  return domain.includes('.edu') || 
         domain.includes('.ac.') || 
         domain.includes('stud') || 
         domain.includes('univ') || 
         domain.endsWith('ubbcluj.ro')
}

// 1. SMART PASSWORD INDICATORS
const passwordRules = computed(() => [
  { label: 'Min. 8 characters', met: password.value.length >= 8 },
  { label: 'One uppercase letter', met: /[A-Z]/.test(password.value) },
  { label: 'One number', met: /[0-9]/.test(password.value) },
  { label: 'One special character', met: /[^A-Za-z0-9]/.test(password.value) }
])

const passwordStrength = computed(() => passwordRules.value.filter(rule => rule.met).length)

const strengthColor = computed(() => {
  if (passwordStrength.value <= 1) return 'bg-rose-500'
  if (passwordStrength.value === 2) return 'bg-amber-500'
  if (passwordStrength.value === 3) return 'bg-blue-400'
  return 'bg-emerald-500'
})

// 2. INLINE VALIDATION REZOLVAT (Folosind Computed în loc de Watch)
// Acum erorile se calculează constant și instantaneu, chiar și când câmpurile sunt goale
const errors = computed(() => {
  const errs = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: ''
  }

  if (!firstName.value.trim()) errs.firstName = 'First name is required'
  
  if (!lastName.value.trim()) errs.lastName = 'Last name is required'
  
  if (!email.value) {
    errs.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    errs.email = 'Invalid email format'
  } else if (!isAcademicEmail(email.value)) {
    errs.email = 'Must be a valid university email (.edu, stud.*, etc.)'
  }

  if (!password.value || passwordStrength.value < 4) {
    errs.password = 'Password does not meet all requirements'
  }

  if (!confirmPassword.value || confirmPassword.value !== password.value) {
    errs.confirmPassword = 'Passwords do not match'
  }

  if (!acceptTerms.value) {
    errs.terms = 'You must accept the terms'
  }

  return errs
})


const handleRegister = async () => {
  Object.keys(touched.value).forEach(key => {
    touched.value[key as keyof typeof touched.value] = true
  })

  const hasErrors = Object.values(errors.value).some(error => error !== '')

  if (hasErrors || isLoading.value) return

  isLoading.value = true
  serverError.value = ''

  try {
    await axios.post('http://localhost:8080/api/auth/register', {
      username: `${firstName.value.trim()} ${lastName.value.trim()}`,
      email: email.value.trim(),
      studentEmail: email.value.trim(),
      password: password.value
    })

    router.push('/login')

  } catch (error: any) {
    console.error('Eroare la înregistrare:', error)

    if (axios.isAxiosError(error) && error.response) {
      serverError.value =
        error.response.data?.message ||
        'Something went wrong. Please try again later.'
    } else {
      serverError.value = 'Network error. Please check your connection.'
    }
  } finally {
    isLoading.value = false
  }
}

</script>

<template>
  <div class="relative z-10 w-full max-w-[90%] md:max-w-lg p-6 md:p-10 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
    
    <div class="text-center mb-8">
      <h1 class="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-rose-400 to-emerald-400 bg-[length:200%_auto] animate-gradient tracking-widest drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] pb-1 ml-2">
        Vibe Check
      </h1>
      <p class="text-slate-400 mt-2 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase">
        Create your student account
      </p>
    </div>

    <form class="space-y-4 md:space-y-5" @submit.prevent="handleRegister" novalidate>
      
      <!-- Nume și Prenume -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        <div>
          <label for="firstName" class="block text-sm font-medium text-slate-300 mb-1">First Name</label>
          <input 
            id="firstName"
            v-model="firstName"
            @blur="touched.firstName = true"
            type="text" 
            placeholder="John" 
            :disabled="isLoading"
            class="w-full px-4 py-3 bg-black/20 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
            :class="(touched.firstName && errors.firstName) ? 'border-rose-500 focus:ring-rose-500' : 'border-white/5 focus:ring-indigo-500'"
          />
          <p v-if="touched.firstName && errors.firstName" class="text-rose-400 text-xs mt-1.5">{{ errors.firstName }}</p>
        </div>
        <div>
          <label for="lastName" class="block text-sm font-medium text-slate-300 mb-1">Last Name</label>
          <input 
            id="lastName"
            v-model="lastName"
            @blur="touched.lastName = true"
            type="text" 
            placeholder="Doe" 
            :disabled="isLoading"
            class="w-full px-4 py-3 bg-black/20 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
            :class="(touched.lastName && errors.lastName) ? 'border-rose-500 focus:ring-rose-500' : 'border-white/5 focus:ring-indigo-500'"
          />
          <p v-if="touched.lastName && errors.lastName" class="text-rose-400 text-xs mt-1.5">{{ errors.lastName }}</p>
        </div>
      </div>

      <!-- Email -->
      <div>
        <label for="email" class="block text-sm font-medium text-slate-300 mb-1">Academic Email</label>
        <input 
          id="email"
          v-model="email"
          @blur="touched.email = true"
          type="email" 
          placeholder="name@stud.university.edu" 
          :disabled="isLoading"
          class="w-full px-4 py-3 bg-black/20 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
          :class="(touched.email && errors.email) ? 'border-rose-500 focus:ring-rose-500' : (touched.email && !errors.email) ? 'border-emerald-500/50 focus:ring-emerald-500' : 'border-white/5 focus:ring-indigo-500'"
        />
        <p v-if="touched.email && errors.email" class="text-rose-400 text-xs mt-1.5">{{ errors.email }}</p>
      </div>

      <!-- Phone -->
      <div>
        <label for="phone" class="block text-sm font-medium text-slate-300 mb-1">Phone Number <span class="text-slate-500 font-normal">(Optional)</span></label>
        <input 
          id="phone"
          v-model="phone"
          type="tel" 
          placeholder="+40 700 000 000" 
          :disabled="isLoading"
          class="w-full px-4 py-3 bg-black/20 border border-white/5 focus:ring-indigo-500 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
        />
      </div>

      <!-- Parolă -->
      <div>
        <label for="password" class="block text-sm font-medium text-slate-300 mb-1">Password</label>
        <div class="relative">
          <input 
            id="password"
            v-model="password"
            @focus="touched.password = true"
            :type="showPassword ? 'text' : 'password'" 
            placeholder="••••••••" 
            :disabled="isLoading"
            @keyup="checkCapsLock"
            class="w-full px-4 py-3 pr-10 bg-black/20 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
            :class="(touched.password && errors.password) ? 'border-amber-500/50 focus:ring-amber-500' : (touched.password && !errors.password) ? 'border-emerald-500/50 focus:ring-emerald-500' : 'border-white/5 focus:ring-indigo-500'"
          />
          <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
            <EyeOff v-if="showPassword" class="w-4 h-4" />
            <Eye v-else class="w-4 h-4" />
          </button>
        </div>

        <!-- Smart Password Indicator UI -->
        <div v-if="touched.password || password" class="mt-3">
          <div class="flex gap-1 mb-2">
            <div v-for="i in 4" :key="i" class="h-1 w-full rounded-full transition-colors duration-500"
                 :class="i <= passwordStrength ? strengthColor : 'bg-white/10'"></div>
          </div>
          <ul class="space-y-1.5 mt-2">
            <li v-for="(rule, index) in passwordRules" :key="index" class="text-[11px] flex items-center transition-colors duration-300" 
                :class="rule.met ? 'text-emerald-400' : 'text-slate-500'">
              <Check v-if="rule.met" class="w-3.5 h-3.5 mr-2" />
              <Circle v-else class="w-3 h-3 mr-2.5 opacity-40" />
              {{ rule.label }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Confirmare Parolă -->
      <div>
        <label for="confirmPassword" class="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
        <div class="relative">
          <input 
            id="confirmPassword"
            v-model="confirmPassword"
            @blur="touched.confirmPassword = true"
            :type="showConfirmPassword ? 'text' : 'password'" 
            placeholder="••••••••" 
            :disabled="isLoading"
            @keyup="checkCapsLock"
            class="w-full px-4 py-3 pr-10 bg-black/20 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
            :class="(touched.confirmPassword && errors.confirmPassword) ? 'border-rose-500 focus:ring-rose-500' : (touched.confirmPassword && !errors.confirmPassword && confirmPassword) ? 'border-emerald-500/50 focus:ring-emerald-500' : 'border-white/5 focus:ring-indigo-500'"
          />
          <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
            <EyeOff v-if="showConfirmPassword" class="w-4 h-4" />
            <Eye v-else class="w-4 h-4" />
          </button>
        </div>
        <p v-if="touched.confirmPassword && errors.confirmPassword" class="text-rose-400 text-xs mt-1.5">{{ errors.confirmPassword }}</p>
      </div>

      <transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 -translate-y-1" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-1">
        <p v-if="capsLockOn" class="text-amber-400 text-xs flex items-center mt-1">
          <AlertTriangle class="w-3.5 h-3.5 mr-1.5" /> Caps Lock is ON
        </p>
      </transition>

      <!-- Terms & Conditions -->
      <div class="flex flex-col mt-2">
        <label class="flex items-center text-xs md:text-sm text-slate-400 hover:text-slate-300 cursor-pointer transition-colors group relative">
          <input type="checkbox" v-model="acceptTerms" @change="touched.terms = true" :disabled="isLoading" class="sr-only peer" />
          <div class="mr-2.5 w-4.5 h-4.5 rounded flex shrink-0 items-center justify-center border transition-all duration-200 ease-in-out
                      peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-slate-900
                      bg-black/20 border-white/10 group-hover:border-white/30
                      peer-checked:bg-indigo-500 peer-checked:border-indigo-500"
               :class="(touched.terms && errors.terms) ? 'border-rose-500' : ''">
            <Check class="w-3.5 h-3.5 text-white stroke-[3] transition-transform duration-200 ease-out"
                   :class="acceptTerms ? 'scale-100 opacity-100' : 'scale-50 opacity-0'" />
          </div>
          I agree to the Terms of Service and Privacy Policy
        </label>
        <p v-if="touched.terms && errors.terms" class="text-rose-400 text-xs mt-1.5 ml-7">{{ errors.terms }}</p>
      </div>

      <transition enter-active-class="transition ease-out duration-300" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition ease-in duration-200" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-2">
        <div v-if="serverError" class="p-3 mt-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start">
          <AlertTriangle class="w-5 h-5 text-rose-400 mr-2 shrink-0 mt-0.5" />
          <p class="text-sm text-rose-400">{{ serverError }}</p>
        </div>
      </transition>
      
      <button 
        type="submit" 
        :disabled="isLoading"
        class="w-full flex items-center justify-center py-3 mt-6 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 ease-out hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
      >
        <Loader2 v-if="isLoading" class="w-5 h-5 mr-2 animate-spin" />
        {{ isLoading ? 'Creating account...' : 'Join Cliq' }}
      </button>
    </form>

    <p class="text-center text-xs md:text-sm text-slate-400 mt-6">
      Already have an account? 
      <router-link to="/login" class="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">Sign in here</router-link>
    </p>
  </div>
</template>

<style scoped>
@keyframes text-gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.animate-gradient {
  animation: text-gradient 8s ease infinite;
}
</style>