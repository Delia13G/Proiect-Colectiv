<!-- src/components/chat/MainChatView.vue -->
<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  onUnmounted,
  type ComponentPublicInstance,
} from 'vue';
import {
  UploadCloud,
  Search,
  ChevronUp,
  ChevronDown,
  X,
  ArrowDown,
  BellOff,
  Bell,
  Trash2,
  MessageSquare,
  Users,
  AlertCircle,
  RotateCcw,
  Loader2,
} from 'lucide-vue-next';
import ChatHeader, {
  type BackButtonVisibility,
  type ChatHeaderCallControls,
  type ChatHeaderLabelOverrides,
  type ChatHeaderPanelsState,
  type ChatHeaderSubject,
  type ConnectionStatus,
  type PresenceStatus,
} from './ChatHeader.vue';
import GroupChatHeader, {
  type GroupChatHeaderLabels,
  type GroupChatHeaderPanelsState,
  type GroupHeaderSubject,
} from './GroupChatHeader.vue';
import MessageBubble, {
  type MessageBubbleLabels,
  type MessageImagePreviewPayload,
} from './MessageBubble.vue';
import ChatInput, {
  type ChatEditPayload,
  type ChatEditTarget,
  type ChatInputLabels,
  type ChatReplyTarget,
  type ChatSendPayload,
  type MentionUser,
  type ReplyMediaKind,
  type SlashCommand,
} from './ChatInput.vue';
import MediaLightbox, {
  type MediaLightboxItem,
  type MediaLightboxLabels,
} from './MediaLightbox.vue';
import AppTooltip from '../ui/AppTooltip.vue';
import { getLensTheme } from '../../utils/lensTheme';
import type {
  ChatEntityId,
  ChatLens,
  ChatMessage,
  ChatTheme,
  ChatUser,
} from '../../types/chat';

export interface MainChatViewLabels {
  typing: string;
  today: string;
  yesterday: string;
  messagesAreaAriaLabel: string;
  dropFilesTitle: string;
  dropFilesSubtitle: string;
  optionsMenuAriaLabel: string;
  searchInChat: string;
  viewMembers: string;
  muteNotifications: string;
  unmuteNotifications: string;
  clearChatHistory: string;
  confirmClearChat: string;
  searchPlaceholder: string;
  searchAriaLabel: string;
  zeroResults: string;
  olderMatch: string;
  newerMatch: string;
  closeSearch: string;
  loadingMessages: string;
  loadEarlierMessages: string;
  loadingEarlierMessages: string;
  errorTitle: string;
  retry: string;
  emptyTitle: (partnerName: string) => string;
  emptyDescription: string;
  scrollToBottomAriaLabel: string;
  disabledLoading: string;
  disabledBlocked: string;
  disabledOffline: string;
  callDisabledBlocked: string;
  replyYourself: string;
  replyAttachmentsCount: (count: number, allImages: boolean) => string;
  searchResultsAnnouncement: (count: number) => string;
  header?: ChatHeaderLabelOverrides;
  groupHeader?: Partial<GroupChatHeaderLabels>;
  input?: Partial<ChatInputLabels>;
  bubble?: Partial<MessageBubbleLabels>;
  lightbox?: Partial<MediaLightboxLabels>;
}

const DEFAULT_LABELS: MainChatViewLabels = {
  typing: 'Typing',
  today: 'Today',
  yesterday: 'Yesterday',
  messagesAreaAriaLabel: 'Conversation messages',
  dropFilesTitle: 'Drop files to attach',
  dropFilesSubtitle: 'Images will be automatically optimized before sending',
  optionsMenuAriaLabel: 'Conversation options',
  searchInChat: 'Search in chat',
  viewMembers: 'Members',
  muteNotifications: 'Mute notifications',
  unmuteNotifications: 'Unmute notifications',
  clearChatHistory: 'Clear chat history',
  confirmClearChat: 'Click again to clear',
  searchPlaceholder: 'Search messages...',
  searchAriaLabel: 'Search messages in conversation',
  zeroResults: '0 results',
  olderMatch: 'Older match',
  newerMatch: 'Newer match',
  closeSearch: 'Close search',
  loadingMessages: 'Loading messages',
  loadEarlierMessages: 'Load earlier messages',
  loadingEarlierMessages: 'Loading earlier messages...',
  errorTitle: "Couldn't load messages",
  retry: 'Retry',
  emptyTitle: (name) => `Start chatting with ${name}`,
  emptyDescription:
    'Send a message, drag & drop files, or record a voice note to kick off the conversation.',
  scrollToBottomAriaLabel: 'Scroll to latest messages',
  disabledLoading: 'Loading conversation...',
  disabledBlocked: 'You blocked this user. Unblock from Contact Info to send messages.',
  disabledOffline: 'Waiting for network connection...',
  callDisabledBlocked: 'Unblock user to call',
  replyYourself: 'yourself',
  replyAttachmentsCount: (count, allImages) =>
    allImages ? `${count} photos` : `${count} files`,
  searchResultsAnnouncement: (count) =>
    count === 0 ? 'No matching messages' : count === 1 ? '1 match found' : `${count} matches found`,
};

export interface MainChatViewProps {
  activeLens: ChatLens;
  chatId: ChatEntityId;
  messages: ChatMessage[];
  isGroup?: boolean;
  user?: ChatUser | null;
  group?: GroupHeaderSubject | null;
  connectionStatus?: ConnectionStatus;
  calls?: ChatHeaderCallControls;
  unreadChatsCount?: number;
  backButton?: BackButtonVisibility;
  currentUserId?: ChatEntityId;
  currentUsername?: string;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMoreMessages?: boolean;
  isSending?: boolean;
  error?: string | null;
  isProfileOpen?: boolean;
  isMembersOpen?: boolean;
  profilePanelId?: string;
  membersPanelId?: string;
  isMuted?: boolean;
  isBlocked?: boolean;
  /** Override opțional din store; dacă lipsește, se derivă din membrii grupului / user. */
  mentionUsers?: Array<string | MentionUser>;
  commands?: SlashCommand[];
  interactiveMentions?: boolean;
  locale?: string;
  labels?: Partial<MainChatViewLabels>;
}

const GROUP_WINDOW_MS = 5 * 60 * 1000;
const CONFIRM_RESET_MS = 4000;
const HIGHLIGHT_DURATION_MS = 1800;

let viewInstanceSeq = 0;

const props = withDefaults(defineProps<MainChatViewProps>(), {
  isGroup: false,
  user: null,
  group: null,
  connectionStatus: 'connected',
  calls: () => ({}),
  unreadChatsCount: 0,
  backButton: 'auto',
  currentUserId: 'me',
  currentUsername: '',
  isLoading: false,
  isLoadingMore: false,
  hasMoreMessages: false,
  isSending: false,
  error: null,
  isProfileOpen: false,
  isMembersOpen: false,
  profilePanelId: undefined,
  membersPanelId: undefined,
  isMuted: false,
  isBlocked: false,
  mentionUsers: undefined,
  commands: () => [],
  interactiveMentions: false,
  locale: undefined,
  labels: () => ({}),
});

const emit = defineEmits<{
  back: [];
  'voice-call': [];
  'video-call': [];
  'open-profile': [];
  'open-members': [];
  'toggle-mute': [muted: boolean];
  'clear-chat': [];
  'retry-load': [];
  'load-more': [];
  typing: [status: boolean];
  'send-message': [payload: ChatSendPayload, meta: { replyToId?: ChatEntityId }];
  'edit-message': [payload: ChatEditPayload];
  'delete-message': [message: ChatMessage];
  'react-message': [payload: { messageId: ChatEntityId; emoji: string }];
  'retry-message': [message: ChatMessage];
  'mention-click': [username: string];
  'jump-to-missing-message': [messageId: ChatEntityId];
}>();

const instanceId = ++viewInstanceSeq;
const optionsMenuId = `chat-options-menu-${instanceId}`;
const searchPanelId = `chat-search-bar-${instanceId}`;

const t = computed<MainChatViewLabels>(() => ({
  ...DEFAULT_LABELS,
  ...props.labels,
}));

const lensTheme = computed(() => getLensTheme(props.activeLens));
const theme = computed<ChatTheme>(() => lensTheme.value.chatTheme);
const accentRingClass = computed(() => lensTheme.value.accentRing);
const searchFocusClass = computed(() => lensTheme.value.ring);

const isGroupChat = computed(() => Boolean(props.isGroup || props.group));

// ==========================================
// 1. HELPERE UNICODE & MAPARE HEADER / CALLS / PANELS
// ==========================================
const foldText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const normalizePresence = (raw?: string | null): PresenceStatus | null => {
  const s = raw?.trim().toLowerCase();
  if (!s) return null;
  if (s === 'online') return 'online';
  if (s === 'away' || s === 'idle') return 'away';
  if (s === 'busy') return 'busy';
  if (s === 'dnd' || s.includes('disturb')) return 'dnd';
  if (s === 'offline') return 'offline';
  return null;
};

const partnerDisplayName = computed(() =>
  isGroupChat.value
    ? (props.group?.name?.trim() || 'Group')
    : (props.user?.name?.trim() || 'User')
);

const directHeaderSubject = computed<ChatHeaderSubject | null>(() => {
  if (!props.user) return null;
  const presence = normalizePresence(props.user.status);
  const customSubtitle =
    presence === null && props.user.status?.trim() ? props.user.status.trim() : undefined;

  return {
    title: props.user.name,
    subtitle: customSubtitle,
    avatarUrl: props.user.avatar ?? null,
    presence,
    typingText: props.user.isTyping ? t.value.typing : null,
    isMuted: props.isMuted,
  };
});

const groupHeaderSubject = computed<GroupHeaderSubject | null>(() => {
  if (!props.group) return null;
  return {
    ...props.group,
    isMuted: props.group.isMuted ?? props.isMuted,
  };
});

const effectiveCalls = computed<ChatHeaderCallControls>(() => {
  if (isGroupChat.value || !props.isBlocked) return props.calls;
  const base = props.calls;
  return {
    ...base,
    voice:
      base.voice?.status === 'hidden'
        ? { status: 'hidden' }
        : { status: 'disabled', reason: t.value.callDisabledBlocked },
    video:
      base.video?.status === 'hidden'
        ? { status: 'hidden' }
        : { status: 'disabled', reason: t.value.callDisabledBlocked },
  };
});

// ==========================================
// 2. REFS COMPONENTE & STĂRI LOCALE UI
// ==========================================
const headerWrapperRef = ref<HTMLElement | null>(null);
const chatHeaderRef = ref<InstanceType<typeof ChatHeader> | null>(null);
const groupHeaderRef = ref<InstanceType<typeof GroupChatHeader> | null>(null);
const scrollContainerRef = ref<HTMLElement | null>(null);
const topLoadMoreSentinelRef = ref<HTMLElement | null>(null);
const chatInputRef = ref<InstanceType<typeof ChatInput> | null>(null);
const optionsMenuRef = ref<HTMLElement | null>(null);

const isSearchOpen = ref(false);
const isOptionsOpen = ref(false);
const confirmClearChat = ref(false);
let confirmClearTimer: ReturnType<typeof setTimeout> | null = null;

const headerPanels = computed<ChatHeaderPanelsState>(() => ({
  profile: { isOpen: props.isProfileOpen, controlsId: props.profilePanelId },
  search: { isOpen: isSearchOpen.value, controlsId: searchPanelId },
  options: { isOpen: isOptionsOpen.value, controlsId: optionsMenuId },
}));

const groupHeaderPanels = computed<GroupChatHeaderPanelsState>(() => ({
  ...headerPanels.value,
  members: { isOpen: props.isMembersOpen, controlsId: props.membersPanelId },
}));

const focusHeaderOptionsButton = () => {
  if (isGroupChat.value) groupHeaderRef.value?.focusOptionsButton?.();
  else chatHeaderRef.value?.focusOptionsButton?.();
};

const focusHeaderSearchButton = () => {
  if (isGroupChat.value) groupHeaderRef.value?.focusSearchButton?.();
  else chatHeaderRef.value?.focusSearchButton?.();
};

const slugifyUsername = (name: string): string =>
  foldText(name)
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '');

const resolvedMentionUsers = computed<Array<string | MentionUser>>(() => {
  if (props.mentionUsers !== undefined) return props.mentionUsers;

  if (isGroupChat.value && props.group?.members) {
    const myId = String(props.currentUserId);
    return props.group.members
      .filter((m) => String(m.id) !== myId)
      .map((m) => ({
        id: m.id,
        username: slugifyUsername(m.name) || String(m.id),
        name: m.name,
        avatarUrl: m.avatarUrl ?? null,
      }));
  }

  if (props.user?.name) {
    return [
      {
        id: props.user.id ?? 'partner',
        username:
          props.user.username?.trim().replace(/^@/, '') ||
          slugifyUsername(props.user.name) ||
          'user',
        name: props.user.name,
        avatarUrl: props.user.avatar ?? null,
      },
    ];
  }

  return [];
});

// ==========================================
// 3. MAP O(1), REPLY & EDIT TARGETS (Fără deep watch)
// ==========================================
const messageMap = computed(() => {
  const map = new Map<string, ChatMessage>();
  for (const msg of props.messages) {
    map.set(String(msg.id), msg);
  }
  return map;
});

const replyingTo = ref<ChatMessage | null>(null);
const editingTarget = ref<ChatEditTarget | null>(null);
const pendingEdit = ref<{ messageId: ChatEntityId; text: string } | null>(null);

const resolveReplyMediaInfo = (
  msg: ChatMessage
): { kind: ReplyMediaKind | null; label: string | null } => {
  if (Array.isArray(msg.attachments) && msg.attachments.length > 0) {
    const first = msg.attachments[0];
    if (first) {
      const allImages = msg.attachments.every((a) => a.kind === 'image');
      return {
        kind: allImages ? 'image' : 'file',
        label:
          msg.attachments.length > 1
            ? t.value.replyAttachmentsCount(msg.attachments.length, allImages)
            : (first.fileName ?? null),
      };
    }
  }
  if (msg.type === 'image' || msg.type === 'audio' || msg.type === 'file') {
    return { kind: msg.type, label: msg.fileName ?? null };
  }
  return { kind: null, label: null };
};

const chatReplyTarget = computed<ChatReplyTarget | null>(() => {
  const msg = replyingTo.value;
  if (!msg) return null;
  const media = resolveReplyMediaInfo(msg);
  const authorName = msg.isMine
    ? t.value.replyYourself
    : (msg.senderName?.trim() || partnerDisplayName.value);

  return {
    id: msg.id,
    text: msg.text ?? null,
    authorName,
    attachmentKind: media.kind,
    attachmentLabel: media.label,
  };
});

const startReply = (msg: ChatMessage) => {
  editingTarget.value = null;
  pendingEdit.value = null;
  replyingTo.value = msg;
};

const startEdit = (msg: ChatMessage) => {
  replyingTo.value = null;
  pendingEdit.value = null;
  editingTarget.value = { id: msg.id, text: msg.text ?? '' };
};

const clearEdit = () => {
  editingTarget.value = null;
  pendingEdit.value = null;
};

const cancelInputAction = () => {
  replyingTo.value = null;
  clearEdit();
};

const handleSend = (payload: ChatSendPayload) => {
  const replyToId = replyingTo.value?.id;
  emit('send-message', payload, { replyToId });
  replyingTo.value = null;
  scrollToBottom('smooth');
};

const handleEdit = (payload: ChatEditPayload) => {
  pendingEdit.value = payload;
  emit('edit-message', payload);
};

// Urmărire O(1) strict pe mesajul aflat în editare (fără deep watch pe toată lista)
const activeEditedMessageState = computed(() => {
  if (!editingTarget.value) return null;
  const msg = messageMap.value.get(String(editingTarget.value.id));
  if (!msg) return { missing: true, deleted: false, text: '' };
  return {
    missing: false,
    deleted: Boolean(msg.isDeleted),
    text: (msg.text ?? '').trim(),
  };
});

watch(activeEditedMessageState, (state) => {
  if (!editingTarget.value || !state) return;
  if (state.missing || state.deleted) {
    clearEdit();
    return;
  }
  if (
    pendingEdit.value &&
    String(pendingEdit.value.messageId) === String(editingTarget.value.id) &&
    state.text === pendingEdit.value.text
  ) {
    clearEdit();
  }
});

// Curăță automat reply-ul dacă mesajul original este șters live prin WebSocket
const activeReplyDeleted = computed(() => {
  if (!replyingTo.value) return false;
  const live = messageMap.value.get(String(replyingTo.value.id));
  return Boolean(!live || live.isDeleted);
});

watch(activeReplyDeleted, (deleted) => {
  if (deleted) replyingTo.value = null;
});

// ==========================================
// 4. SEPARATOARE DE DATĂ & GRUPARE BULE (isGrouped & isLastInGroup)
// ==========================================
const isSameCalendarDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const dateSeparatorSameYearFmt = computed(() => {
  try {
    return new Intl.DateTimeFormat(props.locale || undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
  }
});

const dateSeparatorFullFmt = computed(() => {
  try {
    return new Intl.DateTimeFormat(props.locale || undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
});

const formatDateSeparator = (dateInput: Date | string | number): string => {
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '';

  const today = new Date();
  if (isSameCalendarDay(d, today)) return t.value.today;

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameCalendarDay(d, yesterday)) return t.value.yesterday;

  return d.getFullYear() === today.getFullYear()
    ? dateSeparatorSameYearFmt.value.format(d)
    : dateSeparatorFullFmt.value.format(d);
};

const canGroupMessages = (a: ChatMessage, b: ChatMessage, aDate: Date, bDate: Date): boolean => {
  if (a.isDeleted || b.isDeleted) return false;
  if (Number.isNaN(aDate.getTime()) || Number.isNaN(bDate.getTime())) return false;
  if (!isSameCalendarDay(aDate, bDate)) return false;
  if (a.isMine !== b.isMine) return false;
  if (isGroupChat.value && String(a.senderId ?? '') !== String(b.senderId ?? '')) return false;
  return Math.abs(bDate.getTime() - aDate.getTime()) < GROUP_WINDOW_MS;
};

interface RenderedMessageItem {
  key: string;
  message: ChatMessage;
  showDateSeparator: boolean;
  dateLabel: string;
  isGrouped: boolean;
  isLastInGroup: boolean;
  replyMessage: ChatMessage | null;
}

const renderedMessages = computed<RenderedMessageItem[]>(() => {
  const list = props.messages;
  const dates = list.map((m) => new Date(m.timestamp));

  return list.map((msg, idx) => {
    const prev = idx > 0 ? list[idx - 1] : null;
    const next = idx < list.length - 1 ? list[idx + 1] : null;
    const currDate = dates[idx] ?? new Date(msg.timestamp);
    const prevDate = idx > 0 ? (dates[idx - 1] ?? null) : null;
    const nextDate = idx < list.length - 1 ? (dates[idx + 1] ?? null) : null;

    const showDateSeparator =
      !Number.isNaN(currDate.getTime()) &&
      (!prevDate || Number.isNaN(prevDate.getTime()) || !isSameCalendarDay(currDate, prevDate));

    const isGrouped = Boolean(
      !showDateSeparator && prev && prevDate && canGroupMessages(prev, msg, prevDate, currDate)
    );
    const isGroupedWithNext = Boolean(
      next && nextDate && canGroupMessages(msg, next, currDate, nextDate)
    );

    const replyMessage =
      msg.replyToId !== undefined && msg.replyToId !== null
        ? (messageMap.value.get(String(msg.replyToId)) ?? null)
        : null;

    return {
      key: String(msg.id),
      message: msg,
      showDateSeparator,
      dateLabel: showDateSeparator ? formatDateSeparator(currDate) : '',
      isGrouped,
      isLastInGroup: !isGroupedWithNext,
      replyMessage,
    };
  });
});

// ==========================================
// 5. SMART AUTO-SCROLL, ANCORARE PREPEND & JUMP-TO-MESSAGE
// ==========================================
const isNearBottom = ref(true);
const pendingNewMessages = ref(0);
const highlightedMessageId = ref<ChatEntityId | null>(null);
let highlightTimer: ReturnType<typeof setTimeout> | null = null;

const messageElementMap = new Map<string, HTMLElement>();

const setMessageRef = (id: ChatEntityId, el: Element | ComponentPublicInstance | null) => {
  const key = String(id);
  if (el instanceof HTMLElement) messageElementMap.set(key, el);
  else messageElementMap.delete(key);
};

const handleScroll = () => {
  const el = scrollContainerRef.value;
  if (!el) return;
  const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
  isNearBottom.value = distanceFromBottom < 120;
  if (isNearBottom.value) {
    pendingNewMessages.value = 0;
  }
};

const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
  nextTick(() => {
    const el = scrollContainerRef.value;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    isNearBottom.value = true;
    pendingNewMessages.value = 0;
  });
};

const clearHighlight = () => {
  highlightedMessageId.value = null;
  if (highlightTimer) {
    clearTimeout(highlightTimer);
    highlightTimer = null;
  }
};

const scrollToAndHighlight = (messageId: ChatEntityId): boolean => {
  const targetEl = messageElementMap.get(String(messageId));
  if (!targetEl) {
    emit('jump-to-missing-message', messageId);
    return false;
  }

  targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  highlightedMessageId.value = messageId;

  if (highlightTimer) clearTimeout(highlightTimer);
  highlightTimer = setTimeout(() => {
    if (
      highlightedMessageId.value !== null &&
      String(highlightedMessageId.value) === String(messageId)
    ) {
      highlightedMessageId.value = null;
    }
    highlightTimer = null;
  }, HIGHLIGHT_DURATION_MS);

  return true;
};

// Detectează precis prepend (paginare istoric) vs append (mesaje noi), imun la swap de ID optimist
watch(
  () => {
    const list = props.messages;
    const first = list[0];
    const last = list[list.length - 1];
    return [
      String(props.chatId),
      list.length,
      first ? String(first.id) : null,
      last ? String(last.id) : null,
    ] as const;
  },
  ([nextChatId, nextLen, nextFirstId, nextLastId], [prevChatId, prevLen, prevFirstId, prevLastId]) => {
    if (nextChatId !== prevChatId) return;

    if (nextLen === 0) {
      isNearBottom.value = true;
      pendingNewMessages.value = 0;
      return;
    }

    // 1. Prima încărcare de mesaje pentru conversație
    if (prevLen === 0 && nextLen > 0) {
      scrollToBottom('auto');
      return;
    }

    // 2. Prepend de mesaje vechi (primul ID s-a schimbat, ultimul ID a rămas la fel)
    if (
      nextLen > prevLen &&
      nextFirstId !== prevFirstId &&
      nextLastId === prevLastId &&
      scrollContainerRef.value
    ) {
      const el = scrollContainerRef.value;
      const prevScrollHeight = el.scrollHeight;
      const prevScrollTop = el.scrollTop;

      nextTick(() => {
        const delta = el.scrollHeight - prevScrollHeight;
        if (delta > 0) {
          el.scrollTop = prevScrollTop + delta;
        }
      });
      return;
    }

    // 3. Append real de mesaje noi (lungimea a crescut ȘI ultimul ID s-a schimbat)
    if (nextLen > prevLen && nextLastId && nextLastId !== prevLastId) {
      const lastMsg = props.messages[nextLen - 1];
      if (isNearBottom.value || lastMsg?.isMine) {
        scrollToBottom('smooth');
      } else {
        const prevIdx = prevLastId
          ? props.messages.findIndex((m) => String(m.id) === prevLastId)
          : -1;
        const addedCount = prevIdx !== -1 ? Math.max(1, nextLen - 1 - prevIdx) : nextLen - prevLen;
        pendingNewMessages.value += addedCount;
      }
    }
  },
  { flush: 'pre' }
);

// Când se termină skeleton-ul inițial și mesajele erau deja în store, poziționăm lista jos
watch(
  () => props.isLoading,
  (loading, wasLoading) => {
    if (!loading && wasLoading && props.messages.length > 0) {
      scrollToBottom('auto');
    }
  }
);

// IntersectionObserver pentru încărcarea automată a mesajelor mai vechi la scroll sus
let topLoadObserver: IntersectionObserver | null = null;

const disconnectTopObserver = () => {
  if (topLoadObserver) {
    topLoadObserver.disconnect();
    topLoadObserver = null;
  }
};

const triggerLoadMore = () => {
  if (!props.hasMoreMessages || props.isLoadingMore || props.isLoading || props.error) return;
  emit('load-more');
};

const setupTopObserver = () => {
  disconnectTopObserver();
  if (
    typeof IntersectionObserver === 'undefined' ||
    !props.hasMoreMessages ||
    !scrollContainerRef.value ||
    !topLoadMoreSentinelRef.value
  ) {
    return;
  }

  topLoadObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        triggerLoadMore();
      }
    },
    {
      root: scrollContainerRef.value,
      rootMargin: '80px',
    }
  );

  topLoadObserver.observe(topLoadMoreSentinelRef.value);
};

watch([scrollContainerRef, topLoadMoreSentinelRef, () => props.hasMoreMessages], () => {
  nextTick(setupTopObserver);
});

// ==========================================
// 6. CĂUTARE ÎN CONVERSAȚIE (Fără diacritice, stabilă la mesaje noi)
// ==========================================
const searchQuery = ref('');
const searchInputRef = ref<HTMLInputElement | null>(null);
const currentMatchIndex = ref(0);
const searchAnnouncement = ref('');
let searchAnnounceTimer: ReturnType<typeof setTimeout> | null = null;

const activeHighlightQuery = computed(() =>
  isSearchOpen.value ? searchQuery.value.trim() : ''
);

// Rezultate ordonate de la cel mai recent mesaj spre cele mai vechi
const searchMatches = computed<ChatEntityId[]>(() => {
  const q = foldText(searchQuery.value.trim());
  if (!q) return [];
  const ids: ChatEntityId[] = [];
  for (let i = props.messages.length - 1; i >= 0; i--) {
    const msg = props.messages[i];
    if (!msg || msg.isDeleted) continue;

    const textMatch = msg.text ? foldText(msg.text).includes(q) : false;
    const fileMatch = msg.fileName ? foldText(msg.fileName).includes(q) : false;
    const attachmentsMatch = Array.isArray(msg.attachments)
      ? msg.attachments.some((a) => a.fileName && foldText(a.fileName).includes(q))
      : false;

    if (textMatch || fileMatch || attachmentsMatch) {
      ids.push(msg.id);
    }
  }
  return ids;
});

// Sare automat la primul rezultat doar când se schimbă termenul căutat
watch(searchQuery, (val) => {
  if (searchAnnounceTimer) {
    clearTimeout(searchAnnounceTimer);
    searchAnnounceTimer = null;
  }

  currentMatchIndex.value = 0;

  if (!val.trim()) {
    clearHighlight();
    searchAnnouncement.value = '';
    return;
  }

  const firstMatch = searchMatches.value[0];
  if (firstMatch !== undefined) {
    nextTick(() => scrollToAndHighlight(firstMatch));
  } else {
    clearHighlight();
  }

  searchAnnounceTimer = setTimeout(() => {
    searchAnnouncement.value = t.value.searchResultsAnnouncement(searchMatches.value.length);
    searchAnnounceTimer = null;
  }, 350);
});

// Păstrează poziția pe același mesaj găsit când intră mesaje noi în fundal
watch(searchMatches, (nextMatches, prevMatches) => {
  if (!searchQuery.value.trim()) return;
  if (nextMatches.length === 0) {
    currentMatchIndex.value = 0;
    clearHighlight();
    return;
  }

  const prevSelectedId = prevMatches?.[currentMatchIndex.value];
  if (prevSelectedId !== undefined) {
    const preservedIdx = nextMatches.findIndex((id) => String(id) === String(prevSelectedId));
    if (preservedIdx !== -1) {
      currentMatchIndex.value = preservedIdx;
      return;
    }
  }

  currentMatchIndex.value = Math.min(currentMatchIndex.value, nextMatches.length - 1);
});

const openSearch = () => {
  closeOptionsMenu(false);
  isSearchOpen.value = true;
  nextTick(() => {
    searchInputRef.value?.focus();
    searchInputRef.value?.select();
  });
};

const closeSearch = (restoreFocusToHeader = false) => {
  if (!isSearchOpen.value) return;
  isSearchOpen.value = false;
  searchQuery.value = '';
  searchAnnouncement.value = '';
  clearHighlight();
  if (restoreFocusToHeader) {
    nextTick(focusHeaderSearchButton);
  } else {
    chatInputRef.value?.focus();
  }
};

const toggleSearch = () => {
  if (isSearchOpen.value) closeSearch(false);
  else openSearch();
};

const goToOlderMatch = () => {
  const total = searchMatches.value.length;
  if (total === 0) return;
  currentMatchIndex.value = (currentMatchIndex.value + 1) % total;
  const matchId = searchMatches.value[currentMatchIndex.value];
  if (matchId !== undefined) scrollToAndHighlight(matchId);
};

const goToNewerMatch = () => {
  const total = searchMatches.value.length;
  if (total === 0) return;
  currentMatchIndex.value = (currentMatchIndex.value - 1 + total) % total;
  const matchId = searchMatches.value[currentMatchIndex.value];
  if (matchId !== undefined) scrollToAndHighlight(matchId);
};

const handleSearchKeyDown = (e: KeyboardEvent) => {
  if (e.isComposing || e.keyCode === 229) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    closeSearch(true);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (e.shiftKey) goToNewerMatch();
    else goToOlderMatch();
  }
};

// ==========================================
// 7. DRAG & DROP (Cu dragCounter + auto-reset pe dragend / blur)
// ==========================================
const isDragging = ref(false);
let dragCounter = 0;

const canAcceptFileDrop = computed(
  () =>
    props.connectionStatus !== 'offline' &&
    editingTarget.value === null &&
    !props.isLoading &&
    !props.isBlocked
);

const resetDragState = () => {
  dragCounter = 0;
  isDragging.value = false;
};

const hasDraggedFiles = (e: DragEvent): boolean =>
  Boolean(e.dataTransfer?.types && Array.from(e.dataTransfer.types).includes('Files'));

const onDragEnter = (e: DragEvent) => {
  if (!canAcceptFileDrop.value || !hasDraggedFiles(e)) return;
  e.preventDefault();
  dragCounter++;
  isDragging.value = true;
};

const onDragOver = (e: DragEvent) => {
  if (!canAcceptFileDrop.value || !hasDraggedFiles(e)) return;
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
};

const onDragLeave = (e: DragEvent) => {
  if (!isDragging.value) return;
  e.preventDefault();
  dragCounter = Math.max(0, dragCounter - 1);
  if (dragCounter === 0) {
    isDragging.value = false;
  }
};

const onDrop = (e: DragEvent) => {
  e.preventDefault();
  resetDragState();
  if (!canAcceptFileDrop.value) return;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0 && chatInputRef.value) {
    chatInputRef.value.addFilesToStage(Array.from(files));
  }
};

// ==========================================
// 8. MEDIA LIGHTBOX (Delegat complet către MediaLightbox.vue)
// ==========================================
const lightboxItems = ref<MediaLightboxItem[]>([]);
const lightboxActiveIndex = ref<number | null>(null);

const openLightbox = (payload: MessageImagePreviewPayload) => {
  lightboxItems.value = payload.items;
  lightboxActiveIndex.value = payload.index;
};

// ==========================================
// 9. MENIU @options (Keyboard A11y, Focus Restore, Auto-reset confirm)
// ==========================================
const clearConfirmClearTimer = () => {
  if (confirmClearTimer) {
    clearTimeout(confirmClearTimer);
    confirmClearTimer = null;
  }
};

const closeOptionsMenu = (restoreFocus: boolean) => {
  if (!isOptionsOpen.value) return;
  isOptionsOpen.value = false;
  confirmClearChat.value = false;
  clearConfirmClearTimer();
  if (restoreFocus) {
    nextTick(focusHeaderOptionsButton);
  }
};

const toggleOptionsMenu = () => {
  if (isOptionsOpen.value) {
    closeOptionsMenu(false);
    return;
  }
  isOptionsOpen.value = true;
  confirmClearChat.value = false;
  clearConfirmClearTimer();
  nextTick(() => {
    optionsMenuRef.value?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
  });
};

const onOptionsMenuKeyDown = (event: KeyboardEvent) => {
  if (!isOptionsOpen.value) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    closeOptionsMenu(true);
    return;
  }

  if (event.key === 'Tab') {
    closeOptionsMenu(false);
    return;
  }

  const items = Array.from(
    optionsMenuRef.value?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []
  ).filter((el) => el.getClientRects().length > 0);
  if (items.length === 0) return;

  const currentIdx = items.indexOf(document.activeElement as HTMLButtonElement);
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    items[(currentIdx + 1) % items.length]?.focus();
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    items[(currentIdx - 1 + items.length) % items.length]?.focus();
  } else if (event.key === 'Home') {
    event.preventDefault();
    items[0]?.focus();
  } else if (event.key === 'End') {
    event.preventDefault();
    items[items.length - 1]?.focus();
  }
};

const handleOptionsOutsidePointerDown = (e: PointerEvent) => {
  if (!isOptionsOpen.value) return;
  const target = e.target as HTMLElement | null;
  if (!target) return;
  if (optionsMenuRef.value?.contains(target)) return;
  if (headerWrapperRef.value?.contains(target) && target.closest('[aria-haspopup="menu"]')) {
    return;
  }
  closeOptionsMenu(false);
};

const handleGlobalKeyDown = (e: KeyboardEvent) => {
  if (e.defaultPrevented || e.key !== 'Escape') return;
  if (
    typeof document !== 'undefined' &&
    document.querySelector('[aria-modal="true"], dialog[open]')
  ) {
    return;
  }
  if (isOptionsOpen.value) {
    e.preventDefault();
    closeOptionsMenu(true);
  }
};

const handleToggleMute = () => {
  closeOptionsMenu(false);
  emit('toggle-mute', !props.isMuted);
};

const handleOpenMembersFromMenu = () => {
  closeOptionsMenu(false);
  emit('open-members');
};

const handleClearChatClick = () => {
  if (!confirmClearChat.value) {
    confirmClearChat.value = true;
    clearConfirmClearTimer();
    confirmClearTimer = setTimeout(() => {
      confirmClearChat.value = false;
      confirmClearTimer = null;
    }, CONFIRM_RESET_MS);
    return;
  }
  replyingTo.value = null;
  clearEdit();
  closeOptionsMenu(false);
  emit('clear-chat');
};

const handleDelete = (msg: ChatMessage) => {
  if (editingTarget.value && String(editingTarget.value.id) === String(msg.id)) {
    clearEdit();
  }
  if (replyingTo.value && String(replyingTo.value.id) === String(msg.id)) {
    replyingTo.value = null;
  }
  emit('delete-message', msg);
};

// ==========================================
// 10. CHAT INPUT LABELS (Dynamic disabled placeholder)
// ==========================================
const chatInputDisabledPlaceholder = computed(() => {
  if (props.isLoading) return t.value.disabledLoading;
  if (props.isBlocked) return t.value.disabledBlocked;
  return t.value.disabledOffline;
});

const mergedInputLabels = computed<Partial<ChatInputLabels>>(() => ({
  ...t.value.input,
  disabledPlaceholder: chatInputDisabledPlaceholder.value,
}));

// ==========================================
// 11. RESET LA SCHIMBARE CONVERSAȚIE & CLEANUP
// ==========================================
watch(
  () => String(props.chatId),
  () => {
    replyingTo.value = null;
    clearEdit();
    isSearchOpen.value = false;
    searchQuery.value = '';
    searchAnnouncement.value = '';
    closeOptionsMenu(false);
    lightboxActiveIndex.value = null;
    lightboxItems.value = [];
    clearHighlight();
    resetDragState();
    pendingNewMessages.value = 0;

    scrollToBottom('auto');
  }
);

onMounted(() => {
  scrollToBottom('auto');
  document.addEventListener('keydown', handleGlobalKeyDown);
  document.addEventListener('pointerdown', handleOptionsOutsidePointerDown);
  window.addEventListener('dragend', resetDragState);
  window.addEventListener('blur', resetDragState);
  nextTick(setupTopObserver);
});

onUnmounted(() => {
  disconnectTopObserver();
  clearHighlight();
  clearConfirmClearTimer();
  if (searchAnnounceTimer) clearTimeout(searchAnnounceTimer);
  document.removeEventListener('keydown', handleGlobalKeyDown);
  document.removeEventListener('pointerdown', handleOptionsOutsidePointerDown);
  window.removeEventListener('dragend', resetDragState);
  window.removeEventListener('blur', resetDragState);
});

defineExpose({
  jumpToMessage: scrollToAndHighlight,
  scrollToBottom,
  focusInput: () => chatInputRef.value?.focus(),
  openSearch,
  closeSearch: () => closeSearch(false),
  clearEdit,
});
</script>

<template>
  <div
    class="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-slate-950/40 relative"
    @dragenter="onDragEnter"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <!-- Drag & Drop Overlay -->
    <transition name="fade">
      <div
        v-if="isDragging"
        class="absolute inset-0 z-[100] bg-slate-900/85 backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed rounded-2xl m-4 pointer-events-none"
        :class="theme.border"
      >
        <UploadCloud
          :class="theme.text"
          :size="56"
          class="mb-3 motion-safe:animate-bounce"
          aria-hidden="true"
        />
        <p class="text-xl font-bold text-white mb-1">{{ t.dropFilesTitle }}</p>
        <p class="text-xs text-slate-400">{{ t.dropFilesSubtitle }}</p>
      </div>
    </transition>

    <!-- HEADER ADAPTIV + BARĂ CĂUTARE UNICĂ + MENIU OPȚIUNI -->
    <div ref="headerWrapperRef" class="shrink-0 relative z-30">
      <GroupChatHeader
        v-if="isGroupChat"
        ref="groupHeaderRef"
        :group="groupHeaderSubject"
        :theme="theme"
        :is-loading="isLoading"
        :connection-status="connectionStatus"
        :calls="effectiveCalls"
        :panels="groupHeaderPanels"
        :back-button="backButton"
        :unread-chats-count="unreadChatsCount"
        :locale="locale"
        :labels="t.header"
        :group-labels="t.groupHeader"
        @back="emit('back')"
        @search="toggleSearch"
        @voice-call="emit('voice-call')"
        @video-call="emit('video-call')"
        @options="toggleOptionsMenu"
        @open-profile="emit('open-profile')"
        @open-members="emit('open-members')"
      />

      <ChatHeader
        v-else
        ref="chatHeaderRef"
        :subject="directHeaderSubject"
        :theme="theme"
        :is-loading="isLoading"
        :connection-status="connectionStatus"
        :calls="effectiveCalls"
        :panels="headerPanels"
        :back-button="backButton"
        :unread-chats-count="unreadChatsCount"
        :labels="t.header"
        @back="emit('back')"
        @search="toggleSearch"
        @voice-call="emit('voice-call')"
        @video-call="emit('video-call')"
        @options="toggleOptionsMenu"
        @open-profile="emit('open-profile')"
      />

      <!-- BARĂ CĂUTARE ÎN CONVERSAȚIE (unică, fără duplicare între DM și Group) -->
      <transition name="slide-down">
        <div
          v-if="isSearchOpen"
          :id="searchPanelId"
          class="px-3 md:px-6 py-2 bg-slate-900/90 backdrop-blur-md border-b border-white/10 flex items-center gap-2"
        >
          <div class="relative flex-1 max-w-md">
            <Search
              :size="15"
              class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              :placeholder="t.searchPlaceholder"
              :aria-label="t.searchAriaLabel"
              @keydown="handleSearchKeyDown"
              class="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-1.5 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all"
              :class="searchFocusClass"
            />
          </div>

          <span
            v-if="searchQuery.trim()"
            class="text-[11px] font-mono tabular-nums text-slate-400 px-1.5 shrink-0"
          >
            {{
              searchMatches.length > 0
                ? `${currentMatchIndex + 1} / ${searchMatches.length}`
                : t.zeroResults
            }}
          </span>

          <span class="sr-only" aria-live="polite" aria-atomic="true">
            {{ searchAnnouncement }}
          </span>

          <div class="flex items-center gap-0.5 shrink-0">
            <AppTooltip
              :text="t.olderMatch"
              shortcut="Enter"
              :disabled="searchMatches.length === 0"
            >
              <button
                type="button"
                :disabled="searchMatches.length === 0"
                @click="goToOlderMatch"
                class="min-w-[36px] min-h-[36px] md:min-w-[30px] md:min-h-[30px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                :aria-label="t.olderMatch"
              >
                <ChevronUp :size="16" aria-hidden="true" />
              </button>
            </AppTooltip>

            <AppTooltip
              :text="t.newerMatch"
              shortcut="Shift+Enter"
              :disabled="searchMatches.length === 0"
            >
              <button
                type="button"
                :disabled="searchMatches.length === 0"
                @click="goToNewerMatch"
                class="min-w-[36px] min-h-[36px] md:min-w-[30px] md:min-h-[30px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                :aria-label="t.newerMatch"
              >
                <ChevronDown :size="16" aria-hidden="true" />
              </button>
            </AppTooltip>

            <AppTooltip :text="t.closeSearch" shortcut="Esc" align="right">
              <button
                type="button"
                @click="closeSearch(true)"
                class="min-w-[36px] min-h-[36px] md:min-w-[30px] md:min-h-[30px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-500 ml-0.5"
                :aria-label="t.closeSearch"
              >
                <X :size="16" aria-hidden="true" />
              </button>
            </AppTooltip>
          </div>
        </div>
      </transition>

      <!-- DROPDOWN OPȚIUNI CONVERSAȚIE (@options, cu navigare tastatură + Members pe mobil) -->
      <transition name="fade-fast">
        <div
          v-if="isOptionsOpen"
          :id="optionsMenuId"
          ref="optionsMenuRef"
          role="menu"
          :aria-label="t.optionsMenuAriaLabel"
          @keydown="onOptionsMenuKeyDown"
          class="absolute top-[68px] right-2 md:right-6 w-52 bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl py-1.5 z-40"
        >
          <button
            type="button"
            role="menuitem"
            @click="openSearch"
            class="w-full px-3.5 py-2.5 md:py-2 text-left text-xs text-slate-200 hover:bg-slate-800 focus-visible:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer outline-none"
          >
            <Search :size="15" class="text-slate-400" aria-hidden="true" />
            <span>{{ t.searchInChat }}</span>
          </button>

          <button
            v-if="isGroupChat"
            type="button"
            role="menuitem"
            @click="handleOpenMembersFromMenu"
            class="sm:hidden w-full px-3.5 py-2.5 text-left text-xs text-slate-200 hover:bg-slate-800 focus-visible:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer outline-none"
          >
            <Users :size="15" class="text-slate-400" aria-hidden="true" />
            <span>{{ t.viewMembers }}</span>
          </button>

          <button
            type="button"
            role="menuitem"
            @click="handleToggleMute"
            class="w-full px-3.5 py-2.5 md:py-2 text-left text-xs text-slate-200 hover:bg-slate-800 focus-visible:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer outline-none"
          >
            <Bell v-if="isMuted" :size="15" class="text-slate-400" aria-hidden="true" />
            <BellOff v-else :size="15" class="text-slate-400" aria-hidden="true" />
            <span>{{ isMuted ? t.unmuteNotifications : t.muteNotifications }}</span>
          </button>

          <div class="my-1 border-t border-white/10" role="separator" />

          <button
            type="button"
            role="menuitem"
            @click="handleClearChatClick"
            class="w-full px-3.5 py-2.5 md:py-2 text-left text-xs flex items-center gap-2.5 transition-colors cursor-pointer outline-none"
            :class="
              confirmClearChat
                ? 'bg-rose-500/20 text-rose-300 font-semibold'
                : 'text-rose-400 hover:bg-rose-500/15 focus-visible:bg-rose-500/15'
            "
          >
            <Trash2 :size="15" aria-hidden="true" />
            <span>{{ confirmClearChat ? t.confirmClearChat : t.clearChatHistory }}</span>
          </button>
        </div>
      </transition>
    </div>

    <!-- ZONA DE MESAJE -->
    <div class="flex-1 min-h-0 relative flex flex-col">
      <div
        ref="scrollContainerRef"
        role="log"
        aria-live="off"
        :aria-label="t.messagesAreaAriaLabel"
        @scroll.passive="handleScroll"
        class="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 md:px-6 py-4 flex flex-col scrollbar-hide"
      >
        <!-- 1. Loading Skeleton -->
        <div
          v-if="isLoading"
          class="flex-1 flex flex-col justify-end gap-4 py-2"
          aria-busy="true"
          :aria-label="t.loadingMessages"
        >
          <div class="flex justify-start">
            <div class="h-12 w-56 rounded-2xl rounded-tl-sm bg-slate-800/80 motion-safe:animate-pulse" />
          </div>
          <div class="flex justify-end">
            <div class="h-16 w-64 rounded-2xl rounded-tr-sm bg-slate-800/60 motion-safe:animate-pulse" />
          </div>
          <div class="flex justify-start">
            <div class="h-10 w-44 rounded-2xl rounded-tl-sm bg-slate-800/80 motion-safe:animate-pulse" />
          </div>
          <div class="flex justify-end">
            <div class="h-12 w-52 rounded-2xl rounded-tr-sm bg-slate-800/60 motion-safe:animate-pulse" />
          </div>
        </div>

        <!-- 2. Error State (când lista e complet goală) -->
        <div
          v-else-if="error && renderedMessages.length === 0"
          role="alert"
          class="flex-1 flex flex-col items-center justify-center text-center p-6 gap-3"
        >
          <div
            class="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-400"
          >
            <AlertCircle :size="22" aria-hidden="true" />
          </div>
          <div class="space-y-1 max-w-xs">
            <p class="text-sm font-semibold text-white">{{ t.errorTitle }}</p>
            <p class="text-xs text-slate-400">{{ error }}</p>
          </div>
          <button
            type="button"
            @click="emit('retry-load')"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <RotateCcw :size="14" aria-hidden="true" />
            <span>{{ t.retry }}</span>
          </button>
        </div>

        <!-- 3. Empty State -->
        <div
          v-else-if="renderedMessages.length === 0"
          class="flex-1 flex flex-col items-center justify-center text-center p-6 gap-3"
        >
          <div
            class="w-14 h-14 rounded-2xl border border-white/10 flex items-center justify-center"
            :class="theme.bgLight"
          >
            <MessageSquare :size="24" :class="theme.text" aria-hidden="true" />
          </div>
          <div class="space-y-1 max-w-xs">
            <p class="text-sm font-semibold text-white">
              {{ t.emptyTitle(partnerDisplayName) }}
            </p>
            <p class="text-xs text-slate-400">
              {{ t.emptyDescription }}
            </p>
          </div>
        </div>

        <!-- 4. Lista de Mesaje + Banner eroare paginare + Sentinel -->
        <template v-else>
          <!-- Banner compact de eroare (ex. când eșuează load-more pe mesaje vechi) -->
          <div
            v-if="error"
            role="alert"
            class="mb-3 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-between gap-2 text-xs text-rose-200"
          >
            <span class="flex items-center gap-2 min-w-0">
              <AlertCircle :size="14" class="text-rose-400 shrink-0" aria-hidden="true" />
              <span class="truncate">{{ error }}</span>
            </span>
            <button
              type="button"
              @click="emit('retry-load')"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-[11px] font-semibold text-rose-100 transition-colors cursor-pointer shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <RotateCcw :size="12" aria-hidden="true" />
              <span>{{ t.retry }}</span>
            </button>
          </div>

          <div
            v-if="hasMoreMessages || isLoadingMore"
            ref="topLoadMoreSentinelRef"
            class="pb-3 flex items-center justify-center"
          >
            <span
              v-if="isLoadingMore"
              class="inline-flex items-center gap-2 text-xs text-slate-400"
              aria-live="polite"
            >
              <Loader2 :size="14" class="motion-safe:animate-spin" aria-hidden="true" />
              <span>{{ t.loadingEarlierMessages }}</span>
            </span>
            <button
              v-else
              type="button"
              @click="triggerLoadMore"
              class="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
            >
              {{ t.loadEarlierMessages }}
            </button>
          </div>

          <div
            v-for="item in renderedMessages"
            :key="item.key"
            :class="item.showDateSeparator ? 'mt-4 first:mt-0' : item.isGrouped ? 'mt-1' : 'mt-3.5'"
          >
            <!-- Separator de Dată (doar când eticheta e validă) -->
            <div
              v-if="item.showDateSeparator && item.dateLabel"
              class="flex items-center justify-center my-3"
              role="separator"
            >
              <span
                class="px-3 py-1 rounded-full bg-slate-900/90 border border-white/10 text-[11px] font-medium text-slate-400 shadow-sm"
              >
                {{ item.dateLabel }}
              </span>
            </div>

            <!-- Wrapper unic pentru scroll + highlight lens-themed -->
            <div
              :ref="(el) => setMessageRef(item.message.id, el)"
              class="rounded-2xl px-1.5 py-0.5 transition-all duration-300"
              :class="
                highlightedMessageId !== null &&
                String(highlightedMessageId) === String(item.message.id)
                  ? `${accentRingClass} bg-white/[0.04]`
                  : ''
              "
            >
              <MessageBubble
                :message="item.message"
                :theme="theme"
                :partner-name="partnerDisplayName"
                :reply-message="item.replyMessage"
                :is-group="isGroupChat"
                :is-grouped="item.isGrouped"
                :is-last-in-group="item.isLastInGroup"
                :highlight-query="activeHighlightQuery"
                :interactive-mentions="interactiveMentions"
                :connection-status="connectionStatus"
                :current-user-id="currentUserId"
                :current-username="currentUsername"
                :locale="locale"
                :labels="t.bubble"
                @react="emit('react-message', $event)"
                @reply="startReply"
                @edit="startEdit"
                @delete="handleDelete"
                @retry="emit('retry-message', $event)"
                @jump-to-reply="scrollToAndHighlight"
                @preview-image="openLightbox"
                @mention-click="emit('mention-click', $event)"
              />
            </div>
          </div>
        </template>
      </div>

      <!-- Buton Plutitor "Scroll to bottom" -->
      <transition name="fade-fast">
        <button
          v-if="!isLoading && !isNearBottom && renderedMessages.length > 0"
          type="button"
          @click="scrollToBottom('smooth')"
          class="absolute bottom-4 right-4 md:right-6 z-20 min-w-[44px] min-h-[44px] md:min-w-[40px] md:min-h-[40px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-slate-900/95 hover:bg-slate-800 border border-white/15 text-slate-200 shadow-xl transition-all active:scale-95 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          :aria-label="t.scrollToBottomAriaLabel"
        >
          <span
            v-if="pendingNewMessages > 0"
            class="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white leading-none tabular-nums"
            :class="theme.bg"
          >
            {{ pendingNewMessages > 99 ? '99+' : pendingNewMessages }}
          </span>
          <ArrowDown :size="16" aria-hidden="true" />
        </button>
      </transition>
    </div>

    <!-- INPUT DE CHAT -->
    <ChatInput
      ref="chatInputRef"
      :chat-id="chatId"
      :editing-target="editingTarget"
      :replying-to="chatReplyTarget"
      :mention-users="resolvedMentionUsers"
      :commands="commands"
      :disabled="connectionStatus === 'offline' || isLoading || isBlocked"
      :is-sending="isSending"
      :theme="theme"
      :labels="mergedInputLabels"
      @cancel-action="cancelInputAction"
      @send="handleSend"
      @edit="handleEdit"
      @typing="emit('typing', $event)"
    />

    <!-- MEDIA LIGHTBOX REUTILIZABIL -->
    <MediaLightbox
      v-model:active-index="lightboxActiveIndex"
      :items="lightboxItems"
      :can-jump-to-message="true"
      :locale="locale"
      :labels="t.lightbox"
      @jump-to-message="scrollToAndHighlight"
    />
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 0.14s ease, transform 0.14s ease;
}
.fade-fast-enter-from,
.fade-fast-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.97);
}
.slide-down-enter-active,
.slide-down-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>