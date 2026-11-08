<script setup lang="ts">
// TermsView.vue
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-slate-300 py-12 px-6 md:px-12 font-sans selection:bg-indigo-500/30">
    <div class="max-w-3xl mx-auto">
      <h1 class="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-rose-400 to-emerald-400 mb-8 pb-2">
        Terms of Service
      </h1>
      
      <div class="space-y-8 text-sm md:text-base leading-relaxed bg-white/5 border border-white/10 p-6 md:p-10 rounded-3xl shadow-xl backdrop-blur-sm">
        <p class="text-slate-400 italic">Last updated: {{ new Date().toLocaleDateString() }}</p>

        <section>
          <h2 class="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing and using the Cliq platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-white mb-3">2. Student Accounts and Verification</h2>
          <p>
            Cliq provides specific features for verified university students. By providing an academic email address (.edu, .ac., stud.*), you represent that you are currently enrolled at the respective institution. We reserve the right to revoke student privileges if fraudulent information is detected.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-white mb-3">3. User Conduct</h2>
          <p>
            Users are solely responsible for all content they publish on Cliq. Harassment, hate speech, spam, and the distribution of illegal content are strictly prohibited and will result in immediate account termination.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-white mb-3">4. Disclaimer of Warranties</h2>
          <p>
            The service is provided "as is". We make no warranties, expressed or implied, and hereby disclaim all other warranties, including without limitation, implied warranties or conditions of merchantability.
          </p>
        </section>
      </div>
    </div>
  </main>
</template>