<!-- src/components/chat/ChatHeader.vue -->
<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  onUnmounted,
  useSlots,
  Comment,
  Text,
  Fragment,
  type VNode,
} from 'vue';
import {
  Phone,
  Video,
  MoreVertical,
  ChevronLeft,
  Search,
  User,
  BellOff,
  Loader2,
  WifiOff,
} from 'lucide-vue-next';
import AppTooltip from '../ui/AppTooltip.vue';
import { getAvatarInitials, getAvatarTone } from '../../utils/avatar';
import type { ChatTheme } from '../../types/chat';

export type PresenceStatus = 'online' | 'away' | 'busy' | 'dnd' | 'offline';
export type ConnectionStatus = 'connected' | 'reconnecting' | 'offline';
export type BackButtonVisibility = 'auto' | 'always' | 'never';

/** Date strict de prezentare — complet decuplate de ChatUser / GroupChat */
export interface ChatHeaderSubject {
  title: string;
  /** Text sub titlu (ex. "12 membri", "Last seen 5m ago"). Dacă lipsește, se folosește label-ul pentru `presence`. */
  subtitle?: string | null;
  avatarUrl?: string | null;
  presence?: PresenceStatus | null;
  /** Ex. "Typing" (1-la-1) sau "Ana is typing" (grup) */
  typingText?: string | null;
  isMuted?: boolean;
  highlightSubtitle?: boolean;
}

export type CallCapability =
  | { status: 'available' }
  | { status: 'disabled'; reason?: string }
  | { status: 'hidden' };

export type ActiveCallState =
  | { status: 'idle' }
  | {
      status: 'active';
      type: 'voice' | 'video';
      inCurrentChat: boolean;
      /** Durată formatată, ex. "04:12" (relevantă când inCurrentChat este true) */
      duration?: string;
    };

export interface ChatHeaderCallControls {
  voice?: CallCapability;
  video?: CallCapability;
  activeCall?: ActiveCallState;
}

export interface DisclosurePanelState {
  isOpen: boolean;
  controlsId?: string;
}

export interface ChatHeaderPanelsState {
  profile?: DisclosurePanelState;
  search?: DisclosurePanelState;
  options?: DisclosurePanelState;
}

export interface ChatHeaderLabels {
  presence: Record<PresenceStatus, string>;
  connected: string;
  reconnecting: string;
  waitingForNetwork: string;
  searchInChat: string;
  voiceCall: string;
  videoCall: string;
  returnToVoiceCall: string;
  returnToVideoCall: string;
  voiceCallsUnavailable: string;
  videoCallsUnavailable: string;
  callDisabledOffline: string;
  callDisabledInVoiceCall: string;
  callDisabledInVideoCall: string;
  callDisabledInAnotherChat: string;
  moreOptions: string;
  backToChatList: string;
  unreadChats: (count: number) => string;
  notificationsMuted: string;
  loadingConversation: string;
  viewProfileDetails: string;
}

export type ChatHeaderLabelOverrides = Partial<Omit<ChatHeaderLabels, 'presence'>> & {
  presence?: Partial<Record<PresenceStatus, string>>;
};

const DEFAULT_LABELS: ChatHeaderLabels = {
  presence: {
    online: 'Online',
    away: 'Away',
    busy: 'Busy',
    dnd: 'Do not disturb',
    offline: 'Offline',
  },
  connected: 'Connected',
  reconnecting: 'Reconnecting...',
  waitingForNetwork: 'Waiting for network...',
  searchInChat: 'Search in chat',
  voiceCall: 'Voice call',
  videoCall: 'Video call',
  returnToVoiceCall: 'Return to voice call',
  returnToVideoCall: 'Return to video call',
  voiceCallsUnavailable: 'Voice calls unavailable',
  videoCallsUnavailable: 'Video calls unavailable',
  callDisabledOffline: 'Reconnect to start a call',
  callDisabledInVoiceCall: 'Already in a voice call',
  callDisabledInVideoCall: 'Already in a video call',
  callDisabledInAnotherChat: 'Active call in another conversation',
  moreOptions: 'More options',
  backToChatList: 'Back to chat list',
  unreadChats: (count: number) => `${count} unread`,
  notificationsMuted: 'Notifications muted',
  loadingConversation: 'Loading conversation',
  viewProfileDetails: 'View profile details',
};

export interface ChatHeaderProps {
  theme: ChatTheme;
  subject: ChatHeaderSubject | null;
  isLoading?: boolean;
  connectionStatus?: ConnectionStatus;
  calls?: ChatHeaderCallControls;
  panels?: ChatHeaderPanelsState;
  showSearch?: boolean;
  backButton?: BackButtonVisibility;
  unreadChatsCount?: number;
  enableShortcuts?: boolean;
  sticky?: boolean;
  labels?: ChatHeaderLabelOverrides;
}

const props = withDefaults(defineProps<ChatHeaderProps>(), {
  isLoading: false,
  connectionStatus: 'connected',
  calls: () => ({}),
  panels: () => ({}),
  showSearch: true,
  backButton: 'auto',
  unreadChatsCount: 0,
  enableShortcuts: true,
  sticky: true,
  labels: () => ({}),
});

const emit = defineEmits<{
  back: [];
  openProfile: [];
  search: [];
  voiceCall: [];
  videoCall: [];
  options: [];
}>();

const slots = useSlots();

// Focus management expus părintelui (ex. la închiderea meniului / căutării cu Escape)
const backBtnRef = ref<HTMLButtonElement | null>(null);
const profileBtnRef = ref<HTMLButtonElement | null>(null);
const searchBtnRef = ref<HTMLButtonElement | null>(null);
const optionsBtnRef = ref<HTMLButtonElement | null>(null);

defineExpose({
  focusBackButton: () => backBtnRef.value?.focus(),
  focusProfileButton: () => profileBtnRef.value?.focus(),
  focusSearchButton: () => searchBtnRef.value?.focus(),
  focusOptionsButton: () => optionsBtnRef.value?.focus(),
});

// Etichete i18n cu merge pe `presence`
const t = computed<ChatHeaderLabels>(() => ({
  ...DEFAULT_LABELS,
  ...props.labels,
  presence: {
    ...DEFAULT_LABELS.presence,
    ...props.labels?.presence,
  },
}));

const showContent = computed(() => !props.isLoading && props.subject !== null);
const title = computed(() => props.subject?.title.trim() ?? '');
const avatarUrl = computed<string | null>(() => {
  const trimmed = props.subject?.avatarUrl?.trim();
  return trimmed ? trimmed : null;
});
const presence = computed<PresenceStatus | null>(() => props.subject?.presence ?? null);
const typingText = computed(() => props.subject?.typingText?.trim() ?? '');
const isMuted = computed(() => Boolean(props.subject?.isMuted));

const safeUnreadCount = computed(() => {
  const value = Number(props.unreadChatsCount);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
});

// Stări panouri
const profilePanel = computed(() => props.panels.profile);
const searchPanel = computed(() => props.panels.search);
const optionsPanel = computed(() => props.panels.options);

// Shortcut Ctrl+F / Cmd+F (SSR-safe, protecție platformă, key-repeat și modale deschise)
const isMac = ref(false);
const searchShortcutLabel = computed(() => (isMac.value ? '⌘F' : 'Ctrl+F'));

const onKeyDown = (event: KeyboardEvent) => {
  if (event.defaultPrevented || event.repeat) return;
  if (!props.enableShortcuts || !props.showSearch || !showContent.value) return;
  if (
    typeof document !== 'undefined' &&
    document.querySelector('[aria-modal="true"], dialog[open]')
  ) {
    return;
  }

  const isModifierPressed = isMac.value
    ? event.metaKey && !event.ctrlKey
    : event.ctrlKey && !event.metaKey;

  if (isModifierPressed && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'f') {
    event.preventDefault();
    emit('search');
  }
};

// Gestionare imagine avatar + sincronizare cache browser (cu gardă anti-race)
type ImageState = 'loading' | 'loaded' | 'error';
const imgRef = ref<HTMLImageElement | null>(null);
const imageState = ref<ImageState>(avatarUrl.value ? 'loading' : 'error');

const syncCachedImage = async () => {
  const expectedUrl = avatarUrl.value;
  await nextTick();
  if (isUnmounted || avatarUrl.value !== expectedUrl || !showContent.value) return;

  const img = imgRef.value;
  if (!img || !img.complete) return;
  imageState.value = img.naturalWidth > 0 ? 'loaded' : 'error';
};

watch([avatarUrl, showContent], ([nextUrl, isVisible]) => {
  if (!nextUrl) {
    imageState.value = 'error';
    return;
  }
  imageState.value = 'loading';
  if (isVisible) {
    syncCachedImage();
  }
});

const onImageLoad = () => {
  imageState.value = 'loaded';
};

const onImageError = () => {
  imageState.value = 'error';
};

const avatarInitials = computed(() => getAvatarInitials(title.value, 2));
const showImage = computed(() => Boolean(avatarUrl.value) && imageState.value !== 'error');

const avatarSurfaceClass = computed(() => {
  if (showImage.value || !avatarInitials.value) {
    return 'bg-slate-800 border-slate-700/60';
  }
  const tone = getAvatarTone(title.value);
  return `${tone.surface} ${tone.border}`;
});

// Conexiune, prezență și rândul de status
const isConnected = computed(() => props.connectionStatus === 'connected');
const showPresenceDot = computed(() => presence.value !== null);

const PRESENCE_DOT_CLASSES: Record<PresenceStatus, string> = {
  online: 'bg-emerald-500',
  away: 'bg-amber-400',
  busy: 'bg-rose-500',
  dnd: 'bg-rose-500',
  offline: 'bg-slate-500',
};

const presenceDotClass = computed(() => {
  if (!isConnected.value || !presence.value) return 'bg-slate-500';
  return PRESENCE_DOT_CLASSES[presence.value];
});

const showTypingIndicator = computed(() => isConnected.value && Boolean(typingText.value));

const resolvedSubtitle = computed(() => {
  const rawSubtitle = props.subject?.subtitle;
  if (rawSubtitle !== undefined && rawSubtitle !== null) {
    return rawSubtitle.trim();
  }
  if (presence.value) {
    return t.value.presence[presence.value];
  }
  return '';
});

const statusLabel = computed(() => {
  if (props.connectionStatus === 'reconnecting') return t.value.reconnecting;
  if (props.connectionStatus === 'offline') return t.value.waitingForNetwork;
  if (typingText.value) return typingText.value;
  return resolvedSubtitle.value;
});

const hasStatusRow = computed(
  () =>
    props.connectionStatus !== 'connected' ||
    showTypingIndicator.value ||
    Boolean(statusLabel.value)
);

const statusTextClass = computed(() => {
  if (props.connectionStatus === 'reconnecting') return 'text-amber-400';
  if (props.connectionStatus === 'offline') return 'text-slate-400';
  if (
    typingText.value ||
    props.subject?.highlightSubtitle ||
    presence.value === 'online'
  ) {
    return props.theme.text;
  }
  return 'text-slate-400';
});

// Logică apeluri bazată pe Discriminated Unions (fără stări contradictorii)
const voiceCapability = computed<CallCapability>(
  () => props.calls.voice ?? { status: 'available' }
);
const videoCapability = computed<CallCapability>(
  () => props.calls.video ?? { status: 'available' }
);
const activeCall = computed<ActiveCallState>(
  () => props.calls.activeCall ?? { status: 'idle' }
);

const showVoiceCall = computed(() => voiceCapability.value.status !== 'hidden');
const showVideoCall = computed(() => videoCapability.value.status !== 'hidden');

const isActiveVoiceHere = computed(
  () =>
    activeCall.value.status === 'active' &&
    activeCall.value.type === 'voice' &&
    activeCall.value.inCurrentChat
);
const isActiveVideoHere = computed(
  () =>
    activeCall.value.status === 'active' &&
    activeCall.value.type === 'video' &&
    activeCall.value.inCurrentChat
);
const hasActiveCallElsewhere = computed(
  () => activeCall.value.status === 'active' && !activeCall.value.inCurrentChat
);
const currentCallDuration = computed(() =>
  activeCall.value.status === 'active' && activeCall.value.inCurrentChat
    ? (activeCall.value.duration?.trim() || null)
    : null
);

const isVoiceDisabled = computed(() => {
  if (isActiveVoiceHere.value) return false;
  return (
    voiceCapability.value.status === 'disabled' ||
    hasActiveCallElsewhere.value ||
    isActiveVideoHere.value ||
    !isConnected.value
  );
});

const isVideoDisabled = computed(() => {
  if (isActiveVideoHere.value) return false;
  return (
    videoCapability.value.status === 'disabled' ||
    hasActiveCallElsewhere.value ||
    isActiveVoiceHere.value ||
    !isConnected.value
  );
});

const voiceTooltipText = computed(() => {
  if (isActiveVoiceHere.value) {
    return currentCallDuration.value
      ? `${t.value.returnToVoiceCall} (${currentCallDuration.value})`
      : t.value.returnToVoiceCall;
  }
  if (voiceCapability.value.status === 'disabled') {
    return voiceCapability.value.reason?.trim() || t.value.voiceCallsUnavailable;
  }
  if (hasActiveCallElsewhere.value) return t.value.callDisabledInAnotherChat;
  if (isActiveVideoHere.value) return t.value.callDisabledInVideoCall;
  if (!isConnected.value) return t.value.callDisabledOffline;
  return t.value.voiceCall;
});

const videoTooltipText = computed(() => {
  if (isActiveVideoHere.value) {
    return currentCallDuration.value
      ? `${t.value.returnToVideoCall} (${currentCallDuration.value})`
      : t.value.returnToVideoCall;
  }
  if (videoCapability.value.status === 'disabled') {
    return videoCapability.value.reason?.trim() || t.value.videoCallsUnavailable;
  }
  if (hasActiveCallElsewhere.value) return t.value.callDisabledInAnotherChat;
  if (isActiveVoiceHere.value) return t.value.callDisabledInVoiceCall;
  if (!isConnected.value) return t.value.callDisabledOffline;
  return t.value.videoCall;
});

const onVoiceCallClick = () => {
  if (isVoiceDisabled.value) return;
  emit('voiceCall');
};

const onVideoCallClick = () => {
  if (isVideoDisabled.value) return;
  emit('videoCall');
};

// Back button, aliniere profil și verificare reală de conținut în slotul #actions
const showBackButton = computed(() => props.backButton !== 'never');
const backButtonVisibilityClass = computed(() =>
  props.backButton === 'always' ? 'flex' : 'flex md:hidden'
);
const profileButtonMarginClass = computed(() => {
  if (props.backButton === 'never') return '-ml-1.5';
  if (props.backButton === 'auto') return 'md:-ml-1.5';
  return '';
});

const hasNonEmptyVNodes = (nodes: VNode[]): boolean =>
  nodes.some((node) => {
    if (node.type === Comment) return false;
    if (node.type === Text) {
      return typeof node.children === 'string' && node.children.trim().length > 0;
    }
    if (node.type === Fragment) {
      return Array.isArray(node.children) && hasNonEmptyVNodes(node.children as VNode[]);
    }
    return true;
  });

const hasCustomActions = computed(() => {
  const renderActions = slots.actions;
  return renderActions ? hasNonEmptyVNodes(renderActions()) : false;
});

const hasLeftActions = computed(
  () => props.showSearch || showVoiceCall.value || showVideoCall.value || hasCustomActions.value
);

// Etichete ARIA complete (includ statusul vizibil pentru utilizatorii de screen reader)
const backAriaLabel = computed(() =>
  safeUnreadCount.value > 0
    ? `${t.value.backToChatList}, ${t.value.unreadChats(safeUnreadCount.value)}`
    : t.value.backToChatList
);

const profileAriaLabel = computed(() => {
  const details = [
    statusLabel.value,
    isMuted.value ? t.value.notificationsMuted : '',
  ].filter(Boolean);
  const base = `${t.value.viewProfileDetails}${title.value ? ` — ${title.value}` : ''}`;
  return details.length > 0 ? `${base}, ${details.join(', ')}` : base;
});

// Anunțuri aria-live: tranziții de rețea + throttle pe typing (fără race conditions)
const TYPING_ANNOUNCE_COOLDOWN_MS = 6000;
const ANNOUNCEMENT_CLEAR_MS = 3000;

const liveAnnouncement = ref('');
let isUnmounted = false;
let announcementSeq = 0;
let announcementTimer: ReturnType<typeof setTimeout> | null = null;
let lastTypingAnnouncedAt = 0;

const pushLiveAnnouncement = async (message: string, autoClear = true) => {
  const seq = ++announcementSeq;
  if (announcementTimer) {
    clearTimeout(announcementTimer);
    announcementTimer = null;
  }

  // Reset scurt pentru a garanta re-anunțarea în screen reader dacă mesajul se repetă
  liveAnnouncement.value = '';
  await nextTick();
  if (isUnmounted || seq !== announcementSeq) return;

  liveAnnouncement.value = message;

  if (autoClear && message) {
    announcementTimer = setTimeout(() => {
      if (isUnmounted || seq !== announcementSeq) return;
      liveAnnouncement.value = '';
      announcementTimer = null;
    }, ANNOUNCEMENT_CLEAR_MS);
  }
};

watch(
  () => props.connectionStatus,
  (nextStatus, prevStatus) => {
    if (nextStatus === 'reconnecting') {
      pushLiveAnnouncement(t.value.reconnecting, false);
    } else if (nextStatus === 'offline') {
      pushLiveAnnouncement(t.value.waitingForNetwork, false);
    } else if (nextStatus === 'connected' && prevStatus && prevStatus !== 'connected') {
      pushLiveAnnouncement(t.value.connected, true);
      // Reîncearcă avatarul dacă a eșuat cât timp aplicația era offline
      if (avatarUrl.value && imageState.value === 'error') {
        imageState.value = 'loading';
        syncCachedImage();
      }
    }
  }
);

watch(
  () => props.subject?.title ?? null,
  () => {
    lastTypingAnnouncedAt = 0;
  }
);

watch([showTypingIndicator, typingText], ([isTypingNow, text]) => {
  if (!isTypingNow || !text) return;
  const now = Date.now();
  if (now - lastTypingAnnouncedAt < TYPING_ANNOUNCE_COOLDOWN_MS) return;

  lastTypingAnnouncedAt = now;
  const message = title.value && !text.includes(title.value) ? `${title.value} — ${text}` : text;
  pushLiveAnnouncement(message, true);
});

onMounted(() => {
  isMac.value = /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
  syncCachedImage();
  window.addEventListener('keydown', onKeyDown);
});

onUnmounted(() => {
  isUnmounted = true;
  window.removeEventListener('keydown', onKeyDown);
  if (announcementTimer) {
    clearTimeout(announcementTimer);
    announcementTimer = null;
  }
});
</script>

<template>
  <div class="shrink-0 z-20" :class="{ 'sticky top-0': sticky }">
    <header
      class="h-16 px-2 md:px-6 flex items-center justify-between gap-2 bg-slate-900/80 backdrop-blur-md border-b border-white/10 shadow-sm select-none"
    >
      <!-- Stânga: Back + Profil / Skeleton -->
      <div class="flex items-center gap-1 md:gap-3 flex-1 min-w-0">
        <button
          v-if="showBackButton"
          ref="backBtnRef"
          type="button"
          @click="emit('back')"
          class="relative min-w-[44px] min-h-[44px] md:min-w-[40px] md:min-h-[40px] items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-slate-400 shrink-0 cursor-pointer"
          :class="backButtonVisibilityClass"
          :aria-label="backAriaLabel"
        >
          <ChevronLeft :size="22" aria-hidden="true" />
          <span
            v-if="safeUnreadCount > 0"
            class="absolute top-1.5 right-1 min-w-[16px] h-4 px-1 rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950 flex items-center justify-center leading-none"
            aria-hidden="true"
          >
            {{ safeUnreadCount > 99 ? '99+' : safeUnreadCount }}
          </span>
        </button>

        <!-- Skeleton State -->
        <div
          v-if="!showContent"
          class="flex items-center gap-3 flex-1 min-w-0 motion-safe:animate-pulse"
          aria-busy="true"
          :aria-label="t.loadingConversation"
        >
          <div class="w-10 h-10 rounded-full bg-slate-800 shrink-0" />
          <div class="flex flex-col gap-2 flex-1 max-w-[180px]">
            <div class="h-3.5 bg-slate-800 rounded w-3/4" />
            <div class="h-2.5 bg-slate-800/80 rounded w-1/2" />
          </div>
        </div>

        <!-- Zona de Profil / Detalii conversație -->
        <button
          v-else
          ref="profileBtnRef"
          type="button"
          @click="emit('openProfile')"
          :aria-expanded="Boolean(profilePanel?.isOpen)"
          :aria-controls="profilePanel?.controlsId || undefined"
          class="flex items-center gap-3 text-left p-1.5 rounded-xl transition-colors outline-none focus-visible:ring-2 focus-visible:ring-slate-500 min-w-0 max-w-full cursor-pointer"
          :class="[
            profileButtonMarginClass,
            profilePanel?.isOpen
              ? 'bg-slate-800/80 ring-1 ring-white/10'
              : 'hover:bg-slate-800/50 active:bg-slate-800/80',
          ]"
          :aria-label="profileAriaLabel"
        >
          <slot name="avatar">
            <span class="relative block w-10 h-10 shrink-0">
              <span
                class="w-full h-full rounded-full overflow-hidden border-[1.5px] shadow-md flex items-center justify-center transition-colors duration-200"
                :class="avatarSurfaceClass"
              >
                <span
                  v-if="showImage && imageState === 'loading'"
                  class="absolute inset-0 rounded-full bg-slate-700/60 motion-safe:animate-pulse"
                  aria-hidden="true"
                />

                <img
                  v-if="showImage"
                  :key="avatarUrl ?? ''"
                  ref="imgRef"
                  :src="avatarUrl ?? ''"
                  referrerpolicy="no-referrer"
                  @load="onImageLoad"
                  @error="onImageError"
                  alt=""
                  decoding="async"
                  draggable="false"
                  class="w-full h-full object-cover transition-opacity duration-200"
                  :class="imageState === 'loaded' ? 'opacity-100' : 'opacity-0'"
                />

                <span
                  v-else-if="avatarInitials"
                  class="text-xs font-semibold tracking-wide"
                  aria-hidden="true"
                >
                  {{ avatarInitials }}
                </span>

                <User v-else :size="18" class="text-slate-400" aria-hidden="true" />
              </span>

              <span
                v-if="showPresenceDot"
                class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 transition-colors duration-300"
                :class="presenceDotClass"
                aria-hidden="true"
              />
            </span>
          </slot>

          <span class="flex flex-col min-w-0 pr-2">
            <span class="flex items-center gap-1.5 min-w-0">
              <span
                class="block text-sm font-semibold text-white leading-tight truncate"
                :title="title"
              >
                {{ title }}
              </span>

              <slot name="badge" />

              <span
                v-if="isMuted"
                :title="t.notificationsMuted"
                class="inline-flex shrink-0 text-slate-500"
                aria-hidden="true"
              >
                <BellOff :size="13" />
              </span>
            </span>

            <span
              v-if="hasStatusRow"
              class="text-[11px] font-medium truncate flex items-center gap-1 transition-colors duration-300"
              :class="statusTextClass"
            >
              <Loader2
                v-if="connectionStatus === 'reconnecting'"
                :size="11"
                class="shrink-0 motion-safe:animate-spin"
                aria-hidden="true"
              />
              <WifiOff
                v-else-if="connectionStatus === 'offline'"
                :size="11"
                class="shrink-0"
                aria-hidden="true"
              />

              <span class="truncate">{{ statusLabel }}</span>

              <span
                v-if="showTypingIndicator"
                class="inline-flex items-center gap-0.5 ml-0.5 shrink-0"
                aria-hidden="true"
              >
                <span class="w-1 h-1 rounded-full bg-current motion-safe:animate-bounce [animation-delay:-0.3s]" />
                <span class="w-1 h-1 rounded-full bg-current motion-safe:animate-bounce [animation-delay:-0.15s]" />
                <span class="w-1 h-1 rounded-full bg-current motion-safe:animate-bounce" />
              </span>
            </span>
          </span>
        </button>

        <span class="sr-only" aria-live="polite" aria-atomic="true">
          {{ liveAnnouncement }}
        </span>
      </div>

      <!-- Dreapta: Acțiuni -->
      <div v-if="showContent" class="flex items-center gap-0.5 md:gap-1.5 shrink-0">
        <!-- Search (sub sm expus în meniul MoreOptions al părintelui) -->
        <AppTooltip
          v-if="showSearch"
          class="hidden sm:block"
          :text="t.searchInChat"
          :shortcut="enableShortcuts ? searchShortcutLabel : ''"
          :disabled="Boolean(searchPanel?.isOpen)"
        >
          <button
            ref="searchBtnRef"
            type="button"
            @click="emit('search')"
            :aria-expanded="Boolean(searchPanel?.isOpen)"
            :aria-controls="searchPanel?.controlsId || undefined"
            class="flex min-w-[44px] min-h-[44px] md:min-w-[40px] md:min-h-[40px] rounded-xl active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-slate-500 justify-center items-center cursor-pointer"
            :class="
              searchPanel?.isOpen
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            "
            :aria-label="
              enableShortcuts ? `${t.searchInChat} (${searchShortcutLabel})` : t.searchInChat
            "
          >
            <Search :size="18" aria-hidden="true" />
          </button>
        </AppTooltip>

        <!-- Voice Call -->
        <AppTooltip v-if="showVoiceCall" :text="voiceTooltipText" align="right">
          <button
            type="button"
            :aria-disabled="isVoiceDisabled ? 'true' : undefined"
            @click="onVoiceCallClick"
            class="relative min-w-[44px] min-h-[44px] md:min-w-[40px] md:min-h-[40px] rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-slate-500 flex justify-center items-center"
            :class="[
              isActiveVoiceHere && currentCallDuration ? 'px-2.5 gap-1.5' : '',
              isVoiceDisabled
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : isActiveVoiceHere
                  ? 'text-emerald-400 bg-emerald-500/15 hover:bg-emerald-500/25 cursor-pointer active:scale-95'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer active:scale-95',
            ]"
            :aria-label="voiceTooltipText"
          >
            <Phone :size="18" aria-hidden="true" />
            <span
              v-if="isActiveVoiceHere && currentCallDuration"
              class="text-xs font-mono font-semibold tabular-nums leading-none"
              aria-hidden="true"
            >
              {{ currentCallDuration }}
            </span>
            <span
              v-if="isActiveVoiceHere"
              class="flex h-2 w-2"
              :class="currentCallDuration ? 'relative' : 'absolute top-2 right-2 md:top-1.5 md:right-1.5'"
              aria-hidden="true"
            >
              <span class="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
          </button>
        </AppTooltip>

        <!-- Video Call -->
        <AppTooltip v-if="showVideoCall" :text="videoTooltipText" align="right">
          <button
            type="button"
            :aria-disabled="isVideoDisabled ? 'true' : undefined"
            @click="onVideoCallClick"
            class="relative min-w-[44px] min-h-[44px] md:min-w-[40px] md:min-h-[40px] rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-slate-500 flex justify-center items-center"
            :class="[
              isActiveVideoHere && currentCallDuration ? 'px-2.5 gap-1.5' : '',
              isVideoDisabled
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : isActiveVideoHere
                  ? 'text-emerald-400 bg-emerald-500/15 hover:bg-emerald-500/25 cursor-pointer active:scale-95'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer active:scale-95',
            ]"
            :aria-label="videoTooltipText"
          >
            <Video :size="18" aria-hidden="true" />
            <span
              v-if="isActiveVideoHere && currentCallDuration"
              class="text-xs font-mono font-semibold tabular-nums leading-none"
              aria-hidden="true"
            >
              {{ currentCallDuration }}
            </span>
            <span
              v-if="isActiveVideoHere"
              class="flex h-2 w-2"
              :class="currentCallDuration ? 'relative' : 'absolute top-2 right-2 md:top-1.5 md:right-1.5'"
              aria-hidden="true"
            >
              <span class="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
          </button>
        </AppTooltip>

        <slot name="actions" />

        <div
          v-if="hasLeftActions"
          class="w-[1px] h-5 bg-slate-700/50 mx-1 hidden sm:block"
          aria-hidden="true"
        />

        <!-- More Options -->
        <AppTooltip :text="t.moreOptions" align="right" :disabled="Boolean(optionsPanel?.isOpen)">
          <button
            ref="optionsBtnRef"
            type="button"
            @click="emit('options')"
            aria-haspopup="menu"
            :aria-expanded="Boolean(optionsPanel?.isOpen)"
            :aria-controls="optionsPanel?.controlsId || undefined"
            class="min-w-[44px] min-h-[44px] md:min-w-[40px] md:min-h-[40px] rounded-xl active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-slate-500 flex justify-center items-center cursor-pointer"
            :class="
              optionsPanel?.isOpen
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            "
            :aria-label="t.moreOptions"
          >
            <MoreVertical :size="18" aria-hidden="true" />
          </button>
        </AppTooltip>
      </div>
    </header>

    <!-- Slot opțional pentru Pinned Message / Offline Banner în același sticky -->
    <slot name="sub-header" />
  </div>
</template>