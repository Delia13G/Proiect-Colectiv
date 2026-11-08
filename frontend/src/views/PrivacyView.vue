<script setup lang="ts">
// PrivacyView.vue
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-slate-300 py-12 px-6 md:px-12 font-sans selection:bg-indigo-500/30">
    <div class="max-w-3xl mx-auto">
      <h1 class="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-rose-400 to-emerald-400 mb-8 pb-2">
        Privacy Policy
      </h1>
      
      <div class="space-y-8 text-sm md:text-base leading-relaxed bg-white/5 border border-white/10 p-6 md:p-10 rounded-3xl shadow-xl backdrop-blur-sm">
        <p class="text-slate-400 italic">Last updated: {{ new Date().toLocaleDateString() }}</p>

        <section>
          <h2 class="text-xl font-bold text-white mb-3">1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us when you create an account, including your first name, last name, personal email address, optional student email address, phone number, and password.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-white mb-3">2. How We Use Your Information</h2>
          <p>
            We use the information we collect to provide, maintain, and improve our services, to authenticate users, and to verify student status for unlocking academic benefits within the Cliq application.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-white mb-3">3. Data Security and Storage</h2>
          <p>
            Your security is important to us. Passwords are cryptographically hashed and never stored in plain text. However, remember that no method of transmission over the internet or electronic storage is 100% secure.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-white mb-3">4. Cookies and Local Storage</h2>
          <p>
            We use local storage mechanisms (such as JWT tokens and remember-me preferences) to keep you logged in and enhance your user experience. By using our application, you consent to the use of these technologies.
          </p>
        </section>
      </div>
    </div>
  </main>
</template>