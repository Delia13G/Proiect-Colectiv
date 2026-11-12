
<script setup lang="ts">
import { Heart, SlidersHorizontal, Sparkles } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLensStore } from '../../stores/lensStore'

const router = useRouter()
const route = useRoute()
const lensStore = useLensStore()

const activeLens = computed(() => {
  if (route.path.startsWith('/dating')) return 'DATE'
  if (route.path.startsWith('/social')) return 'SOCIAL'
  if (route.path.startsWith('/pro')) return 'PRO'
  return ''
})

const emit = defineEmits<{
  (event: 'open-filters'): void
  (event: 'open-likes'): void
}>()

const selectLens = (lens: string) => {
  const routes: Record<string, string> = {
    DATE: '/dating',
    SOCIAL: '/social',
    PRO: '/pro'
  }

  lensStore.setLens(lens)
  router.push(routes[lens])
}
</script>

<template>
  <header class="dating-navbar">

    <div class="logo">
      CLIQ<span>.</span>
    </div>

    <nav class="lens-switcher">
      <button
        v-for="lens in ['DATE', 'SOCIAL', 'PRO']"
        :key="lens"
        :class="{ active: activeLens === lens }"
        @click="selectLens(lens)"
      >
        {{ lens }}
        <Heart v-if="lens === 'DATE'" :size="15" />
      </button>
    </nav>

    <div class="navbar-actions">
      <button class="likes-button" @click="emit('open-likes')">
        <Sparkles :size="17" />
        Likes You
      </button>

      <button class="filter-button" @click="emit('open-filters')">
        <SlidersHorizontal :size="19" />
        Filters
      </button>
    </div>
  </header>
</template>

<style scoped>
.dating-navbar {
  height: 72px;
  padding: 0 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 18px;
}

.logo {
  font-size: 29px;
  font-weight: 800;
  color: #fb4777;
  letter-spacing: -1px;
}

.logo span {
  color: white;
}

.lens-switcher {
  display: flex;
  gap: 8px;
  padding: 5px;
  background: rgba(255,255,255,0.07);
  border-radius: 30px;
}

.lens-switcher button {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 20px;
  border: none;
  border-radius: 25px;
  background: transparent;
  color: #aaa;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  transition: 0.2s;
}

.lens-switcher button.active {
  background: #e11d48;
  color: white;
  box-shadow: 0 0 20px rgba(225,29,72,0.4);
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.likes-button,
.filter-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 16px;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  font-size: 13px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.07);
}

.likes-button:hover,
.filter-button:hover {
  background: rgba(225,29,72,0.2);
  border-color: #e11d48;
}

@media (max-width: 650px) {
  .dating-navbar {
    padding: 0 12px;
  }

  .lens-switcher button {
    padding: 9px;
  }

  .likes-button {
    display: none;
  }
}
</style>
