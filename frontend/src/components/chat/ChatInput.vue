<!-- src/components/chat/ChatInput.vue -->
<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { Paperclip, Smile, Send, Mic, X, Trash2, Lock, FileText } from 'lucide-vue-next';
import { useAudioRecorder } from '../../composables/useAudioRecorder';
import type { ChatTheme, ChatMessage } from '../../types/chat';

// Librării Externe
import imageCompression from 'browser-image-compression';
import EmojiPicker from 'vue3-emoji-picker';
import 'vue3-emoji-picker/css';

const props = defineProps<{
  theme: ChatTheme;
  replyingTo: ChatMessage | null;
  editingMessage: ChatMessage | null;
  chatId?: string | number;
}>();

const emit = defineEmits<{
  (e: 'send', payload: { type: 'text' | 'audio' | 'file'; text?: string; file?: File | Blob; duration?: number }): void;
  (e: 'cancel-action'): void;
  (e: 'typing', status: boolean): void;
}>();

// --- STATE DE BAZĂ ---
const messageText = ref('');
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

// --- 1. EMOJI PICKER NATIV ---
const showEmojiPicker = ref(false);

const onSelectEmoji = (emoji: any) => {
  const cursor = textareaRef.value?.selectionStart || messageText.value.length;
  const start = messageText.value.slice(0, cursor);
  const end = messageText.value.slice(cursor);
  messageText.value = `${start}${emoji.i}${end}`;
  
  showEmojiPicker.value = false;
  
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.focus();
      const newCursorPos = cursor + emoji.i.length;
      textareaRef.value.setSelectionRange(newCursorPos, newCursorPos);
    }
  });
};

// --- 2. LOGICĂ MENȚIUNI & COMENZI (Navigare Tastatură) ---
const showMentions = ref(false);
const showCommands = ref(false);
const filteredUsers = ref<string[]>([]);
const filteredCommands = ref<{cmd: string, desc: string}[]>([]);
const selectedMentionIndex = ref(0);

const mockUsers = ['alex', 'andreea', 'bogdan', 'cristina', 'dan', 'elena'];
const mockCommands = [
  { cmd: '/poll', desc: 'Create a poll for the team' },
  { cmd: '/giphy', desc: 'Search and send a GIF' },
  { cmd: '/clear', desc: 'Clear your local chat history' },
  { cmd: '/meet', desc: 'Start a video meeting link' }
];

const activeWordRange = ref({ start: 0, end: 0 });

const handleTyping = (e?: Event) => {
  const el = textareaRef.value;
  if (!el) return;

  const cursor = el.selectionStart;
  const textBeforeCursor = messageText.value.slice(0, cursor);
  const words = textBeforeCursor.split(/[\s\n]+/);
  const lastWord = words[words.length - 1];

  activeWordRange.value = { start: cursor - lastWord.length, end: cursor };

  if (lastWord.startsWith('@')) {
    const search = lastWord.slice(1).toLowerCase();
    filteredUsers.value = mockUsers.filter(u => u.includes(search));
    showMentions.value = filteredUsers.value.length > 0;
    showCommands.value = false;
  } 
  else if (lastWord.startsWith('/') && words.length === 1) {
    const search = lastWord.toLowerCase();
    filteredCommands.value = mockCommands.filter(c => c.cmd.includes(search));
    showCommands.value = filteredCommands.value.length > 0;
    showMentions.value = false;
  } 
  else {
    showMentions.value = false;
    showCommands.value = false;
  }

  if (e?.type === 'input') selectedMentionIndex.value = 0;
  adjustTextareaHeight();
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (showMentions.value || showCommands.value) {
    const maxIndex = showMentions.value ? filteredUsers.value.length - 1 : filteredCommands.value.length - 1;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedMentionIndex.value = Math.min(selectedMentionIndex.value + 1, maxIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedMentionIndex.value = Math.max(selectedMentionIndex.value - 1, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showMentions.value) insertMention(filteredUsers.value[selectedMentionIndex.value]);
      else if (showCommands.value) insertCommand(filteredCommands.value[selectedMentionIndex.value].cmd);
    } else if (e.key === 'Escape') {
      showMentions.value = false;
      showCommands.value = false;
    }
    return;
  }

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
};

const insertMention = (user: string) => replaceWordAtCursor(`@${user} `);
const insertCommand = (cmd: string) => replaceWordAtCursor(`${cmd} `);

const replaceWordAtCursor = (replacement: string) => {
  const start = messageText.value.slice(0, activeWordRange.value.start);
  const end = messageText.value.slice(activeWordRange.value.end);
  messageText.value = `${start}${replacement}${end}`;
  
  showMentions.value = false;
  showCommands.value = false;
  
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.focus();
      const newCursor = activeWordRange.value.start + replacement.length;
      textareaRef.value.setSelectionRange(newCursor, newCursor);
    }
  });
};

// --- 3. STAGING & COMPRESIE IMAGINI ---
const stagedFiles = ref<{ file: File; preview: string; type: string }[]>([]);
const isCompressing = ref(false);

const compressImage = async (file: File): Promise<File> => {
  if (!file.type.startsWith('image/')) return file;
  try {
    return await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, initialQuality: 0.8 });
  } catch (error) { return file; }
};

const addFilesToStage = async (files: File[]) => {
  isCompressing.value = true;
  for (const file of files) {
    const isImage = file.type.startsWith('image/');
    const finalFile = isImage ? await compressImage(file) : file;
    stagedFiles.value.push({ file: finalFile, preview: isImage ? URL.createObjectURL(finalFile) : '', type: isImage ? 'image' : 'file' });
  }
  isCompressing.value = false;
  focusInput();
};

defineExpose({ addFilesToStage });

const handleFileUpload = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files) addFilesToStage(Array.from(target.files));
  target.value = '';
};

const handlePaste = (e: ClipboardEvent) => {
  if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
    e.preventDefault();
    addFilesToStage(Array.from(e.clipboardData.files));
  }
};

const removeStagedFile = (index: number) => {
  if (stagedFiles.value[index].preview) URL.revokeObjectURL(stagedFiles.value[index].preview);
  stagedFiles.value.splice(index, 1);
};

onUnmounted(() => {
  stagedFiles.value.forEach(staged => { if (staged.preview) URL.revokeObjectURL(staged.preview); });
});

// --- 4. DRAFTS & TEXTAREA (Corectat pentru Editare) ---
const draftKey = computed(() => `chat_draft_${props.chatId || 'default'}`);

const focusInput = () => nextTick(() => textareaRef.value?.focus());
const adjustTextareaHeight = () => {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
};
const resetTextareaHeight = () => { if (textareaRef.value) textareaRef.value.style.height = 'auto'; };

onMounted(() => {
  const savedDraft = localStorage.getItem(draftKey.value);
  if (savedDraft && !props.editingMessage) {
    messageText.value = savedDraft;
    nextTick(adjustTextareaHeight);
  }
});

// Forțare immediate: true pentru Edit Fix
watch(() => props.editingMessage, (newVal) => {
  if (newVal) {
    messageText.value = newVal.text || '';
    focusInput();
  } else if (!props.replyingTo) {
    messageText.value = '';
    resetTextareaHeight();
  }
}, { immediate: true });

let typingTimeout: ReturnType<typeof setTimeout> | null = null;
watch(messageText, (val) => {
  if (!props.editingMessage) localStorage.setItem(draftKey.value, val);
  emit('typing', true);
  if (typingTimeout) clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => emit('typing', false), 2500);
});

// --- 5. TRIMITERE MESAJE ---
const handleSend = () => {
  const text = messageText.value.trim();
  const hasFiles = stagedFiles.value.length > 0;
  
  if (!text && !hasFiles) return;

  if (hasFiles) {
    stagedFiles.value.forEach((staged, index) => {
      emit('send', { type: staged.type as 'file', file: staged.file, text: index === 0 ? text : undefined });
      if (staged.preview) URL.revokeObjectURL(staged.preview);
    });
  } else {
    emit('send', { type: 'text', text });
  }

  messageText.value = '';
  stagedFiles.value = [];
  localStorage.removeItem(draftKey.value);
  resetTextareaHeight();
  showEmojiPicker.value = false;
  focusInput();
};

// --- 6. LOGICĂ AUDIO DESKTOP (Click & Enter Fix) ---
const onAudioStop = (blob: Blob, duration: number) => emit('send', { type: 'audio', file: blob, duration });
const { start: startAudio, stop: stopAudio, cancel: cancelAudio, lock: lockAudio, isRecording, recordTime, audioFrequencies } = useAudioRecorder(onAudioStop);

const toggleAudioRecording = async () => {
  if (!isRecording.value) {
    await startAudio();
    lockAudio(); // Menține UI-ul activ pe Desktop
  }
};

const handleGlobalKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && isRecording.value) {
    e.preventDefault();
    stopAudio();
  }
};

watch(isRecording, (val) => {
  if (val) document.addEventListener('keydown', handleGlobalKeydown);
  else document.removeEventListener('keydown', handleGlobalKeydown);
});

const formatTime = (secs: number) => `${Math.floor(secs / 60)}:${(secs % 60) < 10 ? '0' : ''}${secs % 60}`;
</script>

<template>
  <footer class="bg-slate-900/80 backdrop-blur-xl border-t border-white/10 shrink-0 flex flex-col relative z-30">
    
    <!-- State Bar (Reply/Edit) -->
    <transition name="fade">
      <div v-if="replyingTo || editingMessage" class="px-4 py-2 border-b border-white/5 bg-slate-800/50 flex justify-between items-center relative overflow-hidden">
        <div class="absolute left-0 top-0 bottom-0 w-1" :class="theme.bg"></div>
        <div class="flex flex-col min-w-0 px-2">
          <span class="text-[11px] font-bold" :class="theme.text">{{ editingMessage ? 'Edit Message' : 'Replying...' }}</span>
          <span class="text-xs text-slate-400 truncate">{{ editingMessage ? 'Edit your text' : replyingTo?.text }}</span>
        </div>
        <button @click="$emit('cancel-action')" class="p-1.5 rounded-full hover:bg-slate-700/50 text-slate-400 outline-none"><X :size="16"/></button>
      </div>
    </transition>

    <!-- Staging Area (Pre-Upload) - Aliniată cu inputul de chat -->
    <div v-if="stagedFiles.length > 0 || isCompressing" class="px-4 pt-3 pb-1 flex gap-3 overflow-x-auto scrollbar-hide border-b border-white/5 items-center">      <div v-for="(file, idx) in stagedFiles" :key="idx" class="relative w-16 h-16 rounded-xl border border-slate-700 bg-slate-800 shrink-0 overflow-hidden group shadow-md">
        <img v-if="file.type === 'image'" :src="file.preview" class="w-full h-full object-cover" />
        <div v-else class="w-full h-full flex flex-col items-center justify-center text-slate-400">
          <FileText :size="20"/>
          <span class="text-[8px] mt-1 font-mono truncate px-1 w-full text-center">{{ file.file.name.split('.').pop()?.toUpperCase() }}</span>
        </div>
        <button @click="removeStagedFile(idx)" class="absolute top-1 right-1 p-1 bg-slate-900/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity outline-none"><X :size="10"/></button>
      </div>
      <div v-if="isCompressing" class="w-16 h-16 flex items-center justify-center shrink-0">
        <div class="w-6 h-6 border-2 border-slate-500 border-t-white rounded-full animate-spin"></div>
      </div>
    </div>

    <!-- MENTIONS POPUP -->
    <transition name="fade">
      <div v-if="showMentions" class="absolute bottom-full mb-1 left-4 bg-slate-800 border border-slate-700 shadow-xl rounded-lg py-1 w-48 z-50 overflow-hidden">
        <div class="text-[10px] text-slate-400 font-bold mb-1 px-3 mt-1 uppercase tracking-wider">Members</div>
        <div 
          v-for="(user, idx) in filteredUsers" :key="user" 
          @click="insertMention(user)"
          @mouseover="selectedMentionIndex = idx"
          class="px-3 py-1.5 cursor-pointer text-sm flex items-center gap-2 transition-colors"
          :class="selectedMentionIndex === idx ? 'bg-slate-700 text-white' : 'text-slate-300'"
        >
          <div class="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-[10px] font-bold text-white">{{ user.charAt(0).toUpperCase() }}</div> 
          {{ user }}
        </div>
      </div>
    </transition>

    <!-- COMMANDS POPUP -->
    <transition name="fade">
      <div v-if="showCommands" class="absolute bottom-full mb-1 left-4 bg-slate-800 border border-slate-700 shadow-xl rounded-lg py-1 w-64 z-50 overflow-hidden">
        <div class="text-[10px] text-slate-400 font-bold mb-1 px-3 mt-1 uppercase tracking-wider">Commands</div>
        <div 
          v-for="(cmd, idx) in filteredCommands" :key="cmd.cmd" 
          @click="insertCommand(cmd.cmd)"
          @mouseover="selectedMentionIndex = idx"
          class="px-3 py-1.5 cursor-pointer flex flex-col transition-colors"
          :class="selectedMentionIndex === idx ? 'bg-slate-700' : ''"
        >
          <span class="font-mono text-sm" :class="selectedMentionIndex === idx ? theme.text : 'text-white'">{{ cmd.cmd }}</span>
          <span class="text-xs" :class="selectedMentionIndex === idx ? 'text-slate-300' : 'text-slate-400'">{{ cmd.desc }}</span>
        </div>
      </div>
    </transition>

    <!-- EMOJI PICKER -->
    <transition name="fade">
      <div v-if="showEmojiPicker" class="absolute bottom-full mb-2 left-4 md:left-12 z-50 shadow-2xl rounded-xl overflow-hidden border border-slate-700">
        <EmojiPicker :native="true" theme="dark" @select="onSelectEmoji" />
      </div>
    </transition>

    <!-- RECORDING ACTIVE UI (DESIGN DESKTOP) -->
    <div v-if="isRecording" class="absolute inset-0 bg-slate-900 z-40 flex items-center justify-between px-4 md:px-6 border-t border-rose-500/30 select-none">
      <div class="flex items-center gap-3">
        <button @click="cancelAudio" class="p-2.5 rounded-full bg-slate-800 hover:bg-rose-500/20 text-rose-500 transition-colors outline-none"><Trash2 :size="20"/></button>
        <span class="font-mono text-sm font-bold text-rose-500 ml-2">{{ formatTime(recordTime) }}</span>
      </div>
      
      <div class="flex-1 mx-4 flex items-center gap-[2px] h-10 overflow-hidden justify-center mask-image-gradient">
        <div v-for="(freq, i) in audioFrequencies" :key="i" class="w-1 bg-rose-500 rounded-full transition-all duration-75" :style="{ height: `${freq}px` }"></div>
      </div>
      
      <div class="flex items-center gap-2">
        <span class="hidden md:inline text-[10px] font-bold text-slate-400 mr-2">Press Enter to send</span>
        <button @click="stopAudio" class="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-transform outline-none"><Send :size="16" class="ml-0.5"/></button>
      </div>
    </div>

    <!-- MAIN INPUT BAR -->
    <div class="p-3 md:p-4 flex items-end gap-2 max-w-5xl mx-auto w-full relative">
      <input type="file" ref="fileInputRef" @change="handleFileUpload" class="hidden" multiple />
      
      <button @click="fileInputRef?.click()" class="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors outline-none shrink-0"><Paperclip :size="20"/></button>

      <div class="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-2xl md:rounded-[24px] flex items-end px-2 py-1 focus-within:bg-slate-800 transition-all focus-within:ring-1 focus-within:ring-slate-500 relative">
        <button @click="showEmojiPicker = !showEmojiPicker" class="p-2 mb-0.5 rounded-full transition-colors shrink-0 outline-none" :class="showEmojiPicker ? theme.text : 'text-slate-400 hover:text-white'"><Smile :size="20"/></button>
        
        <textarea 
          ref="textareaRef"
          v-model="messageText"
          @input="handleTyping"
          @click="handleTyping"
          @keydown="handleKeyDown"
          @paste="handlePaste"
          rows="1"
          :placeholder="editingMessage ? 'Edit your message...' : 'Type a message...'"
          class="flex-1 bg-transparent border-none text-[13px] md:text-sm text-white placeholder:text-slate-500 focus:ring-0 resize-none min-h-[40px] py-2.5 px-2 outline-none scrollbar-hide"
        ></textarea>
      </div>

      <button 
        v-if="messageText.trim() || editingMessage || stagedFiles.length > 0"
        @click="handleSend"
        class="mb-1 p-3 rounded-full text-white shadow-lg outline-none shrink-0 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        :class="theme.bg"
      >
        <Send :size="18"/>
      </button>
      
      <button 
        v-else
        @click="toggleAudioRecording"
        class="mb-1 p-3 rounded-full text-white shadow-lg outline-none shrink-0 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer select-none"
        :class="theme.bg"
      >
        <Mic :size="18"/>
      </button>
    </div>
  </footer>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(5px); }
.mask-image-gradient { -webkit-mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent); }
</style>