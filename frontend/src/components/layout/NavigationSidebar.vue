<!-- frontend/src/components/navigation/NavigationSidebar.vue -->
<script setup lang="ts">
import UserMiniProfile from './UserMiniProfile.vue'; // Ensure the path is correct
import ProSidebarContent from '../pro/ProSidebarContent.vue';
import SocialSidebarContent from '../social/SocialSidebarContent.vue';
import DateSidebarContent from '../dating/DateSidebarContent.vue';

// Define the prop that determines which lens is active (received from parent/router)
const props = defineProps<{
  activeLens: 'PRO' | 'SOCIAL' | 'DATE';
}>();

// Events that this global menu forwards to the main layout (App.vue) for navigation
const emit = defineEmits<{
  (event: 'create-project'): void;
  (event: 'open-project', id: number): void;
  (event: 'project-options', id: number): void;
  (event: 'open-group', id: number): void;
  (event: 'open-all-groups'): void;
  (event: 'open-likes'): void;
  (event: 'open-chat', id: number, lens: string): void;
}>();
</script>

<template>
  <!-- MAIN SIDEBAR CONTAINER (Global Glassmorphism) -->
  <aside class="w-72 h-full flex flex-col gap-6 p-4 bg-slate-900/40 backdrop-blur-xl border-r border-white/10 select-none overflow-hidden relative z-20">
    
    <!-- 1. USER PROFILE (Static at the top, adapts automatically to activeLens) -->
    <UserMiniProfile :activeLens="activeLens" />

    <!-- 2. DYNAMIC AREA (Changes with a fade animation depending on the active lens) -->
    <transition name="lens-fade" mode="out-in">
      
      <!-- PRO CONTENT -->
      <ProSidebarContent 
        v-if="activeLens === 'PRO'"
        key="pro"
        @create-project="emit('create-project')"
        @open-project="(id) => emit('open-project', id)"
        @project-options="(id) => emit('project-options', id)"
        @open-chat="(id) => emit('open-chat', id, 'PRO')"
      />

      <!-- SOCIAL CONTENT -->
      <SocialSidebarContent 
        v-else-if="activeLens === 'SOCIAL'"
        key="social"
        @open-group="(id) => emit('open-group', id)"
        @open-all-groups="emit('open-all-groups')"
        @open-chat="(id) => emit('open-chat', id, 'SOCIAL')"
      />

      <!-- DATE CONTENT -->
      <DateSidebarContent 
        v-else-if="activeLens === 'DATE'"
        key="date"
        @open-likes="emit('open-likes')"
        @open-chat="(id) => emit('open-chat', id, 'DATE')"
      />

    </transition>
  </aside>
</template>

<style scoped>
/* Ultra-smooth animation for lens switching */
.lens-fade-enter-active,
.lens-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.25, 1, 0.5, 1);
}
.lens-fade-enter-from {
  opacity: 0;
  transform: translateX(-15px);
}
.lens-fade-leave-to {
  opacity: 0;
  transform: translateX(15px);
}
</style>