
<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  MapPin,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  GraduationCap
} from 'lucide-vue-next'

interface DatingProfile {
  id: number
  name: string
  age: number
  university: string
  occupation: string
  distance: number
  bio: string
  interests: string[]
  photos: string[]
  verifiedStudent: boolean
  recentlyActive: boolean
}

const props = defineProps<{
  profile: DatingProfile
}>()

const currentPhoto = ref(0)
const showFullBio = ref(false)

const bioText = computed(() => {
  if (showFullBio.value || props.profile.bio.length <= 100) {
    return props.profile.bio
  }

  return props.profile.bio.slice(0, 100) + '...'
})

function nextPhoto() {
  if (currentPhoto.value < props.profile.photos.length - 1) {
    currentPhoto.value++
  } else {
    currentPhoto.value = 0
  }
}

function previousPhoto() {
  if (currentPhoto.value > 0) {
    currentPhoto.value--
  } else {
    currentPhoto.value = props.profile.photos.length - 1
  }
}
</script>

<template>
  <article class="profile-card">

    <!-- PROFILE PHOTO -->
    <img
      v-if="profile.photos.length > 0"
      class="profile-image"
      :src="profile.photos[currentPhoto]"
      :alt="`Photo of ${profile.name}`"
    />

    <!-- PHOTO NAVIGATION -->
    <div class="photo-navigation">

      <button
        v-for="(_, index) in profile.photos"
        :key="index"
        :class="{ selected: currentPhoto === index }"
        @click="currentPhoto = index"
        :aria-label="`Photo ${index + 1}`"
      ></button>

    </div>

    <button
      v-if="profile.photos.length > 1"
      class="photo-prev"
      @click="previousPhoto"
      aria-label="Previous photo"
    >
      <ChevronLeft :size="22" />
    </button>

    <button
      v-if="profile.photos.length > 1"
      class="photo-next"
      @click="nextPhoto"
      aria-label="Next photo"
    >
      <ChevronRight :size="22" />
    </button>

    <!-- PROFILE STATUS -->
    <div class="profile-status">

      <span v-if="profile.recentlyActive" class="activity-label">
        <span></span>
        Active recently
      </span>

    </div>

    <!-- PROFILE DETAILS -->
    <div class="profile-details">

      <div class="profile-name">
        <h2>{{ profile.name }}, {{ profile.age }}</h2>

        <ShieldCheck
          v-if="profile.verifiedStudent"
          class="verified-icon"
          :size="21"
        />
      </div>

      <div v-if="profile.verifiedStudent" class="verified-label">
        <GraduationCap :size="14" />
        Verified Student
      </div>

      <p class="profile-location">
        <MapPin :size="15" />
        {{ profile.distance }} km away
      </p>

      <p class="profile-university">
        {{ profile.university }} · {{ profile.occupation }}
      </p>

      <!-- INTERESTS -->
      <div class="profile-interests">

        <span
          v-for="interest in profile.interests"
          :key="interest"
        >
          {{ interest }}
        </span>

      </div>

      <!-- BIO -->
      <p class="profile-bio">
        {{ bioText }}

        <button
          v-if="profile.bio.length > 100"
          @click="showFullBio = !showFullBio"
        >
          {{ showFullBio ? 'Show less' : 'Read more' }}
        </button>
      </p>

    </div>

  </article>
</template>

<style scoped>
.profile-card {
  position: relative;
  width: 100%;
  max-width: 460px;
  height: 570px;
  border-radius: 25px;
  overflow: hidden;
  background: #202033;
  box-shadow: 0 15px 45px rgba(0,0,0,0.4);
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 35%;
}

.profile-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0,0,0,0.3),
    transparent 30%,
    rgba(0,0,0,0.9) 100%
  );
  pointer-events: none;
}

.photo-navigation {
  position: absolute;
  z-index: 2;
  top: 15px;
  left: 15px;
  right: 15px;
  display: flex;
  gap: 5px;
}

.photo-navigation button {
  height: 4px;
  flex: 1;
  border: none;
  border-radius: 5px;
  background: rgba(255,255,255,0.4);
  cursor: pointer;
}

.photo-navigation button.selected {
  background: white;
}

.photo-prev,
.photo-next {
  position: absolute;
  z-index: 2;
  top: 45%;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(0,0,0,0.35);
  color: white;
  cursor: pointer;
}

.photo-prev {
  left: 12px;
}

.photo-next {
  right: 12px;
}

.profile-status {
  position: absolute;
  z-index: 2;
  top: 32px;
  left: 18px;
}

.activity-label {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 11px;
  border-radius: 20px;
  background: rgba(0,0,0,0.45);
  color: white;
  font-size: 11px;
}

.activity-label span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
}

.profile-details {
  position: absolute;
  z-index: 2;
  bottom: 20px;
  left: 22px;
  right: 22px;
  color: white;
}

.profile-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.profile-name h2 {
  margin: 0 0 8px;
  font-size: 30px;
}

.verified-icon {
  color: #4ade80;
}

.verified-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  margin-bottom: 8px;
  border-radius: 20px;
  background: rgba(34,197,94,0.2);
  color: #86efac;
  font-size: 11px;
}

.profile-location {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ddd;
  font-size: 13px;
}

.profile-university {
  color: #ddd;
  font-size: 12px;
}

.profile-interests {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: 12px 0;
}

.profile-interests span {
  padding: 7px 11px;
  border-radius: 20px;
  background: rgba(255,255,255,0.18);
  font-size: 11px;
  backdrop-filter: blur(10px);
}

.profile-bio {
  font-size: 13px;
  line-height: 1.6;
  color: #eee;
}

.profile-bio button {
  background: transparent;
  border: none;
  color: #fda4af;
  cursor: pointer;
  font-weight: 600;
}

@media (max-width: 550px) {
  .profile-card {
    height: 500px;
  }
}
</style>
