<!-- frontend/src/views/ProView.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
// Aici vom putea adăuga funcționalități specifice mediului PRO pe viitor
</script>

<template>
  <!-- Acest container ocupă tot spațiul lăsat liber de Sidebar și TopNavbar din App.vue -->
  <div class="h-full w-full flex flex-col relative overflow-hidden bg-slate-950">
    
    <!-- Aici Vue Router va injecta DINAMIC fie ChatListView, fie MainChatView -->
    <!-- Funcție de URL (/pro sau /pro/chat/1) -->
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