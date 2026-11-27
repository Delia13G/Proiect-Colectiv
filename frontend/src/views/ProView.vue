<!-- frontend/src/views/ProView.vue -->
<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
  <div
    class="h-full w-full flex flex-col relative bg-slate-950"
    :class="route.meta.compactSidebar ? 'overflow-hidden' : 'overflow-y-auto'"
  >
    <router-view v-slot="{ Component }">
      <transition name="page-fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<style scoped>
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateX(10px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>