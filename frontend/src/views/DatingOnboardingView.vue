<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDatingStore } from '../stores/dating'

import {
  Camera,
  User,
  MapPin,
  GraduationCap,
  Heart,
  MessageCircle
} from 'lucide-vue-next'

const router = useRouter()
const datingStore = useDatingStore()
const name = ref('')
const age = ref<number | null>(null)
const location = ref('')
const bio = ref('')
const interests = ref<string[]>([])
const photos = ref<File[]>([])
const isStudent = ref(false)

const availableInterests = [
  'Music', 'Travel', 'Coffee', 'Gym',
  'Gaming', 'Reading', 'Photography',
  'Movies', 'Hiking', 'Cooking'
]

const bioCharacters = computed(() => bio.value.length)

interface Icebreaker {
  question: string
  answer: string
}

const availableIcebreakers = [
  'My perfect Sunday looks like...',
  'The quickest way to my heart is...',
  'A random fact about me...',
  'My biggest green flag is...',
  'I could talk for hours about...',
  'The best trip I ever took was...',
  'One thing on my bucket list...',
  'My ideal first date would be...'
]

const selectedIcebreakers = ref<Icebreaker[]>([])

const errors = ref({
  name: '',
  age: '',
  photos: '',
  bio: '',
  interests: '',
  icebreakers: ''
})

function toggleIcebreaker(question: string) {
  const existingIndex = selectedIcebreakers.value.findIndex(
    item => item.question === question
  )

  if (existingIndex !== -1) {
    selectedIcebreakers.value.splice(existingIndex, 1)
    return
  }

  if (selectedIcebreakers.value.length < 3) {
    selectedIcebreakers.value.push({
      question,
      answer: ''
    })
  }
}

function getPhotoUrl(file: File) {
  return window.URL.createObjectURL(file)
}

function handlePhotoUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (file && photos.value.length < 6) {
    photos.value.push(file)
  }

  input.value = ''
}

function toggleInterest(interest: string) {
  if (interests.value.includes(interest)) {
    interests.value = interests.value.filter(item => item !== interest)
  } else {
    interests.value.push(interest)
  }
}

function validateForm() {
  errors.value = {
    name: '',
    age: '',
    photos: '',
    bio: '',
    interests: '',
    icebreakers: ''
  }

  let isValid = true

  if (!name.value.trim()) {
    errors.value.name = 'Please enter your first name.'
    isValid = false
  }

  if (
    age.value === null ||
    !Number.isFinite(age.value) ||
    age.value < 18
  ) {
    errors.value.age = 'You must be at least 18 years old.'
    isValid = false
  }

  if (photos.value.length < 2) {
    errors.value.photos = 'Please upload at least 2 photos.'
    isValid = false
  }

  if (!bio.value.trim()) {
    errors.value.bio = 'Please write a short bio.'
    isValid = false
  }

  if (interests.value.length < 2) {
    errors.value.interests = 'Choose at least 2 interests.'
    isValid = false
  }

  if (
    selectedIcebreakers.value.length < 2 ||
    selectedIcebreakers.value.some(item => !item.answer.trim())
  ) {
    errors.value.icebreakers =
      'Choose and answer at least 2 icebreaker questions.'
    isValid = false
  }

  return isValid
}


function handleContinue() {
  if (!validateForm()) {
    return
  }

  const profilePhotos = photos.value.map(photo =>
    window.URL.createObjectURL(photo)
  )

  datingStore.saveProfile({
    name: name.value.trim(),
    age: age.value,
    location: location.value.trim(),
    bio: bio.value.trim(),
    interests: [...interests.value],
    photos: profilePhotos,
    icebreakers: selectedIcebreakers.value.map(item => ({
      question: item.question,
      answer: item.answer.trim()
    })),
    isStudent: isStudent.value
  })

  router.push('/dating')
}



</script>

<template>
  <main class="onboarding-page">
    <div class="onboarding-container">

      <header class="page-header">
        <div class="logo">
          <Heart :size="22" />
          <span>CLIQ</span>
        </div>

        <span class="step-label">CREATE YOUR DATING PROFILE</span>
      </header>

      <section class="intro">
        <span class="eyebrow">YOUR DATING LENS</span>
        <h1>Let's make your <span>connection.</span></h1>
        <p>Show people who you are. Your next great connection starts here.</p>
      </section>

      <section class="form-card">

        <!-- PHOTOS -->
        <div class="section-heading">
          <Camera :size="20" />
          <div>
            <h2>Your photos</h2>
            <p>Add at least 2 photos to continue.</p>
          </div>
        </div>

        <div class="photo-grid">
          <label
            v-for="index in 6"
            :key="index"
            class="photo-slot"
          >
            <Camera v-if="!photos[index - 1]" :size="25" />
            <span v-if="!photos[index - 1]">Add photo</span>

            <img
              v-else
              :src="getPhotoUrl(photos[index - 1])"
              alt="Profile photo"
            />

            <input
              type="file"
              accept="image/*"
              hidden
              @change="handlePhotoUpload"
            />
          </label>
        </div>

        <p v-if="errors.photos" class="error-message">
          {{ errors.photos }}
        </p>

        <!-- ABOUT YOU -->
        <div class="section-heading">
          <User :size="20" />
          <div>
            <h2>About you</h2>
            <p>Let people get to know you.</p>
          </div>
        </div>

        <div class="field">
          <label>First name</label>
          <input
            v-model="name"
            placeholder="Your first name"
          />
          <p v-if="errors.name" class="error-message">
            {{ errors.name }}
          </p>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Age</label>
            <input
              v-model.number="age"
              type="number"
              min="18"
              placeholder="18+"
            />
            <p v-if="errors.age" class="error-message">
              {{ errors.age }}
            </p>
          </div>

          <div class="field">
            <label>Location</label>
            <div class="input-icon">
              <MapPin :size="17" />
              <input
                v-model="location"
                placeholder="Your city"
              />
            </div>
          </div>
        </div>

        <div class="field">
          <label>Your bio</label>
          <textarea
            v-model="bio"
            maxlength="500"
            placeholder="Tell us a little about yourself..."
          ></textarea>

          <span class="character-count">
            {{ bioCharacters }}/500
          </span>

          <p v-if="errors.bio" class="error-message">
            {{ errors.bio }}
          </p>
        </div>

        <!-- INTERESTS -->
        <div class="section-heading">
          <Heart :size="20" />
          <div>
            <h2>Your interests</h2>
            <p>Choose the things you enjoy.</p>
          </div>
        </div>

        <div class="interest-list">
          <button
            v-for="interest in availableInterests"
            :key="interest"
            type="button"
            :class="{ selected: interests.includes(interest) }"
            @click="toggleInterest(interest)"
          >
            {{ interest }}
          </button>
        </div>

        <p v-if="errors.interests" class="error-message">
          {{ errors.interests }}
        </p>

        <!-- ICEBREAKERS -->
        <div class="section-heading">
          <MessageCircle :size="20" />
          <div>
            <h2>Your icebreakers</h2>
            <p>Choose 2–3 questions and tell people something about yourself.</p>
          </div>
        </div>

        <div class="icebreaker-counter">
          {{ selectedIcebreakers.length }}/3 questions selected
        </div>

        <div class="icebreaker-options">
          <button
            v-for="question in availableIcebreakers"
            :key="question"
            type="button"
            class="icebreaker-option"
            :class="{
              selected: selectedIcebreakers.some(
                item => item.question === question
              ),
              disabled:
                selectedIcebreakers.length === 3 &&
                !selectedIcebreakers.some(
                  item => item.question === question
                )
            }"
            @click="toggleIcebreaker(question)"
          >
            <span>{{ question }}</span>

            <span class="question-icon">
              {{
                selectedIcebreakers.some(
                  item => item.question === question
                ) ? '✓' : '+'
              }}
            </span>
          </button>
        </div>

        <div
          v-for="item in selectedIcebreakers"
          :key="item.question"
          class="icebreaker-answer"
        >
          <label>{{ item.question }}</label>

          <textarea
            v-model="item.answer"
            maxlength="200"
            placeholder="Write your answer..."
          ></textarea>

          <span class="character-count">
            {{ item.answer.length }}/200
          </span>
        </div>

        <p v-if="errors.icebreakers" class="error-message">
          {{ errors.icebreakers }}
        </p>

        <!-- STUDENT STATUS -->
        <div class="student-option">
          <div class="student-icon">
            <GraduationCap :size="22" />
          </div>

          <div class="student-text">
            <strong>I'm a student</strong>
            <span>
              Verify your university status to unlock student features.
            </span>
          </div>

          <input v-model="isStudent" type="checkbox" />
        </div>

        <!-- CONTINUE -->
        <button
          class="continue-button"
          type="button"
          @click="handleContinue"
        >
          Continue
          <span>→</span>
        </button>

      </section>

      <p class="footer-note">
        Your profile, your rules. You control what you share.
      </p>

    </div>
  </main>
</template>

<style scoped>
.onboarding-page {
  min-height: 100vh;
  background: #020617;
  color: #f8fafc;
  padding: 35px 20px 60px;
  font-family: Inter, sans-serif;
}

.onboarding-container {
  max-width: 720px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 55px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #fb7185;
  font-size: 23px;
  font-weight: 900;
}

.step-label,
.eyebrow {
  color: #fb7185;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
}

.intro {
  margin-bottom: 30px;
}

.intro h1 {
  font-size: clamp(32px, 6vw, 48px);
  margin: 12px 0;
  letter-spacing: -1.5px;
}

.intro h1 span {
  color: #fb7185;
}

.intro p,
.section-heading p {
  color: #94a3b8;
  font-size: 14px;
}

.form-card {
  padding: 30px;
  border: 1px solid #334155;
  border-radius: 22px;
  background: rgba(15, 23, 42, 0.85);
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 13px;
  color: #fb7185;
  margin-top: 12px;
}

.section-heading h2 {
  color: #f8fafc;
  font-size: 17px;
  margin: 0 0 5px;
}

.section-heading p {
  margin: 0;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.photo-slot {
  min-height: 130px;
  border: 1px dashed #475569;
  border-radius: 13px;
  background: #1e293b;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
  overflow: hidden;
}

.photo-slot img {
  width: 100%;
  height: 130px;
  object-fit: cover;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 9px;
  flex: 1;
}

.field label,
.icebreaker-answer label {
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 600;
}

.field input,
.field textarea,
.icebreaker-answer textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid #334155;
  background: #0f172a;
  color: white;
  outline: none;
  font: inherit;
}

.field input:focus,
.field textarea:focus,
.icebreaker-answer textarea:focus {
  border-color: #fb7185;
}

.field textarea,
.icebreaker-answer textarea {
  min-height: 115px;
  resize: vertical;
}

.field-row {
  display: flex;
  gap: 15px;
}

.input-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon svg {
  position: absolute;
  left: 12px;
  color: #94a3b8;
}

.input-icon input {
  padding-left: 38px;
}

.character-count {
  align-self: flex-end;
  color: #64748b;
  font-size: 11px;
}

.interest-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.interest-list button {
  border: 1px solid #475569;
  background: #1e293b;
  color: #cbd5e1;
  padding: 10px 16px;
  border-radius: 30px;
  cursor: pointer;
}

.interest-list button.selected {
  background: rgba(225, 29, 72, 0.2);
  border-color: #e11d48;
  color: #fda4af;
}

/* ICEBREAKERS */

.icebreaker-counter {
  color: #fb7185;
  font-size: 12px;
  font-weight: 700;
}

.icebreaker-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.icebreaker-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #334155;
  border-radius: 12px;
  background: #0f172a;
  color: #cbd5e1;
  text-align: left;
  font-size: 13px;
  cursor: pointer;
  transition: 0.2s;
}

.icebreaker-option:hover {
  border-color: #fb7185;
}

.icebreaker-option.selected {
  background: rgba(225, 29, 72, 0.12);
  border-color: #e11d48;
  color: #fda4af;
}

.icebreaker-option.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.question-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  background: #1e293b;
  color: #fb7185;
  font-weight: 800;
}

.icebreaker-answer {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 17px;
  border: 1px solid #334155;
  border-radius: 13px;
  background: #1e293b;
}

.student-option {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 17px;
  background: #1e293b;
  border-radius: 13px;
}

.student-icon {
  color: #fb7185;
}

.student-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.student-text strong {
  font-size: 14px;
}

.student-text span {
  color: #94a3b8;
  font-size: 12px;
}

.student-option input {
  accent-color: #e11d48;
  width: 18px;
  height: 18px;
}

.error-message {
  color: #f87171;
  font-size: 12px;
  margin: -12px 0 0;
}

.continue-button {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(100deg, #be123c, #e11d48);
  color: white;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
}

.continue-button:hover {
  opacity: 0.9;
}

.footer-note {
  text-align: center;
  color: #64748b;
  font-size: 12px;
  margin-top: 25px;
}

@media (max-width: 550px) {
  .form-card {
    padding: 20px;
  }

  .field-row {
    flex-direction: column;
  }

  .photo-slot {
    min-height: 100px;
  }

  .photo-slot img {
    height: 100px;
  }

  .step-label {
    font-size: 9px;
  }
}
</style>
