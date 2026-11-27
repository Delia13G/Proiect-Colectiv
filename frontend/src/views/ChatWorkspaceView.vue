<!-- frontend/src/views/ChatWorkspaceView.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { MessageSquare, MessageSquarePlus, Sparkles, ArrowLeft } from 'lucide-vue-next';
import ChatListView, { type ChatListItem } from '../components/chat/ChatListView.vue';
import MainChatView from '../components/chat/MainChatView.vue';
import NewChatModal, {
  type ChatContact,
  type CreateChatPayload,
} from '../components/chat/NewChatModal.vue';
import ChatProfilePanel, {
  type ProfilePanelTab,
} from '../components/chat/ChatProfilePanel.vue';
import type {
  ChatEditPayload,
  ChatSendPayload,
} from '../components/chat/ChatInput.vue';
import type { ChatEntityId, ChatLens, ChatMessage } from '../types/chat';
import { useChatStore, type CallMode } from '../stores/useChatStore';
import { getLensTheme, getChatRouteNameForLens } from '../utils/lensTheme';

interface Props {
  activeLens: ChatLens;
  chatId?: ChatEntityId | null;
}

const props = withDefaults(defineProps<Props>(), {
  chatId: null,
});

const router = useRouter();
const chatStore = useChatStore();

const PROFILE_PANEL_ID = 'chat-workspace-profile-panel';

const mainChatRef = ref<InstanceType<typeof MainChatView> | null>(null);
const isNewChatModalOpen = ref(false);
const isProfilePanelOpen = ref(false);
const profilePanelTab = ref<ProfilePanelTab>('about');
const isMac = ref(false);

const chatRouteName = computed(() => getChatRouteNameForLens(props.activeLens));
const lensAccent = computed(() => getLensTheme(props.activeLens));
const searchShortcutLabel = computed(() => (isMac.value ? '⌘K' : 'Ctrl+K'));

const currentChatId = computed<ChatEntityId | null>(() => {
  if (props.chatId === null || props.chatId === undefined) return null;
  if (typeof props.chatId === 'string' && !props.chatId.trim()) return null;
  return props.chatId;
});

const lensChats = computed(() => chatStore.getChats(props.activeLens));
const lensContacts = computed(() => chatStore.getContacts(props.activeLens));
const existingDirectChatMap = computed(() =>
  chatStore.getExistingDirectChatMap(props.activeLens)
);
const unreadChatsCount = computed(() =>
  chatStore.getUnreadChatsCount(props.activeLens)
);

const activeChat = computed(() =>
  chatStore.getChatById(props.activeLens, currentChatId.value)
);

// Protecție: deschide conversația doar dacă ID-ul din URL chiar există pe lentila activă
const hasOpenChat = computed(
  () => currentChatId.value !== null && activeChat.value !== null
);
const hasInvalidChatId = computed(
  () => currentChatId.value !== null && activeChat.value === null
);

const activeIsGroup = computed(() => Boolean(activeChat.value?.isGroup));
const activeDirectUser = computed(() =>
  chatStore.getDirectUser(props.activeLens, currentChatId.value)
);
const activeGroup = computed(() => chatStore.getGroup(currentChatId.value));
const activeMessages = computed(() => chatStore.getMessages(currentChatId.value));
const activeProfileDetails = computed(() =>
  chatStore.getProfileDetails(currentChatId.value)
);
const activeSharedMedia = computed(() =>
  chatStore.getSharedMedia(currentChatId.value)
);
const activeSharedFiles = computed(() =>
  chatStore.getSharedFiles(currentChatId.value)
);
const isActiveChatBlocked = computed(() =>
  chatStore.isChatBlocked(currentChatId.value)
);
const activeCallControls = computed(() =>
  chatStore.getCallControls(currentChatId.value)
);

// Marchează conversația ca citită la deschidere și închide panoul dacă nu ai chat valid
watch(
  [currentChatId, activeChat],
  ([id, chat]) => {
    if (id === null || !chat) {
      isProfilePanelOpen.value = false;
      return;
    }
    chatStore.markChatAsRead(props.activeLens, id);
  },
  { immediate: true }
);

// Resetare overlay-uri la schimbarea lentilei (PRO / SOCIAL / DATE)
watch(
  () => props.activeLens,
  () => {
    isNewChatModalOpen.value = false;
    isProfilePanelOpen.value = false;
  }
);

const navigateToChat = (id: ChatEntityId) => {
  router.push({
    name: chatRouteName.value,
    params: { id: String(id) },
  });
};

const handleSelectChat = (chat: ChatListItem) => {
  chatStore.markChatAsRead(props.activeLens, chat.id);
  navigateToChat(chat.id);
};

const handleBackToList = () => {
  isProfilePanelOpen.value = false;
  router.push({ name: chatRouteName.value });
};

// ==========================================
// PANOU PROFIL / GRUP, JUMP-TO-MESSAGE & APELURI
// ==========================================
const toggleProfilePanel = (requestedTab: ProfilePanelTab) => {
  if (isProfilePanelOpen.value && profilePanelTab.value === requestedTab) {
    isProfilePanelOpen.value = false;
    return;
  }
  profilePanelTab.value = requestedTab;
  isProfilePanelOpen.value = true;
};

const handleOpenProfile = () => {
  toggleProfilePanel(activeIsGroup.value ? 'members' : 'about');
};

const handleOpenMembers = () => {
  toggleProfilePanel('members');
};

const handleJumpToMessage = (messageId: ChatEntityId) => {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 1279px)').matches
  ) {
    isProfilePanelOpen.value = false;
  }
  mainChatRef.value?.jumpToMessage(messageId);
};

const handleToggleCall = (callType: CallMode) => {
  if (!activeChat.value) return;
  chatStore.toggleCall(props.activeLens, activeChat.value.id, callType);
};

const handleLeaveGroup = () => {
  if (!activeChat.value) return;
  chatStore.leaveGroup(props.activeLens, activeChat.value.id);
  isProfilePanelOpen.value = false;
  router.push({ name: chatRouteName.value });
};

const handleAddMemberToGroup = (contact: ChatContact) => {
  if (!activeChat.value) return;
  chatStore.addMemberToGroup(activeChat.value.id, contact);
};

const handleToggleGroupAdmin = (memberId: string) => {
  if (!activeChat.value) return;
  chatStore.toggleGroupAdmin(activeChat.value.id, memberId);
};

const handleRemoveMemberFromGroup = (memberId: string) => {
  if (!activeChat.value) return;
  chatStore.removeMemberFromGroup(props.activeLens, activeChat.value.id, memberId);
};

const handleOpenMutualGroup = (groupName: string) => {
  const matchedId = chatStore.findGroupChatIdByName(props.activeLens, groupName);
  if (matchedId !== null) {
    profilePanelTab.value = 'members';
    navigateToChat(matchedId);
  }
};

const handleMessageMember = (member: {
  id: string;
  name: string;
  avatarUrl?: string | null;
}) => {
  const targetId = chatStore.openOrCreateDirectChat(props.activeLens, member);
  profilePanelTab.value = 'about';
  navigateToChat(targetId);
};

const handleMentionClick = (username: string) => {
  if (username.toLowerCase() === chatStore.currentUsername.toLowerCase()) return;
  const contact = chatStore.findContactByUsername(props.activeLens, username);
  if (!contact) return;
  const targetId = chatStore.openOrCreateDirectChat(props.activeLens, {
    id: contact.id,
    name: contact.name,
    avatarUrl: contact.avatarUrl,
  });
  navigateToChat(targetId);
};

// ==========================================
// MODAL NEW CHAT & HANDLERE MESAJE
// ==========================================
const handleOpenExistingFromModal = (existingId: ChatEntityId) => {
  isNewChatModalOpen.value = false;
  navigateToChat(existingId);
};

const handleCreateChat = (payload: CreateChatPayload) => {
  const newId = chatStore.createChat(props.activeLens, payload);
  isNewChatModalOpen.value = false;
  navigateToChat(newId);
};

const handleMessageSent = (
  payload: ChatSendPayload,
  meta: { replyToId?: ChatEntityId }
) => {
  if (!activeChat.value) return;
  chatStore.sendMessage(props.activeLens, activeChat.value.id, payload, meta);
};

const handleMessageEdited = (payload: ChatEditPayload) => {
  if (!activeChat.value) return;
  chatStore.editMessage(props.activeLens, activeChat.value.id, payload);
};

const handleMessageDeleted = (deleted: ChatMessage) => {
  if (!activeChat.value) return;
  chatStore.deleteMessage(props.activeLens, activeChat.value.id, deleted);
};

const handleMessageReacted = ({
  messageId,
  emoji,
}: {
  messageId: ChatEntityId;
  emoji: string;
}) => {
  if (!activeChat.value) return;
  chatStore.reactToMessage(activeChat.value.id, messageId, emoji);
};

const handleMessageRetried = (retried: ChatMessage) => {
  if (!activeChat.value) return;
  chatStore.retryMessage(props.activeLens, activeChat.value.id, retried);
};

const handleClearChat = () => {
  if (!activeChat.value) return;
  chatStore.clearChat(props.activeLens, activeChat.value.id);
};

// Shortcut Alt+N protejat împotriva AltGr, câmpuri editabile și modale deschise
const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
};

const handleGlobalShortcut = (e: KeyboardEvent) => {
  if (e.defaultPrevented || e.repeat) return;
  if (isEditableTarget(e.target)) return;
  if (
    typeof document !== 'undefined' &&
    document.querySelector('[aria-modal="true"], dialog[open]')
  ) {
    return;
  }

  if (
    e.altKey &&
    !e.ctrlKey &&
    !e.metaKey &&
    !e.shiftKey &&
    e.code === 'KeyN'
  ) {
    e.preventDefault();
    isNewChatModalOpen.value = true;
  }
};

onMounted(() => {
  isMac.value = /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
  window.addEventListener('keydown', handleGlobalShortcut);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalShortcut);
});
</script>

<template>
  <div class="relative flex h-full w-full min-h-0 overflow-hidden bg-slate-950">
    <!-- COLOANA 1: Lista de conversații -->
    <aside
      class="h-full min-h-0 shrink-0 flex-col lg:w-80 xl:w-[340px]"
      :class="hasOpenChat ? 'hidden lg:flex' : 'flex w-full'"
    >
      <ChatListView
        variant="sidebar"
        :active-lens="activeLens"
        :chats="lensChats"
        :active-chat-id="currentChatId"
        :connection-status="chatStore.connectionStatus"
        @select="handleSelectChat"
        @toggle-pin="chatStore.togglePin(activeLens, $event)"
        @toggle-mute="chatStore.toggleMute(activeLens, $event)"
        @toggle-read="chatStore.toggleRead(activeLens, $event)"
        @new-chat="isNewChatModalOpen = true"
      />
    </aside>

    <!-- COLOANA 2: Conversația activă sau Empty / Not-Found State -->
    <section
      class="flex-1 min-w-0 h-full min-h-0 flex-col"
      :class="hasOpenChat || hasInvalidChatId ? 'flex' : 'hidden lg:flex'"
    >
      <MainChatView
        v-if="hasOpenChat && activeChat"
        ref="mainChatRef"
        :active-lens="activeLens"
        :chat-id="activeChat.id"
        :is-group="activeIsGroup"
        :user="activeDirectUser"
        :group="activeGroup"
        :messages="activeMessages"
        :connection-status="chatStore.connectionStatus"
        :calls="activeCallControls"
        :current-user-id="chatStore.currentUserId"
        :current-username="chatStore.currentUsername"
        :is-muted="Boolean(activeChat.isMuted)"
        :is-blocked="isActiveChatBlocked"
        :is-profile-open="isProfilePanelOpen"
        :is-members-open="isProfilePanelOpen && profilePanelTab === 'members'"
        :profile-panel-id="PROFILE_PANEL_ID"
        :members-panel-id="PROFILE_PANEL_ID"
        :unread-chats-count="unreadChatsCount"
        :interactive-mentions="true"
        @back="handleBackToList"
        @voice-call="handleToggleCall('voice')"
        @video-call="handleToggleCall('video')"
        @open-profile="handleOpenProfile"
        @open-members="handleOpenMembers"
        @toggle-mute="chatStore.setMuted(activeLens, activeChat.id, $event)"
        @send-message="handleMessageSent"
        @edit-message="handleMessageEdited"
        @delete-message="handleMessageDeleted"
        @react-message="handleMessageReacted"
        @retry-message="handleMessageRetried"
        @clear-chat="handleClearChat"
        @mention-click="handleMentionClick"
      />

      <!-- Conversație inexistentă (ex. URL cu ID șters sau din altă lentilă) -->
      <div
        v-else-if="hasInvalidChatId"
        class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/40 select-none"
      >
        <div
          class="w-14 h-14 rounded-2xl border border-white/10 bg-slate-900 flex items-center justify-center mb-4 text-slate-400"
        >
          <MessageSquare :size="24" aria-hidden="true" />
        </div>
        <h2 class="text-lg font-bold text-white mb-1.5">Conversation not found</h2>
        <p class="text-xs text-slate-400 max-w-xs mb-5 leading-relaxed">
          This conversation may have been removed or belongs to a different lens.
        </p>
        <button
          type="button"
          @click="handleBackToList"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <ArrowLeft :size="15" aria-hidden="true" />
          <span>Back to conversations</span>
        </button>
      </div>

      <!-- Empty State când nu e selectată nicio conversație -->
      <div
        v-else
        class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/40 select-none"
      >
        <div
          class="w-16 h-16 rounded-2xl border flex items-center justify-center mb-5 shadow-lg"
          :class="lensAccent.soft"
        >
          <MessageSquare :size="28" :class="lensAccent.text" aria-hidden="true" />
        </div>

        <h2 class="text-xl font-bold text-white mb-2">
          Your {{ activeLens.toLowerCase() }} conversations
        </h2>
        <p class="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
          Select a conversation from the left or start a new direct message{{
            activeLens === 'DATE' ? '.' : ' or team group.'
          }}
        </p>

        <div class="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            @click="isNewChatModalOpen = true"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:opacity-95 active:scale-95 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            :class="lensAccent.bg"
          >
            <MessageSquarePlus :size="17" aria-hidden="true" />
            <span>New conversation</span>
          </button>

          <span
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-400"
          >
            <Sparkles :size="14" :class="lensAccent.text" aria-hidden="true" />
            <kbd
              class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px] border border-white/10"
            >
              Alt+N
            </kbd>
            new ·
            <kbd
              class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px] border border-white/10"
            >
              {{ searchShortcutLabel }}
            </kbd>
            search
          </span>
        </div>
      </div>
    </section>

    <!-- COLOANA 3 / DRAWER: Profil Persoană sau Detalii Grup -->
    <ChatProfilePanel
      v-if="hasOpenChat && activeChat"
      :open="isProfilePanelOpen"
      :active-lens="activeLens"
      :conversation-id="activeChat.id"
      :panel-id="PROFILE_PANEL_ID"
      :is-group="activeIsGroup"
      :user="activeDirectUser"
      :group="activeGroup"
      :profile="activeProfileDetails"
      :messages="activeMessages"
      :media-items="activeSharedMedia"
      :file-items="activeSharedFiles"
      :can-jump-to-message="true"
      :available-contacts="lensContacts"
      :current-user-id="chatStore.currentUserId"
      :current-user-name="chatStore.currentUserName"
      :current-user-avatar-url="chatStore.currentUserAvatarUrl"
      :initial-tab="profilePanelTab"
      :calls="activeCallControls"
      :connection-status="chatStore.connectionStatus"
      :is-muted="Boolean(activeChat.isMuted)"
      :is-pinned="Boolean(activeChat.isPinned)"
      :is-blocked="isActiveChatBlocked"
      @close="isProfilePanelOpen = false"
      @voice-call="handleToggleCall('voice')"
      @video-call="handleToggleCall('video')"
      @toggle-mute="chatStore.toggleMute(activeLens, activeChat.id)"
      @toggle-pin="chatStore.togglePin(activeLens, activeChat.id)"
      @toggle-block="chatStore.toggleBlock(activeLens, activeChat.id)"
      @clear-chat="handleClearChat"
      @leave-group="handleLeaveGroup"
      @add-member="handleAddMemberToGroup"
      @toggle-admin="handleToggleGroupAdmin"
      @remove-member="handleRemoveMemberFromGroup"
      @open-mutual-group="handleOpenMutualGroup"
      @message-member="handleMessageMember"
      @jump-to-message="handleJumpToMessage"
    />

    <!-- MODAL CREARE CONVERSAȚIE / GRUP -->
    <NewChatModal
      :open="isNewChatModalOpen"
      :active-lens="activeLens"
      :contacts="lensContacts"
      :existing-direct-chat-map="existingDirectChatMap"
      :connection-status="chatStore.connectionStatus"
      @close="isNewChatModalOpen = false"
      @open-existing="handleOpenExistingFromModal"
      @create="handleCreateChat"
    />
  </div>
</template>