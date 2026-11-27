
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDatingStore } from '../stores/useDatingStore'
import { SlidersHorizontal, Compass, PauseCircle } from 'lucide-vue-next'

import ProfileCard from '../components/dating/ProfileCard.vue'
import ActionButtons from '../components/dating/ActionButtons.vue'
import FilterDrawer from '../components/dating/FilterDrawer.vue'
import MatchModal from '../components/dating/MatchModal.vue'
import LikesYou from '../components/dating/LikesYou.vue'
import ChatView from '../components/dating/ChatView.vue'

// TYPES
interface DatingProfile {
  id: number
  name: string
  age: number
  university: string
  occupation: string
  distance: number
  bio: string
  interests: string[]
  photos: string[]
  verifiedStudent: boolean
  recentlyActive: boolean
}

interface Match {
  id: number
  name: string
  image: string
}

interface Chat {
  id: number
  name: string
  message: string
  image: string
  unread: boolean
}

const route = useRoute()
const router = useRouter()
const datingStore = useDatingStore()
const { matches: storeMatches, sortedChats: storeChats } = storeToRefs(datingStore)

const activePage = ref<'discovery' | 'likes' | 'chat'>(
  route.query.view === 'likes' ? 'likes' : 'discovery'
)


// MODALS
const showFilters = ref(false)
const showMatchModal = ref(false)

// USER
const currentUser = {
  name: 'Andrei',
  image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300'
}

// DEMO PROFILES
const allProfiles: DatingProfile[] = [
  {
    id: 1,
    name: 'Irina',
    age: 21,
    university: 'UBB',
    occupation: 'Psihologie',
    distance: 3,
    bio: 'Îmi place să călătoresc, să descopăr cafenele noi și să merg la drumeții. Caut oameni cu energie bună și conversații interesante!',
    interests: ['Hiking', 'Coffee', 'Travel'],
    photos: [
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900'
    ],
    verifiedStudent: true,
    recentlyActive: true
  },
  {
    id: 2,
    name: 'Maria',
    age: 22,
    university: 'UBB',
    occupation: 'Informatică',
    distance: 5,
    bio: 'Coffee lover, music addict and weekend explorer.',
    interests: ['Music', 'Gaming', 'Coffee'],
    photos: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900'
    ],
    verifiedStudent: true,
    recentlyActive: true
  },
  {
    id: 3,
    name: 'Ana',
    age: 20,
    university: 'UTCN',
    occupation: 'Automatică',
    distance: 8,
    bio: 'Iubesc fotografia, călătoriile și oamenii autentici.',
    interests: ['Photography', 'Travel', 'Reading'],
    photos: [
      'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=900'
    ],
    verifiedStudent: false,
    recentlyActive: false
  }
]

// MATCHED PROFILE
const matchedProfile = ref<DatingProfile | null>(null)

// PROFILES
const profiles = ref<DatingProfile[]>([...allProfiles])
const currentIndex = ref(0)

const currentProfile = computed(() => {
  return profiles.value[currentIndex.value] ?? null
})

// MATCHES
const matches = ref<Match[]>([
  {
    id: 10,
    name: 'Ioana',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  },
  {
    id: 11,
    name: 'Maria',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150'
  }
])

// CHATS
const chats = ref<Chat[]>([
  {
    id: 10,
    name: 'Ioana',
    message: 'Hei! Ce faci?',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    unread: true
  },
  {
    id: 11,
    name: 'Mihai',
    message: 'Ne vedem la cafea?',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    unread: false
  }
])

// ACTIVE CHAT
const activeChat = ref<Chat | null>(null)

// LIKES YOU
const likedProfiles = ref([
  {
    id: 20,
    name: 'Elena',
    age: 21,
    image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300'
  },
  {
    id: 21,
    name: 'Alexandra',
    age: 23,
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300'
  }
])

// FILTERS
const filters = ref({
  minAge: 18,
  maxAge: 30,
  maxDistance: 50,
  interests: [] as string[],
  verifiedStudentsOnly: false,
  sameUniversityOnly: false,
  isPaused: false
})

const isVerifiedStudent = true

// ACTION HISTORY
type ActionType = 'pass' | 'like' | 'super-like'

interface HistoryItem {
  profileId: number
  previousIndex: number
  action: ActionType
}

const history = ref<HistoryItem[]>([])

const likedProfileIds = ref<number[]>([])
const passedProfileIds = ref<number[]>([])
const superLikedProfileIds = ref<number[]>([])

const canUndo = computed(() => history.value.length > 0)

const actionsDisabled = computed(() => {
  return !currentProfile.value || filters.value.isPaused
})

// DISCOVERY ACTIONS
function nextProfile() {
  if (currentIndex.value < profiles.value.length - 1) {
    currentIndex.value++
  } else {
    currentIndex.value = profiles.value.length
  }
}

function registerAction(action: ActionType) {
  if (!currentProfile.value || filters.value.isPaused) return

  const profile = currentProfile.value

  history.value.push({
    profileId: profile.id,
    previousIndex: currentIndex.value,
    action
  })

  if (action === 'pass') {
    passedProfileIds.value.push(profile.id)
  }

  if (action === 'like') {
    likedProfileIds.value.push(profile.id)
  }

  if (action === 'super-like') {
    superLikedProfileIds.value.push(profile.id)
  }

  // DEMO MATCH: LIKE ON IRINA
  if (action === 'like' && profile.id === 1) {
    matchedProfile.value = profile
    showMatchModal.value = true
  }

  nextProfile()
}

function passProfile() {
  registerAction('pass')
}

function likeProfile() {
  registerAction('like')
}

function superLikeProfile() {
  registerAction('super-like')
}

// UNDO
function undoProfile() {
  if (!canUndo.value) return

  const lastAction = history.value.pop()

  if (!lastAction) return

  if (lastAction.action === 'pass') {
    passedProfileIds.value = passedProfileIds.value.filter(
      id => id !== lastAction.profileId
    )
  }

  if (lastAction.action === 'like') {
    likedProfileIds.value = likedProfileIds.value.filter(
      id => id !== lastAction.profileId
    )
  }

  if (lastAction.action === 'super-like') {
    superLikedProfileIds.value = superLikedProfileIds.value.filter(
      id => id !== lastAction.profileId
    )
  }

  currentIndex.value = lastAction.previousIndex
}

// FILTERS
function applyFilters(newFilters: typeof filters.value) {
  filters.value = { ...newFilters }

  currentIndex.value = 0
  history.value = []

  profiles.value = allProfiles.filter(profile => {
    const ageMatches =
      profile.age >= filters.value.minAge &&
      profile.age <= filters.value.maxAge

    const distanceMatches =
      profile.distance <= filters.value.maxDistance

    const verifiedMatches =
      !filters.value.verifiedStudentsOnly ||
      profile.verifiedStudent

    const universityMatches =
      !filters.value.sameUniversityOnly ||
      profile.university === 'UBB'

    const interestsMatch =
      filters.value.interests.length === 0 ||
      filters.value.interests.some(interest =>
        profile.interests.some(
          profileInterest =>
            profileInterest.toLowerCase() === interest.toLowerCase()
        )
      )

    return (
      ageMatches &&
      distanceMatches &&
      verifiedMatches &&
      universityMatches &&
      interestsMatch
    )
  })
}

// OPEN CHAT FROM SIDEBAR
function openChat(chatId: number) {
  // 1. Caută în chat-urile active din store
  const storeChat = storeChats.value.find(chat => chat.id === chatId)
  if (storeChat) {
    activeChat.value = {
      id: storeChat.id,
      name: storeChat.name,
      image: storeChat.image,
      message: storeChat.message,
      unread: false
    }
    storeChat.unread = false
    activePage.value = 'chat'
    return
  }

  // 2. Caută în match-urile noi din store
  const storeMatch = storeMatches.value.find(match => match.id === chatId)
  if (storeMatch) {
    activeChat.value = {
      id: storeMatch.id,
      name: storeMatch.name,
      image: storeMatch.image,
      message: 'Start a conversation...',
      unread: false
    }
    activePage.value = 'chat'
    return
  }

  // 3. Fallback pe chat-urile/match-urile locale (ex: demo match-ul cu Irina)
  const existingChat = chats.value.find(chat => chat.id === chatId)
  if (existingChat) {
    activeChat.value = existingChat
    existingChat.unread = false
    activePage.value = 'chat'
    return
  }

  const matchedUser = matches.value.find(match => match.id === chatId)
  if (matchedUser) {
    const newChat: Chat = {
      id: matchedUser.id,
      name: matchedUser.name,
      image: matchedUser.image,
      message: 'Start a conversation...',
      unread: false
    }
    chats.value.push(newChat)
    activeChat.value = newChat
    activePage.value = 'chat'
  }
}

// RETURN FROM CHAT
function closeChat() {
  activeChat.value = null
  router.push({ path: '/dating' })
}

// LIKE BACK
function likeBack(profileId: number) {
  const profile = likedProfiles.value.find(
    item => item.id === profileId
  )

  if (!profile) return

  likedProfiles.value = likedProfiles.value.filter(
    item => item.id !== profileId
  )

  const newMatch: Match = {
    id: profile.id,
    name: profile.name,
    image: profile.image
  }

  matches.value.push(newMatch)
}

// MATCH MODAL ACTIONS
function sendMessage() {
  if (!matchedProfile.value) return

  const profile = matchedProfile.value
  let chat = chats.value.find(item => item.id === profile.id)

  if (!chat) {
    chat = {
      id: profile.id,
      name: profile.name,
      image: profile.photos[0],
      message: 'Start a conversation...',
      unread: false
    }
    chats.value.push(chat)
  }

  showMatchModal.value = false
  router.push({
    path: '/dating',
    query: { view: 'chat', chatId: String(profile.id) }
  })
}

function continueDiscovery() {
  showMatchModal.value = false
}

watch(
  [
    () => route.query.view,
    () => route.query.chatId,
    () => storeChats.value.length,
    () => storeMatches.value.length
  ],
  ([newView, newChatId]) => {
    if (newView === 'likes') {
      activeChat.value = null
      activePage.value = 'likes'
    } else if (newView === 'chat' && newChatId) {
      openChat(Number(newChatId))
    } else {
      activeChat.value = null
      activePage.value = 'discovery'
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="dating-page relative min-h-full bg-[#090b18] px-6 py-5 text-white">

    <div
      v-if="activePage === 'discovery'"
      class="mb-3 flex justify-end md:mb-0 md:absolute md:top-5 md:right-7 z-10"
    >
      <button
        @click="showFilters = true"
        class="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-4 py-2.5 text-[13px] font-medium text-white transition-all duration-200 hover:border-rose-600 hover:bg-rose-600/20 cursor-pointer"
      >
        <SlidersHorizontal :size="18" />
        Filters
      </button>
    </div>

    <main class="dating-layout">

      <!-- SIDEBAR -->
      <DatingSidebar
        :matches="matches"
        :chats="chats"
        :likes-count="likedProfiles.length"
        @open-chat="openChat"
        @open-likes="activePage = 'likes'"
      />

      <!-- DISCOVERY -->
      <section
        v-if="activePage === 'discovery'"
        class="mx-auto flex w-full max-w-[420px] flex-col items-center pb-8"
      >
        <div class="mb-4 flex w-full items-center justify-between">
          <div>
            <h1 class="text-xl font-bold text-white">Discover people</h1>
            <p class="text-xs text-slate-400">Maybe your next connection starts here.</p>
          </div>

          <span class="flex items-center gap-2 text-xs text-slate-300">
            <span class="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
            Dating mode
          </span>
        </div>

        <ProfileCard
          v-if="currentProfile && !filters.isPaused"
          :profile="currentProfile"
        />

        <div
          v-else
          class="mt-6 flex w-full max-w-[420px] flex-col items-center rounded-3xl border border-white/10 bg-slate-900/50 px-7 py-14 text-center shadow-2xl backdrop-blur-md"
        >
          <!-- Iconiță cu efect de glow -->
          <div class="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.2)]">
            <PauseCircle v-if="filters.isPaused" :size="30" />
            <Compass v-else :size="30" />
          </div>

          <!-- Titlu -->
          <h2 class="mb-2 text-xl font-bold tracking-tight text-white">
            {{
              filters.isPaused
                ? 'Your Dating profile is paused'
                : 'You have seen everyone nearby!'
            }}
          </h2>

          <!-- Subtitlu -->
          <p class="mb-7 max-w-[280px] text-sm leading-relaxed text-slate-400">
            {{
              filters.isPaused
                ? 'You can reactivate your profile anytime from your filters.'
                : 'Try changing your preferences to discover more people.'
            }}
          </p>

          <!-- Buton CTA -->
          <button
            @click="showFilters = true"
            class="flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-600/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-500 active:translate-y-0 cursor-pointer"
          >
            <SlidersHorizontal :size="16" />
            Modify Filters
          </button>
        </div>

        <ActionButtons
          v-if="currentProfile"
          :can-undo="canUndo"
          :disabled="actionsDisabled"
          @pass="passProfile"
          @like="likeProfile"
          @super-like="superLikeProfile"
          @undo="undoProfile"
        />
      </section>

      <!-- LIKES YOU -->
      <section
        v-else-if="activePage === 'likes'"
        class="likes-content"
      >
        <LikesYou
          :profiles="likedProfiles"
          :blurred="true"
          @like-back="likeBack"
        />
      </section>

      <!-- CHAT -->
      <section
        v-else-if="activePage === 'chat' && activeChat"
        class="chat-content"
      >
        <ChatView
          :key="activeChat.id"
          :contact-name="activeChat.name"
          :contact-image="activeChat.image"
          @back="closeChat"
        />
      </section>

    </main>

    <!-- FILTER DRAWER -->
    <FilterDrawer
      :visible="showFilters"
      :is-verified-student="isVerifiedStudent"
      :initial-filters="filters"
      @close="showFilters = false"
      @apply="applyFilters"
    />

    <!-- MATCH MODAL -->
    <MatchModal
      :visible="showMatchModal"
      :current-user-image="currentUser.image"
      :matched-user-image="matchedProfile?.photos[0] ?? ''"
      :matched-user-name="matchedProfile?.name ?? ''"
      @send-message="sendMessage"
      @continue="continueDiscovery"
    />

  </div>
</template>

<!-- <style scoped>
.dating-page {
  min-height: 100vh;
  background: #090b18;
  color: white;
  padding: 20px 3%;
  font-family: Inter, sans-serif;
}

.dating-layout {
  display: grid;
  grid-template-columns: 290px minmax(0, 1fr);
  gap: 50px; /* Spațiu clar și elegant între sidebar și card */
  max-width: 850px; /* SECRETUL AICI: Scăzut de la 1250px la 850px */
  margin: 28px auto; /* Centrează întregul bloc pe mijlocul monitorului */
}

.discovery-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 440px; /* Cardurile de dating arată mai bine puțin mai înguste */
  margin: 0 auto; /* Acum se va centra perfect într-un spațiu logic */
  padding-bottom: 30px;
}

.discovery-heading {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.discovery-heading h1 {
  font-size: 23px;
  margin: 0 0 4px;
}

.discovery-heading p {
  color: #999;
  font-size: 13px;
  margin: 0;
}

.online-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #ddd;
}

.online-label span {
  width: 8px;
  height: 8px;
  background: #22c55e;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(34,197,94,0.6); /* NOU: Am adăugat puțin glow pe bulina verde */
}

.empty-state {
  width: 100%;
  max-width: 460px;
  padding: 60px 25px;
  text-align: center;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  background: rgba(255,255,255,0.04);
}

.empty-state p {
  color: #999;
  font-size: 13px;
}

.empty-state button {
  margin-top: 15px;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  background: #e11d48;
  color: white;
  cursor: pointer;
}

.likes-content,
.chat-content {
  min-width: 0;
  width: 100%;
}

.chat-content {
  height: 650px;
}

@media (max-width: 850px) {
  .dating-layout {
    grid-template-columns: 1fr;
  }

  .chat-content {
    height: 600px;
  }
}
</style> -->
