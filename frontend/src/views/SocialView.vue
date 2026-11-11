<script setup lang="ts">
import SocialTopNavBar from '../components/social/SocialTopNavBar.vue';
import SocialSidebarLeft from '../components/social/SocialSidebarLeft.vue';
import SocialGrid from '../components/social/SocialGrid.vue';
import SocialFilterSidebar from '../components/social/SocialFilterSidebar.vue';
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
    <SocialTopNavBar />
    
    <!-- Am micșorat gap-ul și padding-ul pentru un look mai compact -->
    <main class="flex-1 max-w-screen-2xl w-full mx-auto grid grid-cols-12 gap-5 px-6 py-4">
      <div class="col-span-2"> <!-- Sidebar mai îngust -->
        <SocialSidebarLeft />
      </div>
      <div class="col-span-7"> <!-- Grila mai lată -->
        <SocialGrid />
      </div>
      <div class="col-span-3"> <!-- Filtrele -->
        <SocialFilterSidebar />
      </div>
    </main>
  </div>
</template>