
<script setup lang="ts">
import { Heart, Lock, Sparkles } from 'lucide-vue-next'

interface LikedProfile {
  id: number
  name: string
  image: string
  age: number
}

defineProps<{
  profiles: LikedProfile[]
  blurred?: boolean
}>()

const emit = defineEmits<{
  (event: 'like-back', profileId: number): void
}>()
</script>

<template>
  <section class="likes-page">

    <header class="likes-header">
      <div class="likes-title">
        <Heart :size="25" fill="currentColor" />
        <h1>Likes You</h1>
      </div>

      <p>
        These people have already shown interest in you.
      </p>
    </header>

    <div class="likes-summary">
      <Sparkles :size="20" />
      <span>
        {{ profiles.length }} people liked your profile
      </span>
    </div>

    <div v-if="profiles.length > 0" class="likes-grid">

      <article
        v-for="profile in profiles"
        :key="profile.id"
        class="liked-card"
      >

        <div class="liked-image-container">

          <img
            :src="profile.image"
            :alt="profile.name"
            :class="{ blurred: blurred }"
          />

          <div v-if="blurred" class="locked-overlay">
            <Lock :size="25" />
            <span>Unlock profile</span>
          </div>

        </div>

        <div class="liked-details">
          <h3>{{ blurred ? 'Someone likes you' : `${profile.name}, ${profile.age}` }}</h3>

          <button
            :disabled="blurred"
            @click="emit('like-back', profile.id)"
          >
            <Heart :size="15" />
            Like back
          </button>
        </div>

      </article>

    </div>

    <div v-else class="empty-likes">
      <Heart :size="40" />
      <h3>No likes yet</h3>
      <p>When someone likes your profile, they will appear here.</p>
    </div>

  </section>
</template>

<style scoped>
.likes-page {
  width: 100%;
  color: white;
  padding: 20px;
}

.likes-header {
  margin-bottom: 25px;
}

.likes-title {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fb4777;
}

.likes-title h1 {
  color: white;
  font-size: 26px;
}

.likes-header p {
  color: #999;
  font-size: 13px;
}

.likes-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  border: 1px solid rgba(225,29,72,0.25);
  border-radius: 13px;
  background: rgba(225,29,72,0.1);
  color: #fda4af;
  font-size: 13px;
  margin-bottom: 25px;
}

.likes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 18px;
}

.liked-card {
  overflow: hidden;
  border-radius: 17px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.05);
}

.liked-image-container {
  position: relative;
  height: 210px;
  overflow: hidden;
}

.liked-image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.liked-image-container img.blurred {
  filter: blur(15px);
  transform: scale(1.15);
}

.locked-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: white;
  background: rgba(0,0,0,0.15);
  font-size: 12px;
  font-weight: 700;
}

.liked-details {
  padding: 13px;
}

.liked-details h3 {
  font-size: 14px;
  margin: 0 0 12px;
}

.liked-details button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 10px;
  background: #e11d48;
  color: white;
  cursor: pointer;
}

.liked-details button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.empty-likes {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 60px 20px;
  color: #fb4777;
}

.empty-likes h3 {
  color: white;
}

.empty-likes p {
  color: #999;
  font-size: 13px;
}
</style>
