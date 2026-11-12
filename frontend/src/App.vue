<script setup lang="ts">
import TopNavBar from './components/layout/TopNavBar.vue';
</script>

<template>
  <!-- Am șters overflow-hidden pentru ca 'sticky' să funcționeze corect pe bară -->
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
    
    <TopNavBar />

    <router-view class="flex-1" />
    
  </div>
</template>