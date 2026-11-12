
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface DatingIcebreaker {
  question: string
  answer: string
}

export interface DatingProfile {
  name: string
  age: number | null
  location: string
  bio: string
  interests: string[]
  photos: string[]
  icebreakers: DatingIcebreaker[]
  isStudent: boolean
}

export const useDatingStore = defineStore('dating', () => {
  const profile = ref<DatingProfile | null>(null)

  const isProfileComplete = ref(false)

  function saveProfile(newProfile: DatingProfile) {
    profile.value = newProfile
    isProfileComplete.value = true
  }

  function clearProfile() {
    profile.value = null
    isProfileComplete.value = false
  }

  return {
    profile,
    isProfileComplete,
    saveProfile,
    clearProfile
  }
})
