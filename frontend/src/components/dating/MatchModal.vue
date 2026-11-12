
<script setup lang="ts">
import { Heart, MessageCircle, X, Sparkles } from 'lucide-vue-next'

defineProps<{
  visible: boolean
  currentUserImage: string
  matchedUserImage: string
  matchedUserName: string
}>()

const emit = defineEmits<{
  (event: 'send-message'): void
  (event: 'continue'): void
}>()
</script>

<template>
  <div v-if="visible" class="match-overlay">

    <div class="match-modal">

      <button
        class="close-button"
        @click="emit('continue')"
        aria-label="Close"
      >
        <X :size="22" />
      </button>

      <Sparkles class="sparkle-icon" :size="35" />

      <h1>IT'S A MATCH!</h1>

      <p class="match-subtitle">
        You and {{ matchedUserName }} liked each other.
      </p>

      <div class="match-photos">

        <img
          :src="currentUserImage"
          alt="Your profile"
          class="match-photo first-photo"
        />

        <div class="heart-center">
          <Heart :size="29" fill="currentColor" />
        </div>

        <img
          :src="matchedUserImage"
          :alt="matchedUserName"
          class="match-photo second-photo"
        />

      </div>

      <p class="match-message">
        Maybe this is the beginning of something special.
      </p>

      <button
        class="message-button"
        @click="emit('send-message')"
      >
        <MessageCircle :size="19" />
        Send a Message
      </button>

      <button
        class="continue-button"
        @click="emit('continue')"
      >
        Keep Discovering
      </button>

    </div>

  </div>
</template>

<style scoped>
.match-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: rgba(9,11,24,0.85);
  backdrop-filter: blur(15px);
}

.match-modal {
  position: relative;
  width: 100%;
  max-width: 440px;
  padding: 45px 30px;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 28px;
  background: linear-gradient(
    145deg,
    #211323,
    #101222
  );
  text-align: center;
  color: white;
  box-shadow: 0 0 60px rgba(225,29,72,0.2);
  animation: appear 0.4s ease;
}

@keyframes appear {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.close-button {
  position: absolute;
  top: 17px;
  right: 17px;
  background: transparent;
  border: none;
  color: #aaa;
  cursor: pointer;
}

.sparkle-icon {
  color: #fda4af;
  margin-bottom: 12px;
}

.match-modal h1 {
  font-size: 35px;
  font-weight: 900;
  letter-spacing: 2px;
  color: #fb4777;
  margin: 0;
}

.match-subtitle {
  color: #ccc;
  font-size: 13px;
  margin: 12px 0 30px;
}

.match-photos {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  margin: 25px 0;
}

.match-photo {
  width: 125px;
  height: 125px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #fb4777;
  box-shadow: 0 0 25px rgba(225,29,72,0.3);
}

.first-photo {
  transform: rotate(-8deg);
}

.second-photo {
  transform: rotate(8deg);
  margin-left: -15px;
}

.heart-center {
  position: absolute;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 55px;
  height: 55px;
  border-radius: 50%;
  background: #e11d48;
  color: white;
  box-shadow: 0 0 25px rgba(225,29,72,0.7);
}

.match-message {
  color: #ccc;
  font-size: 13px;
  margin: 25px 0;
}

.message-button {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 15px;
  border: none;
  border-radius: 13px;
  background: #e11d48;
  color: white;
  font-weight: 700;
  cursor: pointer;
}

.message-button:hover {
  background: #be123c;
}

.continue-button {
  width: 100%;
  margin-top: 12px;
  padding: 13px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 13px;
  color: #ccc;
  cursor: pointer;
}

.continue-button:hover {
  background: rgba(255,255,255,0.07);
}
</style>
