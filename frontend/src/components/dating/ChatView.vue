
<script setup lang="ts">
import { ref } from 'vue'
import { ArrowLeft, Send } from 'lucide-vue-next'

const props = defineProps<{
  contactName: string
  contactImage: string
}>()

const emit = defineEmits<{
  back: []
}>()

interface Message {
  id: number
  text: string
  sentByMe: boolean
}

const messages = ref<Message[]>([
  {
    id: 1,
    text: `Hey! Mă bucur că am făcut match! 😊`,
    sentByMe: false
  },
  {
    id: 2,
    text: 'Și eu! Cum îți merge ziua?',
    sentByMe: true
  }
])

const newMessage = ref('')

function sendMessage() {
  const text = newMessage.value.trim()

  if (!text) return

  messages.value.push({
    id: Date.now(),
    text,
    sentByMe: true
  })

  newMessage.value = ''
}
</script>

<template>
  <div class="chat-container">
    <header class="chat-header">
      <button class="back-button" @click="emit('back')">
        <ArrowLeft :size="22" />
      </button>

      <img :src="props.contactImage" :alt="props.contactName" />

      <div class="contact-info">
        <h2>{{ props.contactName }}</h2>
        <span>Matched with you ❤️</span>
      </div>
    </header>

    <div class="messages">
      <div
        v-for="message in messages"
        :key="message.id"
        class="message"
        :class="message.sentByMe ? 'sent' : 'received'"
      >
        {{ message.text }}
      </div>
    </div>

    <form class="message-form" @submit.prevent="sendMessage">
      <input
        v-model="newMessage"
        type="text"
        placeholder="Write a message..."
      />

      <button type="submit" :disabled="!newMessage.trim()">
        <Send :size="20" />
      </button>
    </form>
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
  background: #0f172a;
  color: white;
  border: 1px solid #334155;
  border-radius: 16px;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border-bottom: 1px solid #334155;
}

.back-button {
  color: white;
  background: transparent;
  border: none;
  cursor: pointer;
}

.chat-header img {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  object-fit: cover;
}

.contact-info h2 {
  font-size: 16px;
  font-weight: 600;
}

.contact-info span {
  color: #fda4af;
  font-size: 12px;
}

.messages {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  overflow-y: auto;
}

.message {
  max-width: 75%;
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
}

.sent {
  align-self: flex-end;
  background: #be123c;
  border-bottom-right-radius: 4px;
}

.received {
  align-self: flex-start;
  background: #334155;
  border-bottom-left-radius: 4px;
}

.message-form {
  display: flex;
  gap: 10px;
  padding: 16px;
  border-top: 1px solid #334155;
}

.message-form input {
  flex: 1;
  min-width: 0;
  padding: 12px 16px;
  color: white;
  background: #1e293b;
  border: 1px solid #475569;
  border-radius: 24px;
  outline: none;
}

.message-form button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: white;
  background: #e11d48;
  border: none;
  border-radius: 50%;
  cursor: pointer;
}

.message-form button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
