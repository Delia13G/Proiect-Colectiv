<!-- frontend/src/components/layout/UserMiniProfile.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { ShieldCheck, Settings } from 'lucide-vue-next';
import { getLensTheme } from '../../utils/lensTheme';

const props = withDefaults(
  defineProps<{
    activeLens: string;
    userStatus?: 'online' | 'idle' | 'dnd' | 'offline';
    collapsed?: boolean;
  }>(),
  {
    userStatus: 'online',
    collapsed: false,
  }
);

const userName = computed(() => 'Andrei');
const userAvatar = computed(
  () =>
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
);

const theme = computed(() => getLensTheme(props.activeLens).miniProfile);

const statusColor = computed(() => {
  switch (props.userStatus) {
    case 'idle':
      return 'bg-amber-400';
    case 'dnd':
      return 'bg-rose-500';
    case 'offline':
      return 'bg-slate-500';
    default:
      return 'bg-emerald-500';
  }
});

const emit = defineEmits<{
  (event: 'open-settings'): void;
  (event: 'open-profile'): void;
}>();

const handleProfileClick = () => emit('open-profile');
</script>

<template>
  <!-- VARIANTA COMPACTĂ (Navigation Rail) -->
  <button
    v-if="collapsed"
    type="button"
    @click="handleProfileClick"
    :title="`${userName} · ${theme.text}`"
    :aria-label="`View profile: ${userName}`"
    class="relative p-1.5 rounded-2xl border transition-all duration-200 cursor-pointer group active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 shrink-0"
    :class="theme.wrapper"
  >
    <img
      :src="userAvatar"
      referrerpolicy="no-referrer"
      class="w-10 h-10 rounded-xl object-cover border border-white/20 shadow-sm transition-transform duration-200 group-hover:scale-105"
      alt="Avatar"
    />
    <span
      class="absolute bottom-0.5 right-0.5 w-3 h-3 border-2 border-slate-950 rounded-full transition-colors duration-200"
      :class="statusColor"
      :title="`Status: ${userStatus}`"
    />
  </button>

  <!-- VARIANTA COMPLETĂ -->
  <div
    v-else
    role="button"
    tabindex="0"
    aria-label="View user profile"
    @click="handleProfileClick"
    @keydown.enter="handleProfileClick"
    @keydown.space.prevent="handleProfileClick"
    class="flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 cursor-pointer group active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 shrink-0"
    :class="theme.wrapper"
  >
    <div class="relative shrink-0">
      <img
        :src="userAvatar"
        referrerpolicy="no-referrer"
        class="w-11 h-11 rounded-xl object-cover border border-white/20 shadow-sm transition-transform duration-300 group-hover:scale-105"
        alt="Avatar"
      />
      <span
        class="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-slate-950 rounded-full transition-colors duration-300"
        :class="statusColor"
        :title="`Status: ${userStatus}`"
      />
    </div>

    <div class="flex flex-col min-w-0 flex-1">
      <div class="flex items-center gap-1.5">
        <span class="text-sm font-bold text-white truncate">{{ userName }}</span>
        <ShieldCheck
          v-if="activeLens === 'PRO'"
          :size="14"
          class="text-indigo-400 shrink-0"
          title="Verified Student"
        />
      </div>

      <span class="text-xs font-medium truncate transition-colors duration-300" :class="theme.subtitle">
        {{ theme.text }}
      </span>
    </div>

    <button
      type="button"
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