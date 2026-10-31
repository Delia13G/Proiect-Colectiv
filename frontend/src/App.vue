<script setup lang="ts">
import { ref, onMounted } from 'vue'

const mesaj = ref('Se încarcă datele din backend...')

onMounted(async () => {
  try {
   const raspuns = await fetch('/api/test')
    mesaj.value = await raspuns.text()
  } catch (eroare) {
    mesaj.value = 'Eroare de conexiune cu serverul Quarkus.'
  }
})
</script>

<template>
  <main style="display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: sans-serif; background-color: #093454; padding: 20px;">
    <div style="text-align: center; background-color: #2c2c2c; padding: 40px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); max-width: 600px;">
      <h1 style="color: #42b883; line-height: 1.5; margin: 0; font-size: 28px;">
        {{ mesaj }}
      </h1>
      <h2>Salut, sunt Ioana!</h2>
    </div>
  </main>
</template>