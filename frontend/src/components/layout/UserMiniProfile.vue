<!-- frontend/src/components/layout/UserMiniProfile.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { ShieldCheck, Settings } from 'lucide-vue-next';

// Ieșim din layout -> ieșim din components -> intrăm în stores
import { useDatingStore } from '../../stores/useDatingStore';

const props = withDefaults(defineProps<{
  activeLens: string;
  userStatus?: 'online' | 'idle' | 'dnd' | 'offline';
}>(), {
  userStatus: 'online'
});

const datingStore = useDatingStore(); // L-am importat doar in caz ca vrei sa accesezi chats mai incolo

// AM MODIFICAT AICI: Am hardcodat datele profilului pana creezi noul store de autentificare
const userName = computed(() => 'Andrei');
const userAvatar = computed(() => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80');

// =====================================
// 1. CLEAN CODE: Theme Dictionary
// =====================================
const theme = computed(() => {
  const themes: Record<string, { wrapper: string; subtitle: string; settings: string; text: string }> = {
    DATE: {
      wrapper: 'bg-rose-500/10 border-rose-500/20 hover:border-rose-500/40 shadow-[0_0_15px_rgba(225,29,72,0.1)] focus-visible:ring-rose-500',
      subtitle: 'text-rose-300 group-hover:text-rose-200',
      settings: 'text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 focus-visible:ring-rose-500',
      text: 'Dating Profile'
    },
    SOCIAL: {
      wrapper: 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)] focus-visible:ring-emerald-500',
      subtitle: 'text-emerald-300 group-hover:text-emerald-200',
      settings: 'text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 focus-visible:ring-emerald-500',
      text: 'Connected'
    },
    PRO: {
      wrapper: 'bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.1)] focus-visible:ring-indigo-500',
      subtitle: 'text-indigo-300 group-hover:text-indigo-200',
      settings: 'text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 focus-visible:ring-indigo-500',
      text: 'Student Frontend Dev'
    }
  };
  return themes[props.activeLens] || themes['PRO'];
});

// =====================================
// 2. STATUS LOGIC
// =====================================
const statusColor = computed(() => {
  switch (props.userStatus) {
    case 'idle': return 'bg-amber-400';
    case 'dnd': return 'bg-rose-500';
    case 'offline': return 'bg-slate-500';
    default: return 'bg-emerald-500'; // online
  }
});

// =====================================
// 3. EVENTS
// =====================================
const emit = defineEmits<{
  (event: 'open-settings'): void;
  (event: 'open-profile'): void;
}>();

const handleProfileClick = () => emit('open-profile');
</script>

<template>
  <div 
    role="button"
    tabindex="0"
    aria-label="View user profile"
    @click="handleProfileClick"
    @keydown.enter="handleProfileClick"
    @keydown.space.prevent="handleProfileClick"
    class="flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 cursor-pointer group active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
    :class="theme.wrapper"
  >
    <!-- AVATAR & STATUS -->
    <div class="relative shrink-0">
      <img 
        :src="userAvatar" 
        class="w-11 h-11 rounded-xl object-cover border border-white/20 shadow-sm transition-transform duration-300 group-hover:scale-105" 
        alt="Avatar"
      />
      <!-- Dynamic Indicator -->
      <span 
        class="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-slate-950 rounded-full transition-colors duration-300"
        :class="statusColor" 
        :title="`Status: ${userStatus}`"
      ></span>
    </div>
    
    <!-- TEXT INFO -->
    <div class="flex flex-col min-w-0 flex-1">
      <div class="flex items-center gap-1.5">
        <span class="text-sm font-bold text-white truncate">{{ userName }}</span>
        <!-- Student Badge (PRO only) -->
        <ShieldCheck v-if="activeLens === 'PRO'" :size="14" class="text-indigo-400 shrink-0" title="Verified Student" />
      </div>
      
      <span class="text-xs font-medium truncate transition-colors duration-300" :class="theme.subtitle">
        {{ theme.text }}
      </span>
    </div>
    
    <!-- SETTINGS -->
    <button 
      aria-label="Profile Settings"
      @click.stop="emit('open-settings')"
      @keydown.enter.stop="emit('open-settings')"
      @keydown.space.stop.prevent="emit('open-settings')"
      class="p-1.5 rounded-lg transition-colors shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 cursor-pointer"
      :class="theme.settings"
    >
      <Settings :size="18" />
    </button>
  </div>
</template>