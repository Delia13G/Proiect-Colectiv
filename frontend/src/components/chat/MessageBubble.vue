<!-- src/components/chat/MessageBubble.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Play, Pause, Reply, Trash2, Edit2, ChevronDown, Ban, Copy, Link as LinkIcon, Check, CheckCheck, FileText, Download } from 'lucide-vue-next';
import type { ChatMessage, ChatTheme } from '../../types/chat';

const props = defineProps<{
  message: ChatMessage;
  theme: ChatTheme;
  replyMessage?: ChatMessage; 
  partnerName: string;
}>();

const emit = defineEmits(['react', 'reply', 'edit', 'delete']);

// --- STATE PENTRU MENIU ---
const isMenuOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);

const toggleMenu = (e: Event) => {
  e.stopPropagation(); // Prevenim propagarea pentru a nu declanșa imediat `closeMenu`
  isMenuOpen.value = !isMenuOpen.value;
};

const closeMenu = (e?: Event) => {
  // Dacă s-a dat click în afara meniului, îl închidem
  if (e && menuRef.value && menuRef.value.contains(e.target as Node)) return;
  isMenuOpen.value = false;
};

// --- STATE PENTRU AUDIO PLAYER ---
const audioRef = ref<HTMLAudioElement | null>(null);
const isPlayingAudio = ref(false);
const audioProgress = ref(0); // Procent 0 - 100

const toggleAudio = () => {
  if (!audioRef.value) return;
  if (isPlayingAudio.value) {
    audioRef.value.pause();
  } else {
    audioRef.value.play();
  }
};

const onAudioTimeUpdate = () => {
  if (!audioRef.value) return;
  audioProgress.value = (audioRef.value.currentTime / audioRef.value.duration) * 100 || 0;
};

const onAudioEnded = () => {
  isPlayingAudio.value = false;
  audioProgress.value = 0;
};

// --- PARSARE TEXT AVANSATĂ ---
const parsedContent = computed(() => {
  if (!props.message.text) return [];
  const parts = props.message.text.split(/(```[\s\S]*?```)/g);
  return parts.map(part => {
    if (part.startsWith('```') && part.endsWith('```')) {
      return { type: 'code', content: part.replace(/```/g, '').trim() };
    }
    // Regex îmbunătățit: exclude semnele de punctuație de la finalul link-ului
    const urlRegex = /(https?:\/\/[^\s]+[^.,;:?!"')])/g;
    if (urlRegex.test(part)) {
      return { type: 'link', content: part, url: part.match(urlRegex)?.[0] };
    }
    return { type: 'text', content: part };
  });
});

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  if (navigator.vibrate) navigator.vibrate(30);
};

// --- FORMATĂRI ȘI REACȚII ---
const formatTimestamp = (dateInput: Date | string | number) => {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

// Transformăm obiectul de reacții într-un format pregătit pentru grupuri (ex: "👍 3")
const formattedReactions = computed(() => {
  if (!props.message.reactions) return [];
  return Object.entries(props.message.reactions).map(([emoji, users]) => {
    // În pregătire pentru structura de grup: dacă users e array de ID-uri, arătăm count-ul. Altfel 1.
    const count = Array.isArray(users) ? users.length : 1;
    const isMe = Array.isArray(users) ? users.includes('me') : users === 'me';
    return { emoji, count, isMe };
  });
});

const handleReaction = (emoji: string) => {
  emit('react', { messageId: props.message.id, emoji });
  closeMenu();
};

const triggerAction = (action: 'reply' | 'edit' | 'delete') => {
  emit(action, props.message);
  closeMenu();
};

// Curățăm event listener-ul când mesajul e distrus
onMounted(() => document.addEventListener('click', closeMenu));
onUnmounted(() => document.removeEventListener('click', closeMenu));
</script>

<template>
  <div class="flex w-full" :class="message.isMine ? 'justify-end' : 'justify-start'">
    <div class="max-w-[85%] md:max-w-[70%] flex flex-col gap-1 relative group" :class="message.isMine ? 'items-end' : 'items-start'">
      
      <div class="flex items-start gap-1 w-full" :class="message.isMine ? 'flex-row-reverse' : 'flex-row'">
        <div 
          class="px-4 py-2.5 rounded-2xl text-[13px] shadow-sm relative overflow-hidden"
          :class="[
            message.isDeleted ? 'bg-slate-900/50 border border-slate-700/50 text-slate-400 rounded-2xl' : 
            (message.isMine ? `${theme.bg} text-white rounded-tr-sm` : 'bg-slate-800 text-slate-200 border border-white/5 rounded-tl-sm')
          ]"
        >
          <!-- MESAJ ȘTERS -->
          <div v-if="message.isDeleted" class="flex items-center gap-2 italic text-[12px] opacity-70 py-0.5">
            <Ban :size="14"/> This message was deleted
          </div>

          <template v-else>
            <!-- REPLY PREVIEW -->
            <div v-if="replyMessage" class="mb-2 p-2 bg-black/20 rounded-lg border-l-4 text-[11px] opacity-90 cursor-pointer" :class="theme.border">
              <span class="font-bold block mb-0.5" :class="replyMessage.isMine ? 'text-white' : theme.text">
                {{ replyMessage.isMine ? 'You' : partnerName }}
              </span>
              <span class="truncate block max-w-xs opacity-80">{{ replyMessage.text || 'Media attachment' }}</span>
            </div>

            <!-- 1. CONȚINUT TEXT -->
            <template v-if="message.type === 'text'">
              <template v-for="(part, idx) in parsedContent" :key="idx">
                <!-- Bloc de Cod -->
                <div v-if="part.type === 'code'" class="bg-slate-950/80 rounded-lg p-3 my-2 font-mono text-[11px] relative group/code border border-slate-700">
                  <button @click="copyToClipboard(part.content)" class="absolute top-2 right-2 p-1.5 bg-slate-800 rounded text-slate-400 hover:text-white opacity-0 group-hover/code:opacity-100 transition-opacity">
                    <Copy :size="14"/>
                  </button>
                  <pre class="overflow-x-auto scrollbar-hide text-slate-300"><code>{{ part.content }}</code></pre>
                </div>
                <!-- Link OpenGraph Mock -->
                <div v-else-if="part.type === 'link'" class="my-2">
                  <a :href="part.url" target="_blank" class="underline hover:text-white transition-colors break-all" :class="message.isMine ? 'text-white/90' : theme.text">{{ part.content }}</a>
                </div>
                <!-- Text Normal -->
                <span v-else class="leading-relaxed whitespace-pre-wrap break-words">{{ part.content }}</span>
              </template>
            </template>
            
            <!-- 2. CONȚINUT AUDIO (Player Real) -->
            <div v-else-if="message.type === 'audio'" class="flex items-center gap-3 w-48 md:w-56 py-1">
              <!-- Elementul Nativ Ascuns -->
              <audio 
                v-if="message.attachment" 
                ref="audioRef" 
                :src="message.attachment"
                @play="isPlayingAudio = true"
                @pause="isPlayingAudio = false"
                @timeupdate="onAudioTimeUpdate"
                @ended="onAudioEnded"
                class="hidden"
              ></audio>
              
              <button @click="toggleAudio" class="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center shrink-0 transition-colors">
                <Pause :size="16" class="text-white" fill="currentColor" v-if="isPlayingAudio"/>
                <Play :size="16" class="text-white ml-0.5" fill="currentColor" v-else/>
              </button>
              
              <!-- Progress Bar -->
              <div class="flex-1 h-1.5 bg-black/20 rounded-full overflow-hidden relative cursor-pointer">
                <div class="absolute top-0 left-0 h-full bg-white/80 transition-all duration-75" :style="{ width: `${audioProgress}%` }"></div>
              </div>
              
              <span class="text-[10px] font-bold opacity-90 shrink-0">{{ message.duration || '0:00' }}</span>
            </div>

            <!-- 3. CONȚINUT IMAGINE -->
            <div v-else-if="message.type === 'image'" class="relative group/img cursor-pointer -mx-1">
              <!-- Renderăm attachment-ul, care în viața reală e URL-ul din S3/Cloudinary -->
              <img :src="message.attachment" class="max-w-[220px] md:max-w-xs rounded-xl object-cover shadow-sm" alt="Image attachment" loading="lazy" />
              <!-- Caption opțional -->
              <p v-if="message.text" class="mt-2 text-[13px] px-1 whitespace-pre-wrap">{{ message.text }}</p>
            </div>

            <!-- 4. CONȚINUT FIȘIER DOCUMENT -->
            <div v-else-if="message.type === 'file'" class="flex items-center gap-3 p-2 bg-black/10 rounded-xl w-52 md:w-60 border border-white/10">
              <div class="p-2 bg-white/10 rounded-lg text-white shrink-0">
                <FileText :size="24" stroke-width="1.5"/>
              </div>
              <div class="flex-1 min-w-0 flex flex-col justify-center">
                <!-- Fallback dacă nu trimitem fileName explicit, extragem din URL -->
                <span class="text-xs font-bold text-white truncate">{{ message.attachment?.split('/').pop() || 'Document.pdf' }}</span>
                <span class="text-[10px] text-white/60">Attachment</span>
              </div>
              <a :href="message.attachment" target="_blank" download class="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors shrink-0">
                <Download :size="14"/>
              </a>
            </div>
          </template>
        </div>

        <!-- Meniu Dropdown (Controlat prin ref și event global) -->
        <div v-if="!message.isDeleted" class="relative pt-1" ref="menuRef">
          <button @click="toggleMenu" class="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100 outline-none">
            <ChevronDown :size="16"/>
          </button>
          
          <transition name="fade-fast">
            <div v-if="isMenuOpen" class="absolute top-8 w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-30 overflow-hidden" :class="message.isMine ? 'right-0' : 'left-0'">
              <div class="flex justify-between px-3 py-2 border-b border-slate-700/50 bg-slate-700/30">
                <button v-for="emo in ['👍', '❤️', '😂', '😮', '😢']" :key="emo" @click="handleReaction(emo)" class="hover:scale-125 transition-transform outline-none">{{ emo }}</button>
              </div>
              <div class="py-1">
                <button @click="triggerAction('reply')" class="w-full text-left px-3 py-2 text-[12px] text-slate-200 hover:bg-slate-700 flex items-center gap-2 outline-none"><Reply :size="14"/> Reply</button>
                <button v-if="message.isMine && message.type === 'text'" @click="triggerAction('edit')" class="w-full text-left px-3 py-2 text-[12px] text-slate-200 hover:bg-slate-700 flex items-center gap-2 outline-none"><Edit2 :size="14"/> Edit</button>
                <button v-if="message.isMine" @click="triggerAction('delete')" class="w-full text-left px-3 py-2 text-[12px] text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 outline-none transition-colors"><Trash2 :size="14"/> Delete</button>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- Footer Mesaj: REACȚII (Acum suportă counter) -->
      <div v-if="formattedReactions.length > 0 && !message.isDeleted" class="flex flex-wrap gap-1 -mt-3 z-10" :class="message.isMine ? 'mr-2' : 'ml-2'">
        <button 
          v-for="reaction in formattedReactions" :key="reaction.emoji" 
          @click="handleReaction(reaction.emoji)"
          class="px-1.5 py-0.5 rounded-full border text-[10px] shadow-sm flex items-center gap-1 transition-colors outline-none"
          :class="reaction.isMe ? `bg-slate-700 ${theme.border} text-white` : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'"
        >
          <span>{{ reaction.emoji }}</span>
          <span v-if="reaction.count > 1" class="font-bold ml-0.5 opacity-80">{{ reaction.count }}</span>
        </button>
      </div>

      <!-- Footer Mesaj: TIMP ȘI STATUS -->
      <div v-if="!message.isDeleted" class="flex items-center gap-1.5 px-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <span class="text-[9px] text-slate-500">{{ message.isEdited ? 'Edited · ' : '' }}{{ formatTimestamp(message.timestamp) }}</span>
        <div v-if="message.isMine" class="flex items-center">
          <Check :size="10" class="text-slate-500" v-if="message.status === 'sent'"/>
          <CheckCheck :size="10" class="text-slate-500" v-else-if="message.status === 'delivered'"/>
          <CheckCheck :class="theme.text" :size="10" v-else-if="message.status === 'read'"/>
        </div>
      </div>
      
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
.fade-fast-enter-active, .fade-fast-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.fade-fast-enter-from, .fade-fast-leave-to { opacity: 0; transform: translateY(-5px) scale(0.95); }
</style>