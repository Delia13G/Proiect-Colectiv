
<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, SlidersHorizontal, RotateCcw } from 'lucide-vue-next'

interface DatingFilters {
  minAge: number
  maxAge: number
  maxDistance: number
  interests: string[]
  verifiedStudentsOnly: boolean
  sameUniversityOnly: boolean
  isPaused: boolean
}

const props = defineProps<{
  visible: boolean
  isVerifiedStudent: boolean
  initialFilters: DatingFilters
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'apply', filters: DatingFilters): void
}>()

const interestsList = [
  'Gaming',
  'Gym',
  'Travel',
  'Coffee',
  'Hiking',
  'Music',
  'Reading',
  'Photography'
]

const filters = ref<DatingFilters>({ ...props.initialFilters })

watch(
  () => props.initialFilters,
  (value) => {
    filters.value = { ...value, interests: [...value.interests] }
  },
  { deep: true }
)

function toggleInterest(interest: string) {
  if (filters.value.interests.includes(interest)) {
    filters.value.interests = filters.value.interests.filter(
      item => item !== interest
    )
  } else {
    filters.value.interests.push(interest)
  }
}

function resetFilters() {
  filters.value = {
    minAge: 18,
    maxAge: 30,
    maxDistance: 50,
    interests: [],
    verifiedStudentsOnly: false,
    sameUniversityOnly: false,
    isPaused: false
  }
}

function applyFilters() {
  emit('apply', {
    ...filters.value,
    interests: [...filters.value.interests]
  })

  emit('close')
}
</script>

<template>
  <div v-if="visible" class="drawer-overlay" @click.self="emit('close')">

    <aside class="filter-drawer">

      <!-- HEADER -->
      <header class="drawer-header">

        <div>
          <div class="drawer-title">
            <SlidersHorizontal :size="21" />
            <h2>Match Preferences</h2>
          </div>

          <p>Customize your discovery experience.</p>
        </div>

        <button class="close-button" @click="emit('close')">
          <X :size="22" />
        </button>

      </header>

      <div class="drawer-content">

        <!-- PAUSE PROFILE -->
        <section class="filter-section pause-section">

          <div class="section-title">
            <div>
              <h3>Pause Profile</h3>
              <p>Hide your profile from Dating discovery.</p>
            </div>

            <input
              v-model="filters.isPaused"
              type="checkbox"
              class="toggle"
            />
          </div>

        </section>

        <!-- AGE RANGE -->
        <section class="filter-section">

          <div class="section-title">
            <h3>Age Range</h3>

            <span class="range-value">
              {{ filters.minAge }} - {{ filters.maxAge }}
            </span>
          </div>

          <div class="range-inputs">

            <label>
              <span>Minimum age</span>
              <input
                v-model.number="filters.minAge"
                type="range"
                min="18"
                max="60"
              />
              <strong>{{ filters.minAge }}</strong>
            </label>

            <label>
              <span>Maximum age</span>
              <input
                v-model.number="filters.maxAge"
                type="range"
                min="18"
                max="60"
              />
              <strong>{{ filters.maxAge }}</strong>
            </label>

          </div>

        </section>

        <!-- DISTANCE -->
        <section class="filter-section">

          <div class="section-title">
            <h3>Maximum Distance</h3>
            <span class="range-value">
              {{ filters.maxDistance }} km
            </span>
          </div>

          <input
            v-model.number="filters.maxDistance"
            type="range"
            min="1"
            max="200"
            class="range-slider"
          />

          <div class="range-labels">
            <span>1 km</span>
            <span>200 km</span>
          </div>

        </section>

        <!-- INTERESTS -->
        <section class="filter-section">

          <div class="section-title">
            <h3>Interests</h3>
          </div>

          <p class="section-description">
            Find people who share your interests.
          </p>

          <div class="interests-grid">

            <button
              v-for="interest in interestsList"
              :key="interest"
              :class="{
                selected: filters.interests.includes(interest)
              }"
              @click="toggleInterest(interest)"
            >
              {{ interest }}
            </button>

          </div>

        </section>

        <!-- STUDENT FILTERS -->
        <section class="filter-section">

          <div class="section-title">
            <h3>Student Preferences</h3>
          </div>

          <p class="section-description">
            Optional academic filters.
          </p>

          <div class="student-option">

            <div>
              <h4>Verified students only</h4>
              <p>Show academically verified profiles.</p>
            </div>

            <input
              v-model="filters.verifiedStudentsOnly"
              type="checkbox"
              :disabled="!isVerifiedStudent"
              class="toggle"
            />

          </div>

          <div class="student-option">

            <div>
              <h4>Same university</h4>
              <p>Only people from your university.</p>
            </div>

            <input
              v-model="filters.sameUniversityOnly"
              type="checkbox"
              :disabled="!isVerifiedStudent"
              class="toggle"
            />

          </div>

          <p v-if="!isVerifiedStudent" class="verification-notice">
            Verify your student email to unlock academic filters.
          </p>

        </section>

      </div>

      <!-- FOOTER -->
      <footer class="drawer-footer">

        <button class="reset-button" @click="resetFilters">
          <RotateCcw :size="16" />
          Reset
        </button>

        <button class="apply-button" @click="applyFilters">
          Apply Filters
        </button>

      </footer>

    </aside>

  </div>
</template>

<style scoped>
.drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(5px);
}

.filter-drawer {
  display: flex;
  flex-direction: column;
  width: 430px;
  max-width: 100%;
  height: 100%;
  background: #101222;
  border-left: 1px solid rgba(255,255,255,0.1);
  color: white;
  animation: slide-in 0.25s ease;
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 25px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.drawer-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fb4777;
}

.drawer-title h2 {
  color: white;
  font-size: 19px;
  margin: 0;
}

.drawer-header p {
  color: #999;
  font-size: 12px;
}

.close-button {
  background: transparent;
  border: none;
  color: #aaa;
  cursor: pointer;
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px 25px;
}

.filter-section {
  padding: 20px 0;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.section-title h3 {
  font-size: 14px;
  margin: 0;
}

.section-title p,
.section-description {
  color: #999;
  font-size: 11px;
}

.range-value {
  color: #fb4777;
  font-size: 13px;
  font-weight: 700;
}

.range-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 15px;
}

.range-inputs label {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.range-inputs label span,
.range-labels {
  color: #999;
  font-size: 11px;
}

.range-inputs input,
.range-slider {
  width: 100%;
  accent-color: #e11d48;
  cursor: pointer;
}

.range-inputs strong {
  color: white;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
}

.interests-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 15px;
}

.interests-grid button {
  padding: 9px 14px;
  border-radius: 20px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: #ccc;
  cursor: pointer;
}

.interests-grid button.selected {
  background: rgba(225,29,72,0.2);
  border-color: #e11d48;
  color: #fda4af;
}

.student-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-top: 18px;
}

.student-option h4 {
  font-size: 12px;
  margin: 0 0 5px;
}

.student-option p {
  font-size: 11px;
  color: #999;
  margin: 0;
}

.toggle {
  width: 38px;
  height: 20px;
  accent-color: #e11d48;
  cursor: pointer;
  flex-shrink: 0;
}

.toggle:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.verification-notice {
  color: #fda4af;
  font-size: 11px;
  margin-top: 15px;
}

.drawer-footer {
  display: flex;
  gap: 12px;
  padding: 20px 25px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.reset-button,
.apply-button {
  padding: 13px;
  border-radius: 11px;
  cursor: pointer;
  font-weight: 600;
}

.reset-button {
  display: flex;
  align-items: center;
  gap: 7px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
}

.apply-button {
  flex: 1;
  background: #e11d48;
  border: none;
  color: white;
}

.apply-button:hover {
  background: #be123c;
}
</style>
