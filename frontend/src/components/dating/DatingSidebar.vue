
<script setup lang="ts">
import { ShieldCheck, Settings, Heart } from 'lucide-vue-next'
import { useDatingStore } from '../../stores/dating'

const datingStore = useDatingStore()

interface Match {
  id: number
  name: string
  image: string
}

interface Chat {
  id: number
  name: string
  message: string
  image: string
  unread: boolean
}

const props = defineProps<{
  matches: Match[]
  chats: Chat[]
  likesCount: number
}>()

const emit = defineEmits<{
  (event: 'open-chat', chatId: number): void
  (event: 'open-likes'): void
}>()
</script>

<template>
  <aside class="dating-sidebar">

    <!-- USER PROFILE -->
    <section class="user-profile">

<div class="user-avatar">
  <img
    :src="
      datingStore.profile?.photos[0] ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
    "
    alt="User profile"
  />

  <span class="online-indicator"></span>
</div>

<div class="user-info">
  <div class="user-name">
    <h3>{{ datingStore.profile?.name || 'Your profile' }}</h3>

    <ShieldCheck
      v-if="datingStore.profile?.isStudent"
      :size="16"
    />
  </div>

  <p>
    {{ datingStore.profile?.isStudent ? 'Student' : 'Dating profile' }}
  </p>
</div>

      <button class="settings-button" title="Profile settings">
        <Settings :size="19" />
      </button>

    </section>

    <!-- LIKES YOU -->
    <button class="likes-you-card" @click="emit('open-likes')">

      <div class="likes-icon">
        <Heart :size="20" />
      </div>

      <div class="likes-text">
        <h3>Likes You</h3>
        <p>{{ likesCount }} people like you</p>
      </div>

      <span class="likes-count">{{ likesCount }}</span>

    </button>

    <!-- NEW MATCHES -->
    <section class="sidebar-section">

      <div class="section-heading">
        <h2>NEW MATCHES</h2>
        <span>{{ matches.length }}</span>
      </div>

      <div v-if="matches.length > 0" class="matches-list">

        <button
          v-for="match in matches"
          :key="match.id"
          class="match-item"
          @click="emit('open-chat', match.id)"
        >

          <div class="match-avatar">
            <img :src="match.image" :alt="match.name" />
          </div>

          <p>{{ match.name }}</p>

        </button>

      </div>

      <p v-else class="empty-text">
        No new matches yet.
      </p>

    </section>

    <!-- ACTIVE CHATS -->
    <section class="sidebar-section">

      <div class="section-heading">
        <h2>ACTIVE CHATS</h2>
        <span>{{ chats.length }}</span>
      </div>

      <div v-if="chats.length > 0">

        <button
          v-for="chat in chats"
          :key="chat.id"
          class="chat-item"
          @click="emit('open-chat', chat.id)"
        >

          <img :src="chat.image" :alt="chat.name" />

          <div class="chat-info">
            <h3>{{ chat.name }}</h3>
            <p>{{ chat.message }}</p>
          </div>

          <span
            v-if="chat.unread"
            class="unread-dot"
          ></span>

        </button>

      </div>

      <p v-else class="empty-text">
        No active conversations.
      </p>

    </section>

  </aside>
</template>

<style scoped>
.dating-sidebar {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
}

.user-profile,
.sidebar-section {
  background: rgba(255,255,255,0.045);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 17px;
  padding: 17px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  position: relative;
}

.user-avatar img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.online-indicator {
  position: absolute;
  right: 0;
  bottom: 2px;
  width: 11px;
  height: 11px;
  border: 2px solid #090b18;
  border-radius: 50%;
  background: #22c55e;
}

.user-info {
  flex: 1;
}

.user-name {
  display: flex;
  align-items: center;
  gap: 5px;
}

.user-name h3 {
  font-size: 14px;
  margin: 0;
}

.user-name svg {
  color: #4ade80;
}

.user-info p {
  color: #999;
  font-size: 11px;
  margin: 5px 0 0;
}

.settings-button {
  background: transparent;
  border: none;
  color: #999;
  cursor: pointer;
}

.settings-button:hover {
  color: white;
}

.likes-you-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid rgba(225,29,72,0.35);
  border-radius: 17px;
  background: linear-gradient(
    120deg,
    rgba(225,29,72,0.2),
    rgba(190,18,60,0.05)
  );
  color: white;
  text-align: left;
  cursor: pointer;
}

.likes-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  background: rgba(225,29,72,0.25);
  color: #fb4777;
  border-radius: 12px;
}

.likes-text {
  flex: 1;
}

.likes-text h3 {
  font-size: 14px;
  margin: 0 0 5px;
}

.likes-text p {
  font-size: 11px;
  color: #aaa;
  margin: 0;
}

.likes-count {
  background: #e11d48;
  padding: 5px 9px;
  border-radius: 20px;
  font-size: 12px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 17px;
}

.section-heading h2 {
  font-size: 12px;
  letter-spacing: 1px;
  margin: 0;
}

.section-heading span {
  color: #fb4777;
  font-size: 12px;
}

.matches-list {
  display: flex;
  gap: 12px;
  overflow-x: auto;
}

.match-item {
  min-width: 55px;
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  text-align: center;
}

.match-avatar {
  padding: 3px;
  border: 2px solid #fb4777;
  border-radius: 50%;
  margin-bottom: 6px;
}

.match-avatar img {
  width: 43px;
  height: 43px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

.match-item p {
  font-size: 11px;
  color: #ccc;
  margin: 0;
}

.chat-item {
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  padding: 10px 0;
  background: transparent;
  border: none;
  color: white;
  text-align: left;
  cursor: pointer;
}

.chat-item:hover {
  background: rgba(255,255,255,0.04);
}

.chat-item img {
  width: 43px;
  height: 43px;
  border-radius: 50%;
  object-fit: cover;
}

.chat-info {
  flex: 1;
  min-width: 0;
}

.chat-info h3 {
  font-size: 13px;
  margin: 0 0 5px;
}

.chat-info p {
  color: #999;
  font-size: 11px;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unread-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #fb4777;
}

.empty-text {
  color: #777;
  font-size: 12px;
  text-align: center;
  padding: 10px 0;
}
</style>
