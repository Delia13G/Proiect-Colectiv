<!-- src/components/chat/ChatListView.vue -->
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import {
  Search,
  ChevronRight,
  Check,
  CheckCheck,
  Clock,
  MessageSquare,
  MessageSquarePlus,
  Users,
  Pin,
  BellOff,
  Bell,
  Mail,
  MailOpen,
  X,
  AlertCircle,
  RotateCcw,
  MoreVertical,
  Image as ImageIcon,
  Mic,
  FileText,
  Video,
  Phone,
  PhoneMissed,
  Loader2,
} from 'lucide-vue-next';
import AppTooltip from '../ui/AppTooltip.vue';
import { useChatDrafts } from '../../composables/useChatDrafts';
import { getAvatarInitials, getAvatarTone } from '../../utils/avatar';
import type { ConnectionStatus } from './ChatHeader.vue';

export type ChatLens = 'PRO' | 'SOCIAL' | 'DATE';
export type MessageDeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type ChatPresenceStatus = 'online' | 'away' | 'busy' | 'dnd' | 'offline';
export type ChatMessagePreviewKind =
  | 'text'
  | 'image'
  | 'audio'
  | 'file'
  | 'video'
  | 'call'
  | 'missed-call';
export type ChatFilterTab = 'all' | 'unread' | 'groups';

export interface ChatListItem {
  id: string | number;
  name: string;
  message?: string | null;
  lastMessageKind?: ChatMessagePreviewKind;
  lastMessageSenderName?: string | null;
  /** Timestamp real pentru sortare automată și formatare relativă */
  lastMessageAt?: string | number | Date | null;
  /** Override opțional pentru eticheta afișată dacă nu se furnizează lastMessageAt */
  timestamp?: string;
  unread: number;
  avatarUrl?: string | null;
  isGroup?: boolean;
  status?: ChatPresenceStatus | null;
  isTyping?: boolean;
  typingText?: string | null;
  isPinned?: boolean;
  isMuted?: boolean;
  isLastMessageMine?: boolean;
  deliveryStatus?: MessageDeliveryStatus;
  /** Override opțional (dacă draft-ul vine din Pinia/backend în loc de useChatDrafts) */
  draft?: string | null;
}

export interface ChatListLabels {
  title: string;
  subtitle: (lens: ChatLens) => string;
  searchPlaceholder: string;
  searchAriaLabel: string;
  clearSearch: string;
  newChat: string;
  newChatAriaLabel: string;
  filterGroupAriaLabel: string;
  filterAll: string;
  filterUnread: string;
  filterGroups: string;
  loading: string;
  loadingMore: string;
  loadMore: string;
  errorTitle: string;
  retry: string;
  emptyFilteredTitle: string;
  emptyFilteredDescription: string;
  clearFilters: string;
  emptyTitle: string;
  emptyDescription: (lens: ChatLens) => string;
  startChat: string;
  typingFallback: string;
  draftPrefix: string;
  yesterday: string;
  mediaLabels: Record<Exclude<ChatMessagePreviewKind, 'text'>, string>;
  unreadBadgeAriaLabel: (count: number) => string;
  pinChat: string;
  unpinChat: string;
  muteChat: string;
  unmuteChat: string;
  markAsRead: string;
  markAsUnread: string;
  moreActionsFor: (name: string) => string;
  searchResultsAnnouncement: (count: number) => string;
}

export type ChatListLabelOverrides = Partial<Omit<ChatListLabels, 'mediaLabels'>> & {
  mediaLabels?: Partial<Record<Exclude<ChatMessagePreviewKind, 'text'>, string>>;
};

const DEFAULT_LABELS: ChatListLabels = {
  title: 'Conversations',
  subtitle: (lens) => `Manage your ${lens.toLowerCase()} chats and messages.`,
  searchPlaceholder: 'Search chats...',
  searchAriaLabel: 'Search conversations',
  clearSearch: 'Clear search',
  newChat: 'New chat',
  newChatAriaLabel: 'Start new conversation',
  filterGroupAriaLabel: 'Filter conversations',
  filterAll: 'All',
  filterUnread: 'Unread',
  filterGroups: 'Groups',
  loading: 'Loading conversations',
  loadingMore: 'Loading more conversations',
  loadMore: 'Load more',
  errorTitle: "Couldn't load conversations",
  retry: 'Retry',
  emptyFilteredTitle: 'No matching conversations',
  emptyFilteredDescription: 'Try another search term or switch back to all chats.',
  clearFilters: 'Clear filters',
  emptyTitle: 'No conversations yet',
  emptyDescription: (lens) => `Start a new ${lens.toLowerCase()} conversation to see it here.`,
  startChat: 'Start a chat',
  typingFallback: 'Typing',
  draftPrefix: 'Draft:',
  yesterday: 'Yesterday',
  mediaLabels: {
    image: 'Photo',
    audio: 'Voice message',
    file: 'File',
    video: 'Video',
    call: 'Call',
    'missed-call': 'Missed call',
  },
  unreadBadgeAriaLabel: (count) =>
    count === 1 ? '1 unread message' : `${count} unread messages`,
  pinChat: 'Pin chat',
  unpinChat: 'Unpin chat',
  muteChat: 'Mute notifications',
  unmuteChat: 'Unmute notifications',
  markAsRead: 'Mark as read',
  markAsUnread: 'Mark as unread',
  moreActionsFor: (name) => `More actions for ${name}`,
  searchResultsAnnouncement: (count) =>
    count === 0
      ? 'No matching conversations'
      : count === 1
        ? '1 conversation found'
        : `${count} conversations found`,
};

export interface ChatListLensTheme {
  text: string;
  bg: string;
  hover: string;
  activeRow: string;
  focusRing: string;
  tabActive: string;
  mark: string;
}

// 100% clase statice pentru Tailwind JIT/v4
const LENS_THEMES: Record<ChatLens, ChatListLensTheme> = {
  DATE: {
    text: 'text-rose-400',
    bg: 'bg-rose-500',
    hover: 'hover:bg-rose-500/10',
    activeRow: 'bg-rose-500/15 ring-1 ring-rose-500/30',
    focusRing: 'focus:ring-rose-500/50 focus:border-rose-500/50',
    tabActive: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    mark: 'bg-rose-500/30 text-rose-100',
  },
  SOCIAL: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500',
    hover: 'hover:bg-emerald-500/10',
    activeRow: 'bg-emerald-500/15 ring-1 ring-emerald-500/30',
    focusRing: 'focus:ring-emerald-500/50 focus:border-emerald-500/50',
    tabActive: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    mark: 'bg-emerald-500/30 text-emerald-100',
  },
  PRO: {
    text: 'text-indigo-400',
    bg: 'bg-indigo-500',
    hover: 'hover:bg-indigo-500/10',
    activeRow: 'bg-indigo-500/15 ring-1 ring-indigo-500/30',
    focusRing: 'focus:ring-indigo-500/50 focus:border-indigo-500/50',
    tabActive: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    mark: 'bg-indigo-500/30 text-indigo-100',
  },
};

const PRESENCE_DOT_CLASSES: Record<ChatPresenceStatus, string> = {
  online: 'bg-emerald-500',
  away: 'bg-amber-400',
  busy: 'bg-rose-500',
  dnd: 'bg-rose-500',
  offline: '',
};

const FUTURE_SKEW_TOLERANCE_MS = 5 * 60_000;

interface HighlightSegment {
  text: string;
  match: boolean;
}

interface DisplayRow {
  key: string;
  chat: ChatListItem;
  isActive: boolean;
  avatarUrl: string | null;
  hasValidAvatar: boolean;
  initials: string;
  avatarTone: { surface: string; border: string };
  presenceDotClass: string;
  unreadCount: number;
  draft: string;
  previewText: string;
  previewKind: ChatMessagePreviewKind;
  timestampLabel: string;
  nameParts: HighlightSegment[];
  previewParts: HighlightSegment[];
  draftParts: HighlightSegment[];
}

export interface ChatListViewProps {
  activeLens: ChatLens;
  chats?: ChatListItem[];
  activeChatId?: string | number | null;
  variant?: 'page' | 'sidebar';
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  error?: string | null;
  connectionStatus?: ConnectionStatus;
  showNewChatButton?: boolean;
  enableShortcuts?: boolean;
  locale?: string;
  labels?: ChatListLabelOverrides;
}

const props = withDefaults(defineProps<ChatListViewProps>(), {
  chats: () => [],
  activeChatId: null,
  variant: 'page',
  isLoading: false,
  isLoadingMore: false,
  hasMore: false,
  error: null,
  connectionStatus: 'connected',
  showNewChatButton: true,
  enableShortcuts: true,
  locale: undefined,
  labels: () => ({}),
});

const emit = defineEmits<{
  select: [chat: ChatListItem];
  'new-chat': [];
  retry: [];
  'load-more': [];
  'toggle-pin': [chatId: string | number];
  'toggle-mute': [chatId: string | number];
  'toggle-read': [chatId: string | number];
}>();

const t = computed<ChatListLabels>(() => ({
  ...DEFAULT_LABELS,
  ...props.labels,
  mediaLabels: {
    ...DEFAULT_LABELS.mediaLabels,
    ...props.labels?.mediaLabels,
  },
}));

const theme = computed(() => LENS_THEMES[props.activeLens] ?? LENS_THEMES.PRO);
const isSidebar = computed(() => props.variant === 'sidebar');
const showGroupsTab = computed(() => props.activeLens !== 'DATE');

// ==========================================
// 1. DRAFT-URI REACTIVE (același tab + multi-tab)
// ==========================================
const { drafts: sharedDrafts } = useChatDrafts();

// ==========================================
// 2. NORMALIZARE UNICODE (Căutare + Highlight fără diacritice, XSS-safe)
// ==========================================
const collapseWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim();

const foldText = (input: string): string =>
  input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const highlightDiacriticInsensitive = (
  text: string,
  foldedQuery: string
): HighlightSegment[] => {
  if (!text) return [];
  if (!foldedQuery) return [{ text, match: false }];

  let folded = '';
  const charMap: Array<{ start: number; end: number }> = [];

  for (let i = 0; i < text.length; ) {
    const codePoint = text.codePointAt(i);
    const step = codePoint !== undefined && codePoint > 0xffff ? 2 : 1;
    const rawChar = text.slice(i, i + step);
    const foldedChar = rawChar
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    for (let k = 0; k < foldedChar.length; k++) {
      folded += foldedChar[k];
      charMap.push({ start: i, end: i + step });
    }
    i += step;
  }

  const segments: HighlightSegment[] = [];
  let cursor = 0;
  let searchFrom = 0;

  while (searchFrom < folded.length) {
    const idx = folded.indexOf(foldedQuery, searchFrom);
    if (idx === -1) break;

    const firstMap = charMap[idx];
    const lastMap = charMap[idx + foldedQuery.length - 1];
    if (!firstMap || !lastMap) break;

    if (firstMap.start > cursor) {
      segments.push({ text: text.slice(cursor, firstMap.start), match: false });
    }
    segments.push({ text: text.slice(firstMap.start, lastMap.end), match: true });
    cursor = lastMap.end;
    searchFrom = idx + foldedQuery.length;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), match: false });
  }

  return segments.length > 0 ? segments : [{ text, match: false }];
};

// ==========================================
// 3. FORMATARE RELATIVĂ TIMESTAMP (cu actualizare automată la 60s)
// ==========================================
const nowTick = ref(Date.now());
let clockTimer: ReturnType<typeof setInterval> | null = null;

const createDateFormatter = (options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat => {
  try {
    return new Intl.DateTimeFormat(props.locale || undefined, options);
  } catch {
    return new Intl.DateTimeFormat(undefined, options);
  }
};

const timeFormatter = computed(() =>
  createDateFormatter({ hour: '2-digit', minute: '2-digit' })
);
const weekdayFormatter = computed(() => createDateFormatter({ weekday: 'short' }));
const sameYearFormatter = computed(() =>
  createDateFormatter({ month: 'short', day: 'numeric' })
);
const fullDateFormatter = computed(() =>
  createDateFormatter({ year: 'numeric', month: 'short', day: 'numeric' })
);

const parseTimestampMs = (value?: string | number | Date | null): number | null => {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatRelativeTimestamp = (ms: number, referenceNow: number): string => {
  const date = new Date(ms);

  // Toleranță mică pentru diferențe de ceas client/server în jurul miezului nopții
  if (ms > referenceNow && ms - referenceNow <= FUTURE_SKEW_TOLERANCE_MS) {
    return timeFormatter.value.format(date);
  }

  const now = new Date(referenceNow);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((startOfToday - startOfTarget) / 86_400_000);

  if (diffDays === 0) return timeFormatter.value.format(date);
  if (diffDays === 1) return t.value.yesterday;
  if (diffDays > 1 && diffDays < 7) return weekdayFormatter.value.format(date);
  if (date.getFullYear() === now.getFullYear()) return sameYearFormatter.value.format(date);
  return fullDateFormatter.value.format(date);
};

// ==========================================
// 4. AVATARE & DEDUPLICARE
// ==========================================
const failedAvatars = ref<Set<string>>(new Set());

const normalizeUrl = (url?: string | null): string | null => {
  const trimmed = url?.trim();
  return trimmed ? trimmed : null;
};

const getAvatarKey = (id: string | number, avatarUrl: string | null) =>
  `${String(id)}:${avatarUrl ?? ''}`;

const markAvatarFailed = (id: string | number, avatarUrl: string | null) => {
  const key = getAvatarKey(id, avatarUrl);
  if (failedAvatars.value.has(key)) return;
  const next = new Set(failedAvatars.value);
  next.add(key);
  failedAvatars.value = next;
};

watch(
  () => props.connectionStatus,
  (nextStatus, prevStatus) => {
    if (nextStatus === 'connected' && prevStatus && prevStatus !== 'connected') {
      failedAvatars.value = new Set();
    }
  }
);

watch(
  () => props.activeLens,
  () => {
    searchQuery.value = '';
    activeFilter.value = 'all';
    highlightedIndex.value = -1;
    closeContextMenu(false);
    failedAvatars.value = new Set();
  }
);

// Deduplicare după id (protecție WebSocket)
const uniqueChats = computed<ChatListItem[]>(() => {
  const seen = new Set<string>();
  const result: ChatListItem[] = [];
  for (const chat of props.chats) {
    const key = String(chat.id);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(chat);
  }
  return result;
});

const sanitizeUnread = (value: number): number =>
  Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;

const formatUnread = (count: number) => (count > 99 ? '99+' : String(count));

const isActiveChat = (chatId: string | number) =>
  props.activeChatId !== null &&
  props.activeChatId !== undefined &&
  String(props.activeChatId) === String(chatId);

// ==========================================
// 5. SEARCH, FILTRE, SORTARE & DISPLAY ROWS PRECALCULATE
// ==========================================
const searchQuery = ref('');
const activeFilter = ref<ChatFilterTab>('all');
const searchInputRef = ref<HTMLInputElement | null>(null);
const listScrollRef = ref<HTMLElement | null>(null);
const loadMoreSentinelRef = ref<HTMLElement | null>(null);

const isMac = ref(false);
const searchShortcutLabel = computed(() => (isMac.value ? '⌘K' : 'Ctrl+K'));
const foldedQuery = computed(() => foldText(searchQuery.value.trim()));

const unreadChatsCount = computed(
  () => uniqueChats.value.filter((c) => sanitizeUnread(c.unread) > 0).length
);
const groupsCount = computed(() => uniqueChats.value.filter((c) => Boolean(c.isGroup)).length);

const hasActiveFilters = computed(
  () => foldedQuery.value.length > 0 || activeFilter.value !== 'all'
);

const resolvePreviewText = (chat: ChatListItem): string => {
  const rawMessage = collapseWhitespace(chat.message ?? '');
  const kind = chat.lastMessageKind ?? 'text';
  const body = rawMessage || (kind !== 'text' ? t.value.mediaLabels[kind] : '');

  if (!body) return '';
  const sender = chat.lastMessageSenderName?.trim();
  if (chat.isGroup && !chat.isLastMessageMine && sender) {
    return `${sender}: ${body}`;
  }
  return body;
};

const displayRows = computed<DisplayRow[]>(() => {
  const query = foldedQuery.value;
  const referenceNow = nowTick.value;
  const draftsSnapshot = sharedDrafts.value;
  const failedSnapshot = failedAvatars.value;

  const candidates: Array<{ row: DisplayRow; timestampMs: number | null }> = [];

  for (const chat of uniqueChats.value) {
    const key = String(chat.id);
    const safeName = chat.name ?? '';
    const unreadCount = sanitizeUnread(chat.unread);

    if (activeFilter.value === 'unread' && unreadCount <= 0) continue;
    if (activeFilter.value === 'groups' && !chat.isGroup) continue;

    const active = isActiveChat(chat.id);
    const rawDraft = active
      ? ''
      : collapseWhitespace(
          chat.draft !== undefined && chat.draft !== null
            ? chat.draft
            : (draftsSnapshot[key] ?? '')
        );

    const previewText = resolvePreviewText(chat);

    if (query) {
      const matchesName = foldText(safeName).includes(query);
      const matchesMessage = foldText(previewText).includes(query);
      const matchesDraft = rawDraft ? foldText(rawDraft).includes(query) : false;
      if (!matchesName && !matchesMessage && !matchesDraft) continue;
    }

    const avatarUrl = normalizeUrl(chat.avatarUrl);
    const hasValidAvatar =
      Boolean(avatarUrl) && !failedSnapshot.has(getAvatarKey(chat.id, avatarUrl));

    const timestampMs = parseTimestampMs(chat.lastMessageAt);
    const timestampLabel =
      timestampMs !== null
        ? formatRelativeTimestamp(timestampMs, referenceNow)
        : (chat.timestamp ?? '');

    candidates.push({
      timestampMs,
      row: {
        key,
        chat,
        isActive: active,
        avatarUrl,
        hasValidAvatar,
        initials: getAvatarInitials(safeName, 2) || '?',
        avatarTone: getAvatarTone(safeName),
        presenceDotClass: chat.status ? PRESENCE_DOT_CLASSES[chat.status] : '',
        unreadCount,
        draft: rawDraft,
        previewText,
        previewKind: chat.lastMessageKind ?? 'text',
        timestampLabel,
        nameParts: highlightDiacriticInsensitive(safeName, query),
        previewParts: highlightDiacriticInsensitive(previewText, query),
        draftParts: rawDraft ? highlightDiacriticInsensitive(rawDraft, query) : [],
      },
    });
  }

  candidates.sort((a, b) => {
    const pinDiff = Number(Boolean(b.row.chat.isPinned)) - Number(Boolean(a.row.chat.isPinned));
    if (pinDiff !== 0) return pinDiff;

    if (a.timestampMs !== null && b.timestampMs !== null) {
      return b.timestampMs - a.timestampMs;
    }
    if (a.timestampMs !== null) return -1;
    if (b.timestampMs !== null) return 1;
    return 0;
  });

  return candidates.map((entry) => entry.row);
});

const resetFilters = () => {
  searchQuery.value = '';
  activeFilter.value = 'all';
  highlightedIndex.value = -1;
  searchInputRef.value?.focus();
};

// Anunț aria-live debounced pentru rezultate căutare / filtrare
const liveSearchAnnouncement = ref('');
let announceTimer: ReturnType<typeof setTimeout> | null = null;

watch([foldedQuery, activeFilter, () => displayRows.value.length], () => {
  if (announceTimer) {
    clearTimeout(announceTimer);
    announceTimer = null;
  }
  if (!hasActiveFilters.value) {
    liveSearchAnnouncement.value = '';
    return;
  }
  announceTimer = setTimeout(() => {
    liveSearchAnnouncement.value = t.value.searchResultsAnnouncement(displayRows.value.length);
    announceTimer = null;
  }, 400);
});

// ==========================================
// 6. NAVIGARE RAPIDĂ DIN TASTATURĂ (Search -> ArrowDown/Up -> Enter)
// ==========================================
const highlightedIndex = ref(-1);
const rowRefs = new Map<string, HTMLElement>();
const rowButtonRefs = new Map<string, HTMLButtonElement>();

const setRowRef = (key: string, el: unknown) => {
  if (el instanceof HTMLElement) rowRefs.set(key, el);
  else rowRefs.delete(key);
};

const setRowButtonRef = (key: string, el: unknown) => {
  if (el instanceof HTMLButtonElement) rowButtonRefs.set(key, el);
  else rowButtonRefs.delete(key);
};

const scrollHighlightedIntoView = () => {
  const row = displayRows.value[highlightedIndex.value];
  if (!row) return;
  rowRefs.get(row.key)?.scrollIntoView({ block: 'nearest' });
};

watch([foldedQuery, activeFilter], () => {
  highlightedIndex.value = -1;
});

watch(displayRows, (rows) => {
  if (highlightedIndex.value >= rows.length) {
    highlightedIndex.value = rows.length - 1;
  }
  if (openMenuKey.value && !rows.some((r) => r.key === openMenuKey.value)) {
    closeContextMenu(false);
  }
});

const onSearchKeyDown = (event: KeyboardEvent) => {
  if (event.isComposing || event.keyCode === 229) return;
  const count = displayRows.value.length;

  if (event.key === 'ArrowDown' && count > 0) {
    event.preventDefault();
    highlightedIndex.value = (highlightedIndex.value + 1) % count;
    scrollHighlightedIntoView();
    return;
  }

  if (event.key === 'ArrowUp' && count > 0) {
    event.preventDefault();
    highlightedIndex.value =
      highlightedIndex.value <= 0 ? count - 1 : highlightedIndex.value - 1;
    scrollHighlightedIntoView();
    return;
  }

  if (event.key === 'Enter' && count > 0) {
    const targetIdx =
      highlightedIndex.value >= 0 ? highlightedIndex.value : count === 1 ? 0 : -1;
    if (targetIdx >= 0 && displayRows.value[targetIdx]) {
      event.preventDefault();
      handleSelectChat(displayRows.value[targetIdx].chat);
      highlightedIndex.value = -1;
    }
    return;
  }

  if (event.key === 'Escape') {
    if (searchQuery.value) {
      event.preventDefault();
      searchQuery.value = '';
      highlightedIndex.value = -1;
    } else if (highlightedIndex.value !== -1) {
      event.preventDefault();
      highlightedIndex.value = -1;
    }
  }
};

const onSearchBlur = () => {
  highlightedIndex.value = -1;
};

// ==========================================
// 7. ACȚIUNI RAPIDE & MENIU CONTEXTUAL (Desktop Hover + Right-Click + Mobil)
// ==========================================
const focusedActionsKey = ref<string | null>(null);
const openMenuKey = ref<string | null>(null);
const openMenuPlacement = ref<'down' | 'up'>('down');
const contextMenuRefs = new Map<string, HTMLElement>();
const menuTriggerRefs = new Map<string, HTMLButtonElement>();
let menuOpenedViaTrigger = false;

const setContextMenuRef = (key: string, el: unknown) => {
  if (el instanceof HTMLElement) contextMenuRefs.set(key, el);
  else contextMenuRefs.delete(key);
};

const setMenuTriggerRef = (key: string, el: unknown) => {
  if (el instanceof HTMLButtonElement) menuTriggerRefs.set(key, el);
  else menuTriggerRefs.delete(key);
};

const getActiveContextMenu = (): HTMLElement | null =>
  openMenuKey.value ? (contextMenuRefs.get(openMenuKey.value) ?? null) : null;

const onActionsFocusIn = (key: string) => {
  focusedActionsKey.value = key;
};

const onActionsFocusOut = (key: string, event: FocusEvent) => {
  const currentTarget = event.currentTarget as HTMLElement | null;
  const nextTarget = event.relatedTarget as Node | null;
  if (currentTarget && nextTarget && currentTarget.contains(nextTarget)) return;
  if (focusedActionsKey.value === key) {
    focusedActionsKey.value = null;
  }
};

const computeMenuPlacement = (rowKey: string): 'down' | 'up' => {
  const rowEl = rowRefs.get(rowKey);
  if (!rowEl || typeof window === 'undefined') return 'down';
  const rowRect = rowEl.getBoundingClientRect();
  const containerBottom = listScrollRef.value
    ? Math.min(listScrollRef.value.getBoundingClientRect().bottom, window.innerHeight)
    : window.innerHeight;
  return containerBottom - rowRect.bottom < 148 ? 'up' : 'down';
};

const openContextMenu = (rowKey: string, viaTrigger: boolean) => {
  if (openMenuKey.value === rowKey && viaTrigger) {
    closeContextMenu(true);
    return;
  }
  openMenuPlacement.value = computeMenuPlacement(rowKey);
  openMenuKey.value = rowKey;
  menuOpenedViaTrigger = viaTrigger;

  nextTick(() => {
    const firstItem = getActiveContextMenu()?.querySelector<HTMLButtonElement>('[role="menuitem"]');
    firstItem?.focus();
  });
};

const closeContextMenu = (restoreFocus: boolean) => {
  const closingKey = openMenuKey.value;
  if (!closingKey) return;
  const viaTrigger = menuOpenedViaTrigger;
  openMenuKey.value = null;
  menuOpenedViaTrigger = false;

  if (restoreFocus) {
    nextTick(() => {
      if (viaTrigger) {
        menuTriggerRefs.get(closingKey)?.focus();
      } else {
        rowButtonRefs.get(closingKey)?.focus();
      }
    });
  }
};

const onContextMenuKeyDown = (event: KeyboardEvent) => {
  if (!openMenuKey.value) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    closeContextMenu(true);
    return;
  }

  if (event.key === 'Tab') {
    closeContextMenu(false);
    return;
  }

  const menuEl = getActiveContextMenu();
  const items = Array.from(menuEl?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
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

const handleOutsidePointerDown = (event: PointerEvent) => {
  if (!openMenuKey.value) return;
  const target = event.target as Node | null;
  if (!target) return;

  const activeMenu = getActiveContextMenu();
  const trigger = menuTriggerRefs.get(openMenuKey.value);
  if (activeMenu?.contains(target) || trigger?.contains(target)) {
    return;
  }
  closeContextMenu(false);
};

const handleSelectChat = (chat: ChatListItem) => {
  closeContextMenu(false);
  emit('select', chat);
};

const triggerPin = (chat: ChatListItem) => {
  closeContextMenu(false);
  emit('toggle-pin', chat.id);
};

const triggerMute = (chat: ChatListItem) => {
  closeContextMenu(false);
  emit('toggle-mute', chat.id);
};

const triggerRead = (chat: ChatListItem) => {
  closeContextMenu(false);
  emit('toggle-read', chat.id);
};

// ==========================================
// 8. INFINITE SCROLL (IntersectionObserver + fallback accesibil)
// ==========================================
let loadMoreObserver: IntersectionObserver | null = null;

const disconnectObserver = () => {
  if (loadMoreObserver) {
    loadMoreObserver.disconnect();
    loadMoreObserver = null;
  }
};

const triggerLoadMore = () => {
  if (!props.hasMore || props.isLoadingMore || props.isLoading || props.error) return;
  emit('load-more');
};

const setupLoadMoreObserver = () => {
  disconnectObserver();
  if (
    typeof IntersectionObserver === 'undefined' ||
    !props.hasMore ||
    !listScrollRef.value ||
    !loadMoreSentinelRef.value
  ) {
    return;
  }

  loadMoreObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        triggerLoadMore();
      }
    },
    {
      root: listScrollRef.value,
      rootMargin: '120px',
    }
  );

  loadMoreObserver.observe(loadMoreSentinelRef.value);
};

watch([listScrollRef, loadMoreSentinelRef, () => props.hasMore], () => {
  nextTick(setupLoadMoreObserver);
});

// ==========================================
// 9. SHORTCUT GLOBAL Ctrl+K / ⌘K (SSR-safe, platform-aware, modal-safe)
// ==========================================
const onGlobalKeyDown = (event: KeyboardEvent) => {
  if (!props.enableShortcuts || event.defaultPrevented || event.repeat) return;

  const input = searchInputRef.value;
  // Verificare sigură pentru vizibilitate (inclusiv în containere position: fixed)
  if (!input || input.getClientRects().length === 0) return;

  if (
    typeof document !== 'undefined' &&
    document.querySelector('[aria-modal="true"], dialog[open]')
  ) {
    return;
  }

  const isModifierPressed = isMac.value
    ? event.metaKey && !event.ctrlKey
    : event.ctrlKey && !event.metaKey;

  if (isModifierPressed && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    input.focus();
    input.select();
  }
};

onMounted(() => {
  isMac.value = /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
  clockTimer = setInterval(() => {
    nowTick.value = Date.now();
  }, 60_000);

  window.addEventListener('keydown', onGlobalKeyDown);
  document.addEventListener('pointerdown', handleOutsidePointerDown);
  nextTick(setupLoadMoreObserver);
});

onUnmounted(() => {
  disconnectObserver();
  if (clockTimer) {
    clearInterval(clockTimer);
    clockTimer = null;
  }
  if (announceTimer) {
    clearTimeout(announceTimer);
    announceTimer = null;
  }
  window.removeEventListener('keydown', onGlobalKeyDown);
  document.removeEventListener('pointerdown', handleOutsidePointerDown);
});

defineExpose({
  focusSearch: () => {
    searchInputRef.value?.focus();
    searchInputRef.value?.select();
  },
  resetFilters,
});
</script>

<template>
  <section
    :aria-label="t.title"
    class="flex flex-col h-full min-h-0 select-none"
    :class="
      isSidebar
        ? 'w-full bg-slate-900/70 border-r border-white/10'
        : 'flex-1 bg-slate-950/40 p-4 sm:p-6 md:p-8'
    "
  >
    <!-- HEADER, SEARCH UNIFICAT & FILTRE -->
    <div
      :class="
        isSidebar
          ? 'p-3 border-b border-white/10 space-y-2.5 shrink-0'
          : 'mb-6 space-y-4 shrink-0'
      "
    >
      <div
        class="flex gap-3"
        :class="
          isSidebar
            ? 'flex-col'
            : 'flex-col md:flex-row md:items-center justify-between'
        "
      >
        <!-- Titlu (+ buton New Chat aliniat în dreapta în modul sidebar) -->
        <div class="flex items-center justify-between gap-2 min-w-0">
          <div class="min-w-0">
            <h1
              class="font-bold text-white flex items-center gap-2.5 truncate"
              :class="isSidebar ? 'text-base md:text-lg' : 'text-2xl md:text-3xl mb-1'"
            >
              <MessageSquare
                :class="theme.text"
                :size="isSidebar ? 20 : 28"
                aria-hidden="true"
              />
              <span class="truncate">{{ t.title }}</span>
            </h1>
            <p v-if="!isSidebar" class="text-slate-400 text-sm">
              {{ t.subtitle(activeLens) }}
            </p>
          </div>

          <AppTooltip
            v-if="isSidebar && showNewChatButton"
            :text="t.newChat"
            align="right"
          >
            <button
              type="button"
              @click="emit('new-chat')"
              class="shrink-0 min-w-[44px] min-h-[44px] md:min-w-[36px] md:min-h-[36px] inline-flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              :aria-label="t.newChatAriaLabel"
            >
              <MessageSquarePlus :size="18" aria-hidden="true" />
            </button>
          </AppTooltip>
        </div>

        <!-- Bară unificată Search (+ New Chat în modul page) -->
        <div class="flex items-center gap-2" :class="isSidebar ? 'w-full' : 'w-full md:w-auto'">
          <div class="relative flex-1" :class="isSidebar ? 'w-full' : 'md:w-72'">
            <Search
              class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              :size="isSidebar ? 15 : 17"
              aria-hidden="true"
            />
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              :placeholder="t.searchPlaceholder"
              :aria-label="t.searchAriaLabel"
              @keydown="onSearchKeyDown"
              @blur="onSearchBlur"
              class="w-full border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all"
              :class="[
                theme.focusRing,
                isSidebar
                  ? 'bg-slate-950/70 py-2 pl-9 pr-14 text-xs'
                  : 'bg-slate-900 py-2.5 pl-10 pr-16 text-sm',
              ]"
            />
            <button
              v-if="searchQuery"
              type="button"
              @click="searchQuery = ''; searchInputRef?.focus()"
              class="absolute right-0 md:right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] md:min-w-[28px] md:min-h-[28px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
              :aria-label="t.clearSearch"
            >
              <X :size="isSidebar ? 13 : 14" aria-hidden="true" />
            </button>
            <kbd
              v-else-if="enableShortcuts"
              class="pointer-events-none hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 font-mono rounded bg-slate-800 text-slate-400 border border-white/10"
              :class="isSidebar ? 'px-1 py-0.5 text-[9px]' : 'px-1.5 py-0.5 text-[10px]'"
            >
              {{ searchShortcutLabel }}
            </kbd>
          </div>

          <AppTooltip
            v-if="!isSidebar && showNewChatButton"
            :text="t.newChat"
            align="right"
          >
            <button
              type="button"
              @click="emit('new-chat')"
              class="shrink-0 min-h-[44px] md:min-h-[42px] px-3.5 py-2.5 inline-flex items-center justify-center gap-1.5 rounded-xl font-medium text-sm text-white shadow-md hover:opacity-95 transition-all cursor-pointer active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              :class="theme.bg"
              :aria-label="t.newChatAriaLabel"
            >
              <MessageSquarePlus :size="18" aria-hidden="true" />
              <span class="hidden sm:inline">{{ t.newChat }}</span>
            </button>
          </AppTooltip>
        </div>
      </div>

      <!-- Filtre rapide (role="group" + aria-pressed) -->
      <div
        class="flex items-center gap-1.5 overflow-x-auto scrollbar-hide"
        role="group"
        :aria-label="t.filterGroupAriaLabel"
      >
        <button
          type="button"
          :aria-pressed="activeFilter === 'all'"
          @click="activeFilter = 'all'"
          class="px-3 py-1.5 md:py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-500 shrink-0"
          :class="
            activeFilter === 'all'
              ? theme.tabActive
              : 'border-transparent bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-800/80'
          "
        >
          {{ t.filterAll }}
        </button>

        <button
          type="button"
          :aria-pressed="activeFilter === 'unread'"
          @click="activeFilter = 'unread'"
          class="px-3 py-1.5 md:py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-500 flex items-center gap-1.5 shrink-0"
          :class="
            activeFilter === 'unread'
              ? theme.tabActive
              : 'border-transparent bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-800/80'
          "
        >
          <span>{{ t.filterUnread }}</span>
          <span
            v-if="unreadChatsCount > 0"
            class="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white leading-none tabular-nums"
            :class="theme.bg"
          >
            {{ formatUnread(unreadChatsCount) }}
          </span>
        </button>

        <button
          v-if="showGroupsTab"
          type="button"
          :aria-pressed="activeFilter === 'groups'"
          @click="activeFilter = 'groups'"
          class="px-3 py-1.5 md:py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-500 flex items-center gap-1.5 shrink-0"
          :class="
            activeFilter === 'groups'
              ? theme.tabActive
              : 'border-transparent bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-800/80'
          "
        >
          <span>{{ t.filterGroups }}</span>
          <span v-if="groupsCount > 0" class="text-[10px] opacity-75 tabular-nums">
            {{ groupsCount }}
          </span>
        </button>
      </div>

      <span class="sr-only" aria-live="polite" aria-atomic="true">
        {{ liveSearchAnnouncement }}
      </span>
    </div>

    <!-- CONTAINER LISTĂ CONVERSAȚII -->
    <div
      class="flex-1 min-h-0 flex flex-col overflow-hidden"
      :class="isSidebar ? '' : 'bg-slate-900/50 rounded-2xl border border-white/5'"
    >
      <!-- 1. Loading Skeleton -->
      <div
        v-if="isLoading"
        class="p-2.5 space-y-1.5 overflow-hidden"
        aria-busy="true"
        :aria-label="t.loading"
      >
        <div
          v-for="n in 6"
          :key="n"
          class="flex items-center gap-3 p-3 rounded-xl motion-safe:animate-pulse"
        >
          <div
            class="rounded-full bg-slate-800 shrink-0"
            :class="isSidebar ? 'w-11 h-11' : 'w-12 h-12'"
          />
          <div class="flex-1 min-w-0 space-y-2">
            <div class="flex justify-between gap-4">
              <div class="h-3.5 bg-slate-800 rounded w-1/3" />
              <div class="h-2.5 bg-slate-800/80 rounded w-12" />
            </div>
            <div class="h-3 bg-slate-800/70 rounded w-3/4" />
          </div>
        </div>
      </div>

      <!-- 2. Error State -->
      <div
        v-else-if="error"
        role="alert"
        class="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3"
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
          @click="emit('retry')"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <RotateCcw :size="14" aria-hidden="true" />
          {{ t.retry }}
        </button>
      </div>

      <!-- 3. Empty State -->
      <div
        v-else-if="displayRows.length === 0"
        class="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3"
      >
        <div
          class="w-12 h-12 rounded-2xl bg-slate-800/80 border border-white/5 flex items-center justify-center text-slate-400"
        >
          <Search v-if="hasActiveFilters" :size="20" aria-hidden="true" />
          <MessageSquare v-else :size="20" aria-hidden="true" />
        </div>

        <div class="space-y-1 max-w-xs">
          <p class="text-sm font-semibold text-white">
            {{ hasActiveFilters ? t.emptyFilteredTitle : t.emptyTitle }}
          </p>
          <p class="text-xs text-slate-400">
            {{
              hasActiveFilters
                ? t.emptyFilteredDescription
                : t.emptyDescription(activeLens)
            }}
          </p>
        </div>

        <button
          v-if="hasActiveFilters"
          type="button"
          @click="resetFilters"
          class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
        >
          {{ t.clearFilters }}
        </button>
        <button
          v-else-if="showNewChatButton"
          type="button"
          @click="emit('new-chat')"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-white transition-opacity hover:opacity-95 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          :class="theme.bg"
        >
          <MessageSquarePlus :size="15" aria-hidden="true" />
          {{ t.startChat }}
        </button>
      </div>

      <!-- 4. Lista de conversații -->
      <div
        v-else
        ref="listScrollRef"
        role="list"
        @scroll.passive="closeContextMenu(false)"
        class="flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-0.5"
        :class="isSidebar ? 'p-1.5' : 'p-2'"
      >
        <div
          v-for="(row, index) in displayRows"
          :key="row.key"
          :ref="(el) => setRowRef(row.key, el)"
          role="listitem"
          @contextmenu.prevent="openContextMenu(row.key, false)"
          class="relative group flex items-center rounded-xl transition-colors"
          :class="[
            row.isActive ? theme.activeRow : theme.hover,
            highlightedIndex === index && !row.isActive ? 'bg-slate-800/80 ring-1 ring-white/20' : '',
            openMenuKey === row.key ? 'z-30' : '',
          ]"
        >
          <!-- Bară laterală subtilă pentru chat-ul activ în sidebar -->
          <span
            v-if="isSidebar && row.isActive"
            class="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full"
            :class="theme.bg"
            aria-hidden="true"
          />

          <!-- Rândul clickabil (fără butoane imbricate) -->
          <button
            :ref="(el) => setRowButtonRef(row.key, el)"
            type="button"
            @click="handleSelectChat(row.chat)"
            :aria-current="row.isActive ? 'true' : undefined"
            class="flex-1 min-w-0 text-left flex items-center gap-3 rounded-xl cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            :class="isSidebar ? 'p-2.5' : 'p-3 gap-4'"
          >
            <!-- Avatar cu fallback determinist + prezență / badge grup -->
            <span
              class="relative block shrink-0"
              :class="isSidebar ? 'w-11 h-11' : 'w-12 h-12'"
            >
              <span
                class="w-full h-full rounded-full overflow-hidden border flex items-center justify-center font-semibold text-xs"
                :class="
                  row.hasValidAvatar
                    ? 'bg-slate-800 border-slate-700/60'
                    : `${row.avatarTone.surface} ${row.avatarTone.border}`
                "
              >
                <img
                  v-if="row.hasValidAvatar"
                  :key="row.avatarUrl ?? ''"
                  :src="row.avatarUrl ?? ''"
                  referrerpolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                  @error="markAvatarFailed(row.chat.id, row.avatarUrl)"
                  alt=""
                  class="w-full h-full object-cover"
                />
                <span v-else aria-hidden="true">{{ row.initials }}</span>
              </span>

              <!-- Badge grup -->
              <span
                v-if="row.chat.isGroup"
                class="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-slate-300"
                aria-hidden="true"
              >
                <Users :size="9" />
              </span>

              <!-- Bulină prezență 1-la-1 -->
              <span
                v-else-if="row.presenceDotClass"
                class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900"
                :class="row.presenceDotClass"
                aria-hidden="true"
              />
            </span>

            <!-- Informații conversație -->
            <span class="flex-1 min-w-0 flex flex-col gap-0.5">
              <span class="flex items-center justify-between gap-2">
                <span class="flex items-center gap-1.5 min-w-0">
                  <span
                    class="text-sm font-semibold truncate"
                    :class="row.unreadCount > 0 && !row.chat.isMuted ? theme.text : 'text-white'"
                  >
                    <template v-for="(part, i) in row.nameParts" :key="i">
                      <mark v-if="part.match" class="rounded px-0.5" :class="theme.mark">{{
                        part.text
                      }}</mark>
                      <template v-else>{{ part.text }}</template>
                    </template>
                  </span>

                  <BellOff
                    v-if="row.chat.isMuted"
                    :size="12"
                    class="text-slate-500 shrink-0"
                    aria-hidden="true"
                  />
                </span>

                <!-- Timestamp: ascuns pe desktop DOAR la hover sau focus pe bara de acțiuni -->
                <span
                  class="text-[11px] font-medium shrink-0 tabular-nums transition-opacity [@media(hover:hover)]:group-hover:opacity-0"
                  :class="[
                    row.unreadCount > 0 && !row.chat.isMuted ? theme.text : 'text-slate-500',
                    focusedActionsKey === row.key ? '[@media(hover:hover)]:opacity-0' : '',
                  ]"
                >
                  {{ row.timestampLabel }}
                </span>
              </span>

              <span class="flex items-center justify-between gap-2">
                <!-- Previzualizare: Typing > Draft > Ultimul mesaj -->
                <span class="flex items-center gap-1.5 min-w-0 flex-1">
                  <template v-if="row.chat.isTyping">
                    <span
                      class="text-xs font-medium truncate flex items-center gap-1"
                      :class="theme.text"
                    >
                      <span class="truncate">{{ row.chat.typingText || t.typingFallback }}</span>
                      <span class="inline-flex items-center gap-0.5 shrink-0" aria-hidden="true">
                        <span class="w-1 h-1 rounded-full bg-current motion-safe:animate-bounce [animation-delay:-0.3s]" />
                        <span class="w-1 h-1 rounded-full bg-current motion-safe:animate-bounce [animation-delay:-0.15s]" />
                        <span class="w-1 h-1 rounded-full bg-current motion-safe:animate-bounce" />
                      </span>
                    </span>
                  </template>

                  <template v-else-if="row.draft">
                    <span class="text-xs truncate text-slate-300">
                      <span class="text-rose-400 font-semibold mr-1">{{ t.draftPrefix }}</span>
                      <template v-for="(part, i) in row.draftParts" :key="i">
                        <mark v-if="part.match" class="rounded px-0.5" :class="theme.mark">{{
                          part.text
                        }}</mark>
                        <template v-else>{{ part.text }}</template>
                      </template>
                    </span>
                  </template>

                  <template v-else>
                    <!-- Status livrare pentru mesajele tale -->
                    <Clock
                      v-if="row.chat.isLastMessageMine && row.chat.deliveryStatus === 'sending'"
                      :size="13"
                      class="text-slate-500 shrink-0"
                      aria-hidden="true"
                    />
                    <AlertCircle
                      v-else-if="row.chat.isLastMessageMine && row.chat.deliveryStatus === 'failed'"
                      :size="13"
                      class="text-rose-400 shrink-0"
                      aria-hidden="true"
                    />
                    <Check
                      v-else-if="row.chat.isLastMessageMine && row.chat.deliveryStatus === 'sent'"
                      :size="14"
                      class="text-slate-500 shrink-0"
                      aria-hidden="true"
                    />
                    <CheckCheck
                      v-else-if="
                        row.chat.isLastMessageMine &&
                        (row.chat.deliveryStatus === 'delivered' || row.chat.deliveryStatus === 'read')
                      "
                      :size="14"
                      class="shrink-0"
                      :class="row.chat.deliveryStatus === 'read' ? theme.text : 'text-slate-500'"
                      aria-hidden="true"
                    />

                    <!-- Iconiță discretă pentru mesaje media / apeluri -->
                    <ImageIcon
                      v-if="row.previewKind === 'image'"
                      :size="13"
                      class="text-slate-400 shrink-0"
                      aria-hidden="true"
                    />
                    <Mic
                      v-else-if="row.previewKind === 'audio'"
                      :size="13"
                      class="text-slate-400 shrink-0"
                      aria-hidden="true"
                    />
                    <Video
                      v-else-if="row.previewKind === 'video'"
                      :size="13"
                      class="text-slate-400 shrink-0"
                      aria-hidden="true"
                    />
                    <FileText
                      v-else-if="row.previewKind === 'file'"
                      :size="13"
                      class="text-slate-400 shrink-0"
                      aria-hidden="true"
                    />
                    <PhoneMissed
                      v-else-if="row.previewKind === 'missed-call'"
                      :size="13"
                      class="text-rose-400 shrink-0"
                      aria-hidden="true"
                    />
                    <Phone
                      v-else-if="row.previewKind === 'call'"
                      :size="13"
                      class="text-slate-400 shrink-0"
                      aria-hidden="true"
                    />

                    <span
                      class="text-xs truncate"
                      :class="[
                        row.previewKind === 'missed-call'
                          ? 'text-rose-300'
                          : row.unreadCount > 0
                            ? 'text-slate-100 font-medium'
                            : 'text-slate-400',
                      ]"
                    >
                      <template v-for="(part, i) in row.previewParts" :key="i">
                        <mark v-if="part.match" class="rounded px-0.5" :class="theme.mark">{{
                          part.text
                        }}</mark>
                        <template v-else>{{ part.text }}</template>
                      </template>
                    </span>
                  </template>
                </span>

                <!-- Indicatori dreapta: Pin + Badge necitite -->
                <span
                  class="flex items-center gap-1.5 shrink-0 transition-opacity [@media(hover:hover)]:group-hover:opacity-0"
                  :class="focusedActionsKey === row.key ? '[@media(hover:hover)]:opacity-0' : ''"
                >
                  <Pin
                    v-if="row.chat.isPinned"
                    :size="12"
                    class="text-slate-500 -rotate-45 shrink-0"
                    aria-hidden="true"
                  />
                  <span
                    v-if="row.unreadCount > 0"
                    class="min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center leading-none tabular-nums"
                    :class="row.chat.isMuted ? 'bg-slate-700 text-slate-200' : `${theme.bg} text-white`"
                    :aria-label="t.unreadBadgeAriaLabel(row.unreadCount)"
                  >
                    {{ formatUnread(row.unreadCount) }}
                  </span>
                </span>
              </span>
            </span>

            <!-- Săgeată vizibilă doar în modul pagină completă -->
            <span
              v-if="!isSidebar"
              class="text-slate-600 group-hover:text-white transition-all px-1 shrink-0 [@media(hover:hover)]:group-hover:opacity-0"
              :class="focusedActionsKey === row.key ? '[@media(hover:hover)]:opacity-0' : ''"
              aria-hidden="true"
            >
              <ChevronRight :size="18" />
            </span>
          </button>

          <!-- Buton meniu acțiuni pe dispozitive touch (44x44px, nu se suprapune cu badge-ul) -->
          <button
            :ref="(el) => setMenuTriggerRef(row.key, el)"
            type="button"
            @click.stop="openContextMenu(row.key, true)"
            aria-haspopup="menu"
            :aria-expanded="openMenuKey === row.key"
            :aria-label="t.moreActionsFor(row.chat.name)"
            class="hidden [@media(hover:none)]:flex shrink-0 min-w-[44px] min-h-[44px] items-center justify-center rounded-xl text-slate-400 active:bg-slate-800 active:text-white transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <MoreVertical :size="16" aria-hidden="true" />
          </button>

          <!-- Acțiuni rapide pe desktop (tooltip jos pe primul rând ca să nu se taie de overflow-y-auto) -->
          <div
            @focusin="onActionsFocusIn(row.key)"
            @focusout="onActionsFocusOut(row.key, $event)"
            class="hidden [@media(hover:hover)]:flex items-center gap-0.5 absolute right-2 top-1/2 -translate-y-1/2 px-1 py-1 rounded-xl bg-slate-900/95 border border-white/10 shadow-lg transition-opacity"
            :class="
              focusedActionsKey === row.key
                ? 'opacity-100 pointer-events-auto'
                : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
            "
          >
            <AppTooltip
              :text="row.chat.isPinned ? t.unpinChat : t.pinChat"
              :placement="index === 0 ? 'bottom' : 'top'"
              align="right"
            >
              <button
                type="button"
                @click.stop="triggerPin(row.chat)"
                class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                :class="row.chat.isPinned ? theme.text : ''"
                :aria-label="`${row.chat.isPinned ? t.unpinChat : t.pinChat} — ${row.chat.name}`"
              >
                <Pin :size="14" :class="row.chat.isPinned ? 'fill-current' : ''" aria-hidden="true" />
              </button>
            </AppTooltip>

            <AppTooltip
              :text="row.chat.isMuted ? t.unmuteChat : t.muteChat"
              :placement="index === 0 ? 'bottom' : 'top'"
              align="right"
            >
              <button
                type="button"
                @click.stop="triggerMute(row.chat)"
                class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                :aria-label="`${row.chat.isMuted ? t.unmuteChat : t.muteChat} — ${row.chat.name}`"
              >
                <Bell v-if="row.chat.isMuted" :size="14" aria-hidden="true" />
                <BellOff v-else :size="14" aria-hidden="true" />
              </button>
            </AppTooltip>

            <AppTooltip
              :text="row.unreadCount > 0 ? t.markAsRead : t.markAsUnread"
              :placement="index === 0 ? 'bottom' : 'top'"
              align="right"
            >
              <button
                type="button"
                @click.stop="triggerRead(row.chat)"
                class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                :aria-label="`${row.unreadCount > 0 ? t.markAsRead : t.markAsUnread} — ${row.chat.name}`"
              >
                <MailOpen v-if="row.unreadCount > 0" :size="14" aria-hidden="true" />
                <Mail v-else :size="14" aria-hidden="true" />
              </button>
            </AppTooltip>
          </div>

          <!-- Meniu contextual accesibil (mobil tap pe MoreVertical + desktop right-click) -->
          <div
            v-if="openMenuKey === row.key"
            :ref="(el) => setContextMenuRef(row.key, el)"
            role="menu"
            :aria-label="t.moreActionsFor(row.chat.name)"
            @keydown="onContextMenuKeyDown"
            class="absolute right-2 z-50 min-w-[180px] rounded-xl bg-slate-900/95 backdrop-blur-md border border-white/10 shadow-2xl p-1"
            :class="openMenuPlacement === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'"
          >
            <button
              type="button"
              role="menuitem"
              @click.stop="triggerPin(row.chat)"
              class="w-full px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 focus-visible:bg-slate-800 flex items-center gap-2.5 text-left cursor-pointer outline-none"
            >
              <Pin
                :size="14"
                :class="row.chat.isPinned ? `${theme.text} fill-current` : 'text-slate-400'"
                aria-hidden="true"
              />
              <span>{{ row.chat.isPinned ? t.unpinChat : t.pinChat }}</span>
            </button>

            <button
              type="button"
              role="menuitem"
              @click.stop="triggerMute(row.chat)"
              class="w-full px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 focus-visible:bg-slate-800 flex items-center gap-2.5 text-left cursor-pointer outline-none"
            >
              <Bell v-if="row.chat.isMuted" :size="14" class="text-slate-400" aria-hidden="true" />
              <BellOff v-else :size="14" class="text-slate-400" aria-hidden="true" />
              <span>{{ row.chat.isMuted ? t.unmuteChat : t.muteChat }}</span>
            </button>

            <button
              type="button"
              role="menuitem"
              @click.stop="triggerRead(row.chat)"
              class="w-full px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 focus-visible:bg-slate-800 flex items-center gap-2.5 text-left cursor-pointer outline-none"
            >
              <MailOpen v-if="row.unreadCount > 0" :size="14" class="text-slate-400" aria-hidden="true" />
              <Mail v-else :size="14" class="text-slate-400" aria-hidden="true" />
              <span>{{ row.unreadCount > 0 ? t.markAsRead : t.markAsUnread }}</span>
            </button>
          </div>
        </div>

        <!-- Sentinel Infinite Scroll + buton accesibil fallback -->
        <div
          v-if="hasMore || isLoadingMore"
          ref="loadMoreSentinelRef"
          class="py-3 flex items-center justify-center"
        >
          <span
            v-if="isLoadingMore"
            class="inline-flex items-center gap-2 text-xs text-slate-400"
            aria-live="polite"
          >
            <Loader2 :size="14" class="motion-safe:animate-spin" aria-hidden="true" />
            {{ t.loadingMore }}
          </span>
          <button
            v-else
            type="button"
            @click="triggerLoadMore"
            class="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            {{ t.loadMore }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>