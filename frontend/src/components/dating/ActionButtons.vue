
<script setup lang="ts">
import {
  Heart,
  X,
  Star,
  RotateCcw
} from 'lucide-vue-next'

const props = defineProps<{
  canUndo: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  (event: 'pass'): void
  (event: 'like'): void
  (event: 'super-like'): void
  (event: 'undo'): void
}>()
</script>

<template>
  <div class="action-buttons">

    <!-- UNDO -->
    <button
      class="action-btn undo-btn"
      title="Undo"
      :disabled="!canUndo || disabled"
      @click="emit('undo')"
    >
      <RotateCcw :size="21" />
    </button>

    <!-- PASS -->
    <button
      class="action-btn pass-btn"
      title="Pass"
      :disabled="disabled"
      @click="emit('pass')"
    >
      <X :size="29" />
    </button>

    <!-- SUPER LIKE -->
    <button
      class="action-btn superlike-btn"
      title="Super Like"
      :disabled="disabled"
      @click="emit('super-like')"
    >
      <Star :size="21" />
    </button>

    <!-- LIKE -->
    <button
      class="action-btn like-btn"
      title="Like"
      :disabled="disabled"
      @click="emit('like')"
    >
      <Heart :size="28" />
    </button>

  </div>
</template>

<style scoped>
.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 22px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.action-btn:hover:not(:disabled) {
  transform: scale(1.12);
}

.action-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.undo-btn {
  width: 48px;
  height: 48px;
  background: #fbbf24;
  color: #222;
}

.pass-btn {
  width: 58px;
  height: 58px;
  background: #454657;
  color: white;
}

.pass-btn:hover:not(:disabled) {
  background: #e11d48;
}

.superlike-btn {
  width: 48px;
  height: 48px;
  background: #168bd5;
  color: white;
}

.like-btn {
  width: 58px;
  height: 58px;
  background: #e11d48;
  color: white;
  box-shadow: 0 0 20px rgba(225,29,72,0.4);
}

.like-btn:hover:not(:disabled) {
  box-shadow: 0 0 30px rgba(225,29,72,0.7);
}

@media (max-width: 550px) {
  .action-buttons {
    gap: 13px;
  }
}
</style>
