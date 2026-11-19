<!-- src/components/chat/MainChatView.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { UploadCloud } from 'lucide-vue-next';
import ChatHeader from './ChatHeader.vue';
import MessageBubble from './MessageBubble.vue';
import ChatInput from './ChatInput.vue';
import type { ChatMessage, ChatTheme } from '../../types/chat';

const props = defineProps<{ activeLens: 'PRO' | 'SOCIAL' | 'DATE', chatId?: number }>();

const theme = computed<ChatTheme>(() => {
  switch (props.activeLens) {
    case 'DATE': return { text: 'text-rose-500', bg: 'bg-rose-500', bgLight: 'bg-rose-500/10', border: 'border-rose-500/30', hover: 'hover:bg-rose-500/20' };
    case 'SOCIAL': return { text: 'text-emerald-500', bg: 'bg-emerald-500', bgLight: 'bg-emerald-500/10', border: 'border-emerald-500/30', hover: 'hover:bg-emerald-500/20' };
    case 'PRO': default: return { text: 'text-indigo-500', bg: 'bg-indigo-500', bgLight: 'bg-indigo-500/10', border: 'border-indigo-500/30', hover: 'hover:bg-indigo-500/20' };
  }
});

const currentChat = ref({ name: 'Andreea', avatar: 'https://i.pravatar.cc/150?img=16', status: 'Online', isTyping: false });
const messages = ref<ChatMessage[]>([]);
const scrollContainerRef = ref<HTMLElement | null>(null);
const chatInputRef = ref<InstanceType<typeof ChatInput> | null>(null); // Legătura cu ChatInput

const replyingTo = ref<ChatMessage | null>(null);
const editingMessage = ref<ChatMessage | null>(null);
const isDragging = ref(false);

// --- Funcții de Drag & Drop (FIX BUG TEXT & IMAGINI) ---
const onDragOver = (e: DragEvent) => { 
  // Oprim declanșarea overlay-ului dacă draghezi doar un Text selectat cu mouse-ul
  if (!e.dataTransfer?.types.includes('Files')) return;
  e.preventDefault(); 
  isDragging.value = true; 
};

const onDragLeave = (e: DragEvent) => { 
  e.preventDefault(); 
  isDragging.value = false; 
};

const onDrop = (e: DragEvent) => {
  e.preventDefault();
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  // Trimitem fișierele dropped direct în zona de "Staging" din ChatInput
  if (files && files.length > 0 && chatInputRef.value) {
    (chatInputRef.value as unknown as { addFilesToStage: (files: File[]) => void })
      .addFilesToStage(Array.from(files));
  }
};

// --- Handler General Trimitere (FIX RENDERING DOCUMENTE/AUDIO) ---
const handleSend = (payload: any) => {
  // Construim mesajul de bază
  const newMsg: ChatMessage = {
    id: Date.now(),
    text: payload.text || '', // Poate fi text simplu sau caption la o poză
    isMine: true,
    timestamp: new Date(),
    status: 'sent',
    type: payload.type,
    replyToId: replyingTo.value?.id
  };

  // Atașăm Preview-urile locale pentru fișiere și Audio
  if (payload.type === 'audio') {
    newMsg.attachment = URL.createObjectURL(payload.file);
    const m = Math.floor(payload.duration / 60);
    const s = payload.duration % 60;
    newMsg.duration = `${m}:${s < 10 ? '0' : ''}${s}`;
  } else if (payload.type === 'image' || payload.type === 'file') {
    newMsg.attachment = URL.createObjectURL(payload.file);
  }

  // Modificare (Edit) vs Trimitere nouă
  if (editingMessage.value && payload.type === 'text') {
    const msg = messages.value.find(m => m.id === editingMessage.value!.id);
    if (msg) { msg.text = payload.text; msg.isEdited = true; }
  } else {
    messages.value.push(newMsg);
  }
  
  // Resetări
  replyingTo.value = null;
  editingMessage.value = null;
  
  // Scroll automat la noul mesaj
  setTimeout(() => {
    if (scrollContainerRef.value) {
      scrollContainerRef.value.scrollTo({ top: scrollContainerRef.value.scrollHeight, behavior: 'smooth' });
    }
  }, 100);
};

// Handlers Reacții & Ștergere
const handleReact = ({ messageId, emoji }: { messageId: number, emoji: string }) => {
  const msg = messages.value.find(m => m.id === messageId);
  if (!msg) return;
  if (!msg.reactions) msg.reactions = {};
  const isSameReaction = msg.reactions[emoji] === 'me';
  for (const key in msg.reactions) if (msg.reactions[key] === 'me') delete msg.reactions[key];
  if (!isSameReaction) msg.reactions[emoji] = 'me';
};

const handleDelete = (msg: ChatMessage) => {
  const target = messages.value.find(m => m.id === msg.id);
  if (target) target.isDeleted = true;
};
</script>

<template>
  <div class="flex-1 flex flex-col h-full bg-slate-950/40 relative" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop">
    
    <!-- Drag & Drop Overlay -->
    <transition name="fade">
      <div v-if="isDragging" class="absolute inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed rounded-xl m-4 pointer-events-none" :class="theme.border">
        <UploadCloud :class="theme.text" :size="64" class="mb-4 animate-bounce"/>
        <h2 class="text-2xl font-bold text-white mb-2">Drop files to upload</h2>
      </div>
    </transition>

    <ChatHeader :theme="theme" :user="currentChat"/>

    <main ref="scrollContainerRef" class="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-5 scrollbar-hide scroll-smooth">
      <MessageBubble 
        v-for="msg in messages" 
        :key="msg.id" 
        :message="msg" 
        :partnerName="currentChat.name" 
        :replyMessage="messages.find(m => m.id === msg.replyToId)"
        :theme="theme"
        @react="handleReact"
        @reply="replyingTo = $event"
        @edit="editingMessage = $event"
        @delete="handleDelete"
      />
    </main>

    <!-- Legătura cu ChatInput via ref -->
    <ChatInput 
      ref="chatInputRef"
      :editingMessage="editingMessage" 
      :replyingTo="replyingTo" 
      :theme="theme" 
      @cancel-action="replyingTo = null; editingMessage = null" 
      @send="handleSend" 
      @typing="currentChat.isTyping = $event"
    />
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>