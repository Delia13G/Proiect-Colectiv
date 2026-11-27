<!-- src/components/chat/MessageBubble.vue -->
<script lang="ts">
import type { ConnectionStatus } from './ChatHeader.vue';
import type { MediaLightboxItem } from './MediaLightbox.vue';
import type { ChatEntityId, ChatMessage, ChatTheme,ChatAttachmentKind } from '../../types/chat';

// Singleton-uri la nivel de modul (partajate între toate bulele din listă)
// -> un singur meniu deschis și un singur mesaj vocal activ la un moment dat
let closeActiveMenu: (() => void) | null = null;
let activeAudioEl: HTMLAudioElement | null = null;

export interface MessageImagePreviewPayload {
  url: string;
  index: number;
  items: MediaLightboxItem[];
  caption?: string;
  messageId: ChatEntityId;
}

export interface MessageBubbleLabels {
  deletedMessage: string;
  deletedReply: string;
  you: string;
  memberFallback: string;
  photoLabel: string;
  photosCountLabel: (count: number) => string;
  voiceMessageLabel: string;
  fileAttachmentLabel: string;
  filesCountLabel: (count: number) => string;
  mediaAttachmentLabel: string;
  jumpToReplyAriaLabel: (author: string) => string;
  codeFallbackLang: string;
  copyCode: string;
  codeCopied: string;
  copy: string;
  copied: string;
  playVoice: string;
  pauseVoice: string;
  retryVoice: string;
  audioSliderAriaLabel: string;
  audioProgressText: (current: string, total: string) => string;
  audioUnavailable: string;
  playbackSpeedAriaLabel: (rate: number) => string;
  openImageAriaLabel: (index: number, total: number) => string;
  imageUnavailable: string;
  downloadFileAriaLabel: (fileName: string) => string;
  download: string;
  messageActionsAriaLabel: string;
  messageOptionsAriaLabel: string;
  reactWithAriaLabel: (emoji: string, isActive: boolean) => string;
  reactionPillAriaLabel: (emoji: string, count: number, isActive: boolean) => string;
  reply: string;
  copyText: string;
  edit: string;
  delete: string;
  retry: string;
  editedPrefix: string;
  statusSending: string;
  statusSent: string;
  statusDelivered: string;
  statusRead: string;
  statusFailedRetry: string;
  statusFailedAriaLabel: string;
  textCopiedAnnouncement: string;
}

export interface MessageBubbleProps {
  message: ChatMessage;
  theme: ChatTheme;
  replyMessage?: ChatMessage | null;
  partnerName?: string;
  isGroup?: boolean;
  /** True când mesajul anterior e de la același expeditor (ascunde avatarul/numele repetat). */
  isGrouped?: boolean;
  /** False când mesajul următor e de la același expeditor (conectează colțurile și ascunde ora intermediară). */
  isLastInGroup?: boolean;
  /** Evidențiere temporară la jump-to-reply / jump-to-message */
  isHighlighted?: boolean;
  /** Termen căutat în conversație (evidențiat fără diacritice și fără v-html) */
  highlightQuery?: string;
  /** Permite click pe @username pentru a deschide profilul colegului */
  interactiveMentions?: boolean;
  connectionStatus?: ConnectionStatus;
  currentUserId?: ChatEntityId;
  currentUsername?: string;
  locale?: string;
  labels?: Partial<MessageBubbleLabels>;
}
</script>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  onUnmounted,
  defineComponent,
  h,
  Fragment,
  type PropType,
  type VNode,
} from 'vue';
import {
  Play,
  Pause,
  Reply,
  Trash2,
  Edit2,
  ChevronDown,
  Ban,
  Copy,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  RotateCcw,
  FileText,
  Download,
  ImageOff,
} from 'lucide-vue-next';
import AppTooltip from '../ui/AppTooltip.vue';
import { getAvatarInitials, getAvatarTone } from '../../utils/avatar';


const DEFAULT_LABELS: MessageBubbleLabels = {
  deletedMessage: 'This message was deleted',
  deletedReply: 'Deleted message',
  you: 'You',
  memberFallback: 'Member',
  photoLabel: 'Photo',
  photosCountLabel: (count) => `${count} photos`,
  voiceMessageLabel: 'Voice message',
  fileAttachmentLabel: 'File attachment',
  filesCountLabel: (count) => `${count} files`,
  mediaAttachmentLabel: 'Media attachment',
  jumpToReplyAriaLabel: (author) => `Jump to replied message from ${author}`,
  codeFallbackLang: 'code',
  copyCode: 'Copy code',
  codeCopied: 'Code copied',
  copy: 'Copy',
  copied: 'Copied',
  playVoice: 'Play voice message',
  pauseVoice: 'Pause voice message',
  retryVoice: 'Retry voice message',
  audioSliderAriaLabel: 'Audio playback position',
  audioProgressText: (current, total) => `${current} of ${total}`,
  audioUnavailable: 'Unavailable · Tap to retry',
  playbackSpeedAriaLabel: (rate) => `Playback speed ${rate}x`,
  openImageAriaLabel: (index, total) =>
    total > 1 ? `Open image ${index} of ${total}` : 'Open full image preview',
  imageUnavailable: 'Image unavailable',
  downloadFileAriaLabel: (fileName) => `Download ${fileName}`,
  download: 'Download',
  messageActionsAriaLabel: 'Message actions',
  messageOptionsAriaLabel: 'Message options',
  reactWithAriaLabel: (emoji, isActive) =>
    isActive ? `Remove ${emoji} reaction` : `React with ${emoji}`,
  reactionPillAriaLabel: (emoji, count, isActive) =>
    isActive
      ? `Remove ${emoji} reaction (${count})`
      : `Add ${emoji} reaction (${count})`,
  reply: 'Reply',
  copyText: 'Copy text',
  edit: 'Edit',
  delete: 'Delete',
  retry: 'Retry sending',
  editedPrefix: 'Edited · ',
  statusSending: 'Sending',
  statusSent: 'Sent',
  statusDelivered: 'Delivered',
  statusRead: 'Read',
  statusFailedRetry: 'Failed · Retry',
  statusFailedAriaLabel: 'Failed to send. Click to retry',
  textCopiedAnnouncement: 'Message copied to clipboard',
};

const props = withDefaults(defineProps<MessageBubbleProps>(), {
  replyMessage: null,
  partnerName: '',
  isGroup: false,
  isGrouped: false,
  isLastInGroup: true,
  isHighlighted: false,
  highlightQuery: '',
  interactiveMentions: false,
  connectionStatus: 'connected',
  currentUserId: 'me',
  currentUsername: '',
  locale: undefined,
  labels: () => ({}),
});

const emit = defineEmits<{
  react: [payload: { messageId: ChatEntityId; emoji: string }];
  reply: [message: ChatMessage];
  edit: [message: ChatMessage];
  delete: [message: ChatMessage];
  retry: [message: ChatMessage];
  'jump-to-reply': [messageId: ChatEntityId];
  'preview-image': [payload: MessageImagePreviewPayload];
  'mention-click': [username: string];
}>();

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢'] as const;
const PLAYBACK_RATES = [1, 1.5, 2] as const;

const t = computed<MessageBubbleLabels>(() => ({
  ...DEFAULT_LABELS,
  ...props.labels,
}));

const isPendingOrFailed = computed(
  () => props.message.status === 'sending' || props.message.status === 'failed'
);

let isUnmounted = false;

// ==========================================
// 1. HELPERE SECURITATE URL & HIGHLIGHT UNICODE
// ==========================================
const sanitizeSafeUrl = (
  raw: string | null | undefined,
  options: { allowBlob?: boolean; allowRelative?: boolean } = {}
): string | null => {
  const trimmed = raw?.trim();
  if (!trimmed || /[\u0000-\u001F\u007F]/.test(trimmed)) return null;

  if (options.allowRelative && trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol === 'https:' || protocol === 'http:') return parsed.href;
    if (options.allowBlob && protocol === 'blob:') return trimmed;
    return null;
  } catch {
    return null;
  }
};

const foldText = (input: string): string =>
  input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

interface HighlightPart {
  text: string;
  match: boolean;
}

const splitHighlightedParts = (text: string, foldedQuery: string): HighlightPart[] => {
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

  const parts: HighlightPart[] = [];
  let cursor = 0;
  let searchFrom = 0;

  while (searchFrom < folded.length) {
    const idx = folded.indexOf(foldedQuery, searchFrom);
    if (idx === -1) break;

    const firstMap = charMap[idx];
    const lastMap = charMap[idx + foldedQuery.length - 1];
    if (!firstMap || !lastMap) break;

    if (firstMap.start > cursor) {
      parts.push({ text: text.slice(cursor, firstMap.start), match: false });
    }
    parts.push({ text: text.slice(firstMap.start, lastMap.end), match: true });
    cursor = lastMap.end;
    searchFrom = idx + foldedQuery.length;
  }

  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), match: false });
  }

  return parts.length > 0 ? parts : [{ text, match: false }];
};

const foldedHighlightQuery = computed(() => foldText(props.highlightQuery.trim()));
const highlightMarkClass = computed(
  () => props.theme.mark ?? 'bg-amber-400/35 text-amber-100 rounded px-0.5'
);

// ==========================================
// 2. MENIU DROPDOWN (Container-aware flip, Keyboard A11y, Scroll close)
// ==========================================
const isMenuOpen = ref(false);
const openMenuUpward = ref(false);
const alignMenuRight = ref(false);
const menuRef = ref<HTMLElement | null>(null);
const menuDropdownRef = ref<HTMLElement | null>(null);
const menuTriggerRef = ref<HTMLButtonElement | null>(null);
let scrollAncestor: HTMLElement | null = null;

const findScrollContainer = (el: HTMLElement | null): HTMLElement | null => {
  if (typeof window === 'undefined') return null;
  let current = el?.parentElement ?? null;
  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    if (/(auto|scroll|overlay)/.test(style.overflowY)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
};

const detachMenuListeners = () => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('pointerdown', handleOutsidePointerDown);
    document.removeEventListener('keydown', handleMenuKeyDown);
  }
  if (scrollAncestor) {
    scrollAncestor.removeEventListener('scroll', handleContainerScroll);
    scrollAncestor = null;
  }
};

const closeMenu = (restoreFocus = false) => {
  if (!isMenuOpen.value) return;
  isMenuOpen.value = false;
  if (closeActiveMenu === closeMenu) {
    closeActiveMenu = null;
  }
  if (restoreFocus) {
    nextTick(() => menuTriggerRef.value?.focus());
  }
};

const handleContainerScroll = () => {
  closeMenu(false);
};

const handleOutsidePointerDown = (e: PointerEvent) => {
  const target = e.target as Node | null;
  if (target && menuRef.value?.contains(target)) return;
  closeMenu(false);
};

const handleMenuKeyDown = (e: KeyboardEvent) => {
  if (e.defaultPrevented || !isMenuOpen.value) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    closeMenu(true);
    return;
  }

  if (e.key === 'Tab') {
    closeMenu(false);
    return;
  }

  const items = Array.from(
    menuDropdownRef.value?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []
  );
  if (items.length === 0) return;

  const currentIdx = items.indexOf(document.activeElement as HTMLButtonElement);

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    items[(currentIdx + 1) % items.length]?.focus();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    items[(currentIdx - 1 + items.length) % items.length]?.focus();
  } else if (e.key === 'Home') {
    e.preventDefault();
    items[0]?.focus();
  } else if (e.key === 'End') {
    e.preventDefault();
    items[items.length - 1]?.focus();
  }
};

watch(isMenuOpen, (open) => {
  if (open) {
    document.addEventListener('pointerdown', handleOutsidePointerDown);
    document.addEventListener('keydown', handleMenuKeyDown);
    scrollAncestor = findScrollContainer(menuTriggerRef.value);
    scrollAncestor?.addEventListener('scroll', handleContainerScroll, { passive: true });
    nextTick(() => {
      menuDropdownRef.value?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    });
  } else {
    detachMenuListeners();
  }
});

watch(
  () => props.message.isDeleted,
  (deleted) => {
    if (!deleted) return;
    closeMenu(false);
    if (audioRef.value) {
      audioRef.value.pause();
      if (activeAudioEl === audioRef.value) {
        activeAudioEl = null;
      }
    }
  }
);

const toggleMenu = () => {
  if (isMenuOpen.value) {
    closeMenu(false);
    return;
  }

  if (closeActiveMenu && closeActiveMenu !== closeMenu) {
    closeActiveMenu();
  }

  // Calculează limitele față de containerul scrollabil (corect în split-view) intersectat cu viewport-ul
  const triggerRect = menuTriggerRef.value?.getBoundingClientRect();
  if (triggerRect && typeof window !== 'undefined') {
    const container = findScrollContainer(menuTriggerRef.value);
    const bounds = container?.getBoundingClientRect();

    const boundTop = bounds ? Math.max(0, bounds.top) : 0;
    const boundBottom = bounds ? Math.min(window.innerHeight, bounds.bottom) : window.innerHeight;
    const boundLeft = bounds ? Math.max(0, bounds.left) : 0;
    const boundRight = bounds ? Math.min(window.innerWidth, bounds.right) : window.innerWidth;

    const MENU_HEIGHT = isPendingOrFailed.value ? 120 : 236;
    const MENU_WIDTH = 192;

    const spaceBelow = boundBottom - triggerRect.bottom;
    const spaceAbove = triggerRect.top - boundTop;
    const spaceRight = boundRight - triggerRect.left;
    const spaceLeft = triggerRect.right - boundLeft;

    openMenuUpward.value = spaceBelow < MENU_HEIGHT && spaceAbove > spaceBelow;

    if (props.message.isMine) {
      alignMenuRight.value = !(spaceLeft < MENU_WIDTH && spaceRight > spaceLeft);
    } else {
      alignMenuRight.value = spaceRight < MENU_WIDTH && spaceLeft > spaceRight;
    }
  } else {
    openMenuUpward.value = false;
    alignMenuRight.value = props.message.isMine;
  }

  isMenuOpen.value = true;
  closeActiveMenu = closeMenu;
};

// ==========================================
// 3. ATAȘAMENTE NORMALIZATE (Single + Albume Foto + Fișiere Multiple)
// ==========================================
interface NormalizedAttachment {
  key: string;
  id: ChatEntityId;
  url: string;
  kind: ChatAttachmentKind;
  fileName: string;
  extension: string;
  sizeLabel: string;
}

const extractFileNameFromUrl = (url: string, explicitName?: string): string => {
  if (explicitName?.trim()) return explicitName.trim();
  const cleanPath = url.split(/[?#]/)[0] ?? '';
  const segment = cleanPath.split('/').pop() ?? '';
  if (!segment) return 'Attachment';
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
};

const extractFileExtension = (fileName: string): string => {
  if (!fileName.includes('.')) return 'FILE';
  return (fileName.split('.').pop() ?? 'FILE').slice(0, 6).toUpperCase();
};

const formatFileSize = (size?: number | string): string => {
  if (size === undefined || size === null || size === '') return '';
  if (typeof size === 'string') return size.trim();
  if (!Number.isFinite(size) || size < 0) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const normalizedAttachments = computed<NormalizedAttachment[]>(() => {
  const result: NormalizedAttachment[] = [];
  const multi = props.message.attachments;

  if (Array.isArray(multi) && multi.length > 0) {
    multi.forEach((item, idx) => {
      const safeUrl = sanitizeSafeUrl(item.url, { allowBlob: true, allowRelative: true });
      if (!safeUrl) return;
      const fileName = extractFileNameFromUrl(safeUrl, item.fileName);
      result.push({
        key: `${String(item.id ?? idx)}:${safeUrl}`,
        id: item.id ?? `${props.message.id}-${idx}`,
        url: safeUrl,
        kind: item.kind,
        fileName,
        extension: extractFileExtension(fileName),
        sizeLabel: formatFileSize(item.fileSize),
      });
    });
    return result;
  }

  if (props.message.type === 'image' || props.message.type === 'file') {
    const safeUrl = sanitizeSafeUrl(props.message.attachment, {
      allowBlob: true,
      allowRelative: true,
    });
    if (safeUrl) {
      const fileName = extractFileNameFromUrl(safeUrl, props.message.fileName);
      result.push({
        key: `single:${safeUrl}`,
        id: props.message.id,
        url: safeUrl,
        kind: props.message.type,
        fileName,
        extension: extractFileExtension(fileName),
        sizeLabel: formatFileSize(props.message.fileSize),
      });
    }
  }

  return result;
});

const imageAttachments = computed(() =>
  normalizedAttachments.value.filter((item) => item.kind === 'image')
);
const fileAttachments = computed(() =>
  normalizedAttachments.value.filter((item) => item.kind === 'file')
);

const visibleAlbumImages = computed(() => imageAttachments.value.slice(0, 4));
const overflowImageCount = computed(() => Math.max(0, imageAttachments.value.length - 4));

const hasAttachmentContent = computed(
  () =>
    props.message.type === 'image' ||
    props.message.type === 'file' ||
    props.message.type === 'attachments'
);

// Stare per imagine (loading / loaded / error) + sincronizare cache (Map ref, fără string ref în v-for)
type ImageState = 'loading' | 'loaded' | 'error';
const imageStates = ref<Record<string, ImageState>>({});
const imageElRefs = new Map<string, HTMLImageElement>();

const setImageElRef = (key: string, el: unknown) => {
  if (el instanceof HTMLImageElement) imageElRefs.set(key, el);
  else imageElRefs.delete(key);
};

const getImageState = (key: string): ImageState => imageStates.value[key] ?? 'loading';

const setImageState = (key: string, state: ImageState) => {
  if (imageStates.value[key] === state) return;
  imageStates.value = { ...imageStates.value, [key]: state };
};

const syncCachedImages = async () => {
  await nextTick();
  if (isUnmounted) return;
  for (const [key, img] of imageElRefs.entries()) {
    if (!img.complete) continue;
    setImageState(key, img.naturalWidth > 0 ? 'loaded' : 'error');
  }
};

watch(
  () => imageAttachments.value.map((img) => img.key).join('|'),
  () => {
    const next: Record<string, ImageState> = {};
    for (const img of imageAttachments.value) {
      next[img.key] = imageStates.value[img.key] ?? 'loading';
    }
    imageStates.value = next;
    syncCachedImages();
  },
  { immediate: true }
);

const imageLightboxItems = computed<MediaLightboxItem[]>(() =>
  imageAttachments.value.map((img) => ({
    id: img.id,
    src: img.url,
    alt: props.message.text?.trim() || img.fileName,
    caption: props.message.text?.trim() || null,
    fileName: img.fileName,
    senderName: props.message.isMine ? t.value.you : senderDisplayName.value,
    timestamp: props.message.timestamp,
    messageId: props.message.id,
  }))
);

const handleImagePreview = (index: number) => {
  const target = imageAttachments.value[index];
  if (!target || getImageState(target.key) === 'error') return;
  emit('preview-image', {
    url: target.url,
    index,
    items: imageLightboxItems.value,
    caption: props.message.text?.trim() || undefined,
    messageId: props.message.id,
  });
};

// ==========================================
// 4. AUDIO PLAYER (Singleton, Scrubbing, Retry, Duration number | string)
// ==========================================
const safeAudioUrl = computed(() =>
  props.message.type === 'audio'
    ? sanitizeSafeUrl(props.message.attachment, { allowBlob: true, allowRelative: true })
    : null
);

const audioRef = ref<HTMLAudioElement | null>(null);
const isPlayingAudio = ref(false);
const audioCurrentTime = ref(0);
const audioNaturalDuration = ref(0);
const playbackRateIndex = ref(0);
const audioError = ref(false);
const isScrubbing = ref(false);
let activeScrubPointerId: number | null = null;

const parseDurationToSeconds = (raw?: number | string): number => {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw > 0 ? raw : 0;
  }
  if (typeof raw !== 'string') return 0;
  const trimmed = raw.trim();
  if (!trimmed) return 0;

  const parts = trimmed.split(':').map((p) => Number(p));
  if (parts.some((n) => !Number.isFinite(n) || n < 0)) return 0;
  if (parts.length === 2) return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
  if (parts.length === 3) return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
  return parts[0] ?? 0;
};

const formatSeconds = (secs: number): string => {
  const safe = Number.isFinite(secs) && secs > 0 ? Math.floor(secs) : 0;
  const mins = Math.floor(safe / 60);
  const rem = safe % 60;
  return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
};

const effectiveAudioDuration = computed(() => {
  if (Number.isFinite(audioNaturalDuration.value) && audioNaturalDuration.value > 0) {
    return audioNaturalDuration.value;
  }
  return parseDurationToSeconds(props.message.duration);
});

const audioProgress = computed(() => {
  if (effectiveAudioDuration.value <= 0) return 0;
  return Math.min(100, Math.max(0, (audioCurrentTime.value / effectiveAudioDuration.value) * 100));
});

const audioTimeLabel = computed(() => {
  if (isPlayingAudio.value || audioCurrentTime.value > 0) {
    return formatSeconds(audioCurrentTime.value);
  }
  if (typeof props.message.duration === 'string' && props.message.duration.trim()) {
    return props.message.duration.trim();
  }
  return formatSeconds(effectiveAudioDuration.value);
});

const audioValueText = computed(() =>
  t.value.audioProgressText(
    formatSeconds(audioCurrentTime.value),
    formatSeconds(effectiveAudioDuration.value)
  )
);

const currentPlaybackRate = computed(() => PLAYBACK_RATES[playbackRateIndex.value] ?? 1);

const normalizedWaveform = computed<number[]>(() => {
  const raw = props.message.waveform;
  if (!raw || raw.length === 0) return [];
  const slice = raw.slice(0, 36);
  let max = 1;
  for (let i = 0; i < slice.length; i++) {
    const val = slice[i] ?? 0;
    if (val > max) max = val;
  }
  return slice.map((val) => Math.max(22, Math.round((Math.max(0, val) / max) * 100)));
});

const toggleAudio = async () => {
  const audio = audioRef.value;
  if (!audio || !safeAudioUrl.value) return;

  if (isPlayingAudio.value) {
    audio.pause();
    return;
  }

  if (activeAudioEl && activeAudioEl !== audio) {
    activeAudioEl.pause();
  }

  // Permite retry după eroare temporară de rețea
  if (audioError.value) {
    audioError.value = false;
    audio.load();
  }

  audio.playbackRate = currentPlaybackRate.value;
  try {
    await audio.play();
    activeAudioEl = audio;
  } catch (err) {
    isPlayingAudio.value = false;
    // AbortError apare legitim când alt player sau pause() întrerupe play()
    if (err instanceof DOMException && err.name === 'AbortError') return;
    audioError.value = true;
  }
};

const cyclePlaybackRate = () => {
  playbackRateIndex.value = (playbackRateIndex.value + 1) % PLAYBACK_RATES.length;
  if (audioRef.value) {
    audioRef.value.playbackRate = currentPlaybackRate.value;
  }
};

const seekAudioByRatio = (ratio: number) => {
  const audio = audioRef.value;
  const duration = effectiveAudioDuration.value;
  if (!audio || duration <= 0) return;

  const clamped = Math.min(1, Math.max(0, ratio));
  const nextTime = clamped * duration;
  audio.currentTime = nextTime;
  audioCurrentTime.value = nextTime;
};

const seekFromPointerEvent = (event: PointerEvent) => {
  const container = event.currentTarget as HTMLElement | null;
  if (!container) return;
  const rect = container.getBoundingClientRect();
  if (rect.width <= 0) return;
  seekAudioByRatio((event.clientX - rect.left) / rect.width);
};

const onScrubPointerDown = (event: PointerEvent) => {
  if (event.button !== 0 || effectiveAudioDuration.value <= 0) return;
  const el = event.currentTarget as HTMLElement | null;
  isScrubbing.value = true;
  activeScrubPointerId = event.pointerId;
  el?.setPointerCapture?.(event.pointerId);
  seekFromPointerEvent(event);
};

const onScrubPointerMove = (event: PointerEvent) => {
  if (!isScrubbing.value || event.pointerId !== activeScrubPointerId) return;
  seekFromPointerEvent(event);
};

const onScrubPointerEnd = (event: PointerEvent) => {
  if (!isScrubbing.value || event.pointerId !== activeScrubPointerId) return;
  const el = event.currentTarget as HTMLElement | null;
  el?.releasePointerCapture?.(event.pointerId);
  isScrubbing.value = false;
  activeScrubPointerId = null;
};

const handleProgressKeyDown = (event: KeyboardEvent) => {
  const duration = effectiveAudioDuration.value;
  if (duration <= 0) return;

  if (event.key === 'ArrowRight') {
    event.preventDefault();
    seekAudioByRatio((audioCurrentTime.value + 5) / duration);
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    seekAudioByRatio((audioCurrentTime.value - 5) / duration);
  } else if (event.key === 'Home') {
    event.preventDefault();
    seekAudioByRatio(0);
  } else if (event.key === 'End') {
    event.preventDefault();
    seekAudioByRatio(1);
  }
};

const onAudioLoadedMetadata = () => {
  if (!audioRef.value) return;
  const dur = audioRef.value.duration;
  if (Number.isFinite(dur) && dur > 0) {
    audioNaturalDuration.value = dur;
  }
};

const onAudioTimeUpdate = () => {
  if (!audioRef.value || isScrubbing.value) return;
  audioCurrentTime.value = audioRef.value.currentTime;
  if (Number.isFinite(audioRef.value.duration) && audioRef.value.duration > 0) {
    audioNaturalDuration.value = audioRef.value.duration;
  }
};

const onAudioEnded = () => {
  isPlayingAudio.value = false;
  audioCurrentTime.value = 0;
  if (activeAudioEl === audioRef.value) {
    activeAudioEl = null;
  }
};

watch(safeAudioUrl, () => {
  if (audioRef.value) {
    audioRef.value.pause();
    if (activeAudioEl === audioRef.value) {
      activeAudioEl = null;
    }
  }
  audioError.value = false;
  audioNaturalDuration.value = 0;
  audioCurrentTime.value = 0;
  isPlayingAudio.value = false;
});

// ==========================================
// 5. PARSARE TEXT AVANSATĂ + RENDERER UNIC InlineRichText (XSS-safe)
// ==========================================
type InlineToken =
  | { type: 'text'; content: string }
  | { type: 'inline-code'; content: string }
  | { type: 'link'; content: string; url: string }
  | { type: 'mention'; content: string; username: string; isSelf: boolean };

type ContentBlock =
  | { type: 'code'; language: string; content: string }
  | { type: 'inline'; tokens: InlineToken[] };

const normalizedCurrentUsername = computed(() =>
  props.currentUsername.trim().replace(/^@/, '').toLowerCase()
);

const isCodeSegment = (segment?: string): boolean =>
  Boolean(segment && segment.startsWith('```') && segment.endsWith('```') && segment.length >= 6);

const parseInlineTokens = (text: string): InlineToken[] => {
  const tokens: InlineToken[] = [];
  const tokenRegex =
    /(`[^`\n]+`)|(https?:\/\/[^\s<>"'`]+)|((?:^|[\s(])@[a-zA-Z0-9_](?:[a-zA-Z0-9._-]{0,30}[a-zA-Z0-9_])?)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      tokens.push({ type: 'inline-code', content: match[1].slice(1, -1) });
    } else if (match[2]) {
      let url = match[2];
      let trailing = '';

      // Elimină punctuația și parantezele neechilibrate de la finalul URL-ului
      while (url.length > 0) {
        const lastChar = url[url.length - 1];
        if (!lastChar) break;
        if (/[.,;:!?"'`<>]/.test(lastChar)) {
          trailing = lastChar + trailing;
          url = url.slice(0, -1);
          continue;
        }
        if (lastChar === ')' || lastChar === ']' || lastChar === '}') {
          const openChar = lastChar === ')' ? '(' : lastChar === ']' ? '[' : '{';
          const opens = url.split(openChar).length - 1;
          const closes = url.split(lastChar).length - 1;
          if (closes > opens) {
            trailing = lastChar + trailing;
            url = url.slice(0, -1);
            continue;
          }
        }
        break;
      }

      const safeHref = sanitizeSafeUrl(url);
      if (safeHref) {
        tokens.push({ type: 'link', content: url, url: safeHref });
      } else if (url.length > 0) {
        tokens.push({ type: 'text', content: url });
      }
      if (trailing.length > 0) {
        tokens.push({ type: 'text', content: trailing });
      }
    } else if (match[3]) {
      const rawMention = match[3];
      const atIdx = rawMention.indexOf('@');
      if (atIdx > 0) {
        tokens.push({ type: 'text', content: rawMention.slice(0, atIdx) });
      }
      const mentionText = rawMention.slice(atIdx);
      const username = mentionText.slice(1);
      const isSelf =
        Boolean(normalizedCurrentUsername.value) &&
        username.toLowerCase() === normalizedCurrentUsername.value;
      tokens.push({ type: 'mention', content: mentionText, username, isSelf });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return tokens;
};

const parsedBlocks = computed<ContentBlock[]>(() => {
  const raw = props.message.text;
  if (!raw) return [];

  const segments = raw.split(/(```[\s\S]*?```)/g);
  const blocks: ContentBlock[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (!segment) continue;

    if (isCodeSegment(segment)) {
      const inner = segment.slice(3, -3);
      const langMatch = inner.match(/^([a-zA-Z0-9_+#.-]{1,20})\r?\n([\s\S]*)$/);
      if (langMatch && langMatch[1] !== undefined && langMatch[2] !== undefined) {
        blocks.push({
          type: 'code',
          language: langMatch[1].toLowerCase(),
          content: langMatch[2].replace(/\n$/, ''),
        });
      } else {
        blocks.push({
          type: 'code',
          language: '',
          content: inner.replace(/^\r?\n/, '').replace(/\n$/, ''),
        });
      }
    } else {
      let cleaned = segment;
      if (isCodeSegment(segments[i - 1])) {
        cleaned = cleaned.replace(/^\r?\n/, '');
      }
      if (isCodeSegment(segments[i + 1])) {
        cleaned = cleaned.replace(/\r?\n$/, '');
      }
      if (!cleaned) continue;

      blocks.push({
        type: 'inline',
        tokens: parseInlineTokens(cleaned),
      });
    }
  }

  return blocks;
});

const parsedCaptionTokens = computed<InlineToken[]>(() =>
  hasAttachmentContent.value && props.message.text?.trim()
    ? parseInlineTokens(props.message.text)
    : []
);

// Mini-componentă internă tipizată pentru a elimina triplicarea randării inline
const InlineRichText = defineComponent({
  name: 'InlineRichText',
  props: {
    tokens: { type: Array as PropType<InlineToken[]>, required: true },
    isMine: { type: Boolean, required: true },
    linkClass: { type: String, required: true },
    markClass: { type: String, required: true },
    foldedQuery: { type: String, default: '' },
    interactiveMentions: { type: Boolean, default: false },
  },
  emits: {
    'mention-click': (_username: string) => true,
  },
  setup(localProps, { emit: localEmit }) {
    const renderHighlightedText = (text: string): Array<string | VNode> => {
      const parts = splitHighlightedParts(text, localProps.foldedQuery);
      return parts.map((part, idx) =>
        part.match
          ? h('mark', { key: idx, class: localProps.markClass }, part.text)
          : part.text
      );
    };

    return () =>
      h(
        Fragment,
        null,
        localProps.tokens.map((token, idx) => {
          if (token.type === 'inline-code') {
            return h(
              'code',
              {
                key: idx,
                class: [
                  'px-1.5 py-0.5 rounded font-mono text-[11.5px]',
                  localProps.isMine ? 'bg-black/25 text-white' : 'bg-slate-950/70 text-slate-100',
                ],
              },
              renderHighlightedText(token.content)
            );
          }

          if (token.type === 'link') {
            return h(
              'a',
              {
                key: idx,
                href: token.url,
                target: '_blank',
                rel: 'noopener noreferrer',
                class: [
                  'underline underline-offset-2 hover:opacity-85 transition-opacity break-all',
                  localProps.linkClass,
                ],
              },
              renderHighlightedText(token.content)
            );
          }

          if (token.type === 'mention') {
            const mentionClass = [
              'rounded px-1 py-0.5 font-semibold',
              token.isSelf
                ? 'bg-amber-400/25 text-amber-200'
                : localProps.isMine
                  ? 'bg-white/20 text-white'
                  : 'bg-white/10 text-white',
            ];

            if (localProps.interactiveMentions) {
              return h(
                'button',
                {
                  key: idx,
                  type: 'button',
                  onClick: () => localEmit('mention-click', token.username),
                  class: [
                    ...mentionClass,
                    'cursor-pointer hover:underline outline-none focus-visible:ring-1 focus-visible:ring-white/70',
                  ],
                },
                renderHighlightedText(token.content)
              );
            }

            return h(
              'span',
              { key: idx, class: mentionClass },
              renderHighlightedText(token.content)
            );
          }

          return h(Fragment, { key: idx }, renderHighlightedText(token.content));
        })
      );
  },
});

// ==========================================
// 6. COPY CLIPBOARD CU FEEDBACK & ANUNȚ ARIA-LIVE
// ==========================================
const copiedCodeIndex = ref<number | null>(null);
const copiedMessage = ref(false);
const liveAnnouncement = ref('');
let copyCodeTimer: ReturnType<typeof setTimeout> | null = null;
let copyMsgTimer: ReturnType<typeof setTimeout> | null = null;

const writeClipboard = async (text: string): Promise<boolean> => {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else if (typeof document !== 'undefined') {
      const temp = document.createElement('textarea');
      temp.value = text;
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
    } else {
      return false;
    }

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(25);
    }
    return true;
  } catch {
    return false;
  }
};

const copyCodeBlock = async (content: string, index: number) => {
  const ok = await writeClipboard(content);
  if (!ok) return;
  copiedCodeIndex.value = index;
  liveAnnouncement.value = '';
  await nextTick();
  liveAnnouncement.value = t.value.codeCopied;

  if (copyCodeTimer) clearTimeout(copyCodeTimer);
  copyCodeTimer = setTimeout(() => {
    copiedCodeIndex.value = null;
    liveAnnouncement.value = '';
    copyCodeTimer = null;
  }, 2000);
};

const copyMessageText = async () => {
  const text = props.message.text?.trim();
  if (!text) return;
  const ok = await writeClipboard(props.message.text ?? '');
  closeMenu(false);
  if (!ok) return;

  copiedMessage.value = true;
  liveAnnouncement.value = '';
  await nextTick();
  liveAnnouncement.value = t.value.textCopiedAnnouncement;

  if (copyMsgTimer) clearTimeout(copyMsgTimer);
  copyMsgTimer = setTimeout(() => {
    copiedMessage.value = false;
    liveAnnouncement.value = '';
    copyMsgTimer = null;
  }, 1800);
};

// ==========================================
// 7. GRUP, REPLY, REACȚII, TIMP & CONEXIUNE
// ==========================================
const senderDisplayName = computed(
  () => props.message.senderName?.trim() || props.partnerName.trim() || t.value.memberFallback
);

const safeSenderAvatarUrl = computed(() =>
  sanitizeSafeUrl(props.message.senderAvatar, { allowBlob: true, allowRelative: true })
);

const senderAvatarFailed = ref(false);

watch(safeSenderAvatarUrl, () => {
  senderAvatarFailed.value = false;
});

watch(
  () => props.connectionStatus,
  (nextStatus, prevStatus) => {
    if (nextStatus === 'connected' && prevStatus && prevStatus !== 'connected') {
      senderAvatarFailed.value = false;
      audioError.value = false;

      // Reîncearcă imaginile care au eșuat offline
      const next: Record<string, ImageState> = { ...imageStates.value };
      let changed = false;
      for (const [key, state] of Object.entries(next)) {
        if (state === 'error') {
          next[key] = 'loading';
          changed = true;
        }
      }
      if (changed) {
        imageStates.value = next;
        syncCachedImages();
      }
    }
  }
);

const replyAuthorLabel = computed(() => {
  if (!props.replyMessage) return '';
  if (props.replyMessage.isMine) return t.value.you;
  return props.replyMessage.senderName?.trim() || props.partnerName.trim() || t.value.memberFallback;
});

const replyPreviewText = computed(() => {
  const reply = props.replyMessage;
  if (!reply) return '';
  if (reply.isDeleted) return t.value.deletedReply;
  if (reply.text?.trim()) return reply.text.trim();

  if (Array.isArray(reply.attachments) && reply.attachments.length > 0) {
    const imgCount = reply.attachments.filter((a) => a.kind === 'image').length;
    const fileCount = reply.attachments.length - imgCount;
    if (imgCount > 0 && fileCount === 0) {
      return imgCount === 1 ? t.value.photoLabel : t.value.photosCountLabel(imgCount);
    }
    if (fileCount > 0 && imgCount === 0) {
      return fileCount === 1
        ? (reply.attachments[0]?.fileName || t.value.fileAttachmentLabel)
        : t.value.filesCountLabel(fileCount);
    }
    return t.value.filesCountLabel(reply.attachments.length);
  }

  switch (reply.type) {
    case 'image':
      return t.value.photoLabel;
    case 'audio': {
      const dur =
        typeof reply.duration === 'number'
          ? formatSeconds(reply.duration)
          : reply.duration?.trim();
      return dur ? `${t.value.voiceMessageLabel} (${dur})` : t.value.voiceMessageLabel;
    }
    case 'file':
      return reply.fileName || t.value.fileAttachmentLabel;
    default:
      return t.value.mediaAttachmentLabel;
  }
});

const timeFormatter = computed(() => {
  try {
    return new Intl.DateTimeFormat(props.locale || undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
  }
});

const fullDateTimeFormatter = computed(() => {
  try {
    return new Intl.DateTimeFormat(props.locale || undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }
});

const parsedTimestampDate = computed<Date | null>(() => {
  const d = new Date(props.message.timestamp);
  return Number.isNaN(d.getTime()) ? null : d;
});

const formattedTimestamp = computed(() =>
  parsedTimestampDate.value ? timeFormatter.value.format(parsedTimestampDate.value) : ''
);

const fullTimestampTitle = computed(() =>
  parsedTimestampDate.value ? fullDateTimeFormatter.value.format(parsedTimestampDate.value) : ''
);

const isoTimestamp = computed(() =>
  parsedTimestampDate.value ? parsedTimestampDate.value.toISOString() : undefined
);

const formattedReactions = computed(() => {
  if (!props.message.reactions) return [];
  const myId = String(props.currentUserId);
  return Object.entries(props.message.reactions)
    .map(([emoji, users]) => {
      const list = Array.isArray(users) ? users : users !== undefined && users !== null ? [users] : [];
      const count = list.length;
      const isMe = list.some((id) => String(id) === myId);
      return { emoji, count, isMe };
    })
    .filter((reaction) => reaction.count > 0);
});

const myReactionsSet = computed(
  () => new Set(formattedReactions.value.filter((r) => r.isMe).map((r) => r.emoji))
);

const handleReaction = (emoji: string) => {
  if (isPendingOrFailed.value) return;
  emit('react', { messageId: props.message.id, emoji });
  closeMenu(false);
};

const triggerAction = (action: 'reply' | 'edit' | 'delete' | 'retry') => {
  if (action === 'reply') emit('reply', props.message);
  else if (action === 'edit') emit('edit', props.message);
  else if (action === 'retry') emit('retry', props.message);
  else emit('delete', props.message);
  closeMenu(false);
};

// Colțuri conectate pentru bule grupate consecutiv
const bubbleRadiusClass = computed(() => {
  if (props.message.isDeleted) return 'rounded-2xl';
  if (props.message.isMine) {
    if (props.isGrouped && !props.isLastInGroup) return 'rounded-2xl rounded-tr-md rounded-br-md';
    if (props.isGrouped) return 'rounded-2xl rounded-tr-md';
    if (!props.isLastInGroup) return 'rounded-2xl rounded-br-md';
    return 'rounded-2xl rounded-tr-sm';
  }
  if (props.isGrouped && !props.isLastInGroup) return 'rounded-2xl rounded-tl-md rounded-bl-md';
  if (props.isGrouped) return 'rounded-2xl rounded-tl-md';
  if (!props.isLastInGroup) return 'rounded-2xl rounded-bl-md';
  return 'rounded-2xl rounded-tl-sm';
});

const showFooterRow = computed(
  () =>
    !props.message.isDeleted &&
    (props.isLastInGroup ||
      props.message.status === 'failed' ||
      props.message.status === 'sending' ||
      copiedMessage.value)
);

// ==========================================
// 8. LIFECYCLE & CLEANUP COMPLET
// ==========================================
onMounted(syncCachedImages);

onUnmounted(() => {
  isUnmounted = true;
  closeMenu(false);
  detachMenuListeners();
  if (copyCodeTimer) clearTimeout(copyCodeTimer);
  if (copyMsgTimer) clearTimeout(copyMsgTimer);
  if (audioRef.value) {
    audioRef.value.pause();
    if (activeAudioEl === audioRef.value) {
      activeAudioEl = null;
    }
  }
});
</script>

<template>
  <div
    class="flex w-full items-end gap-2 rounded-2xl transition-colors duration-500"
    :class="[
      message.isMine ? 'justify-end' : 'justify-start',
      isHighlighted ? 'bg-white/10 ring-1 ring-white/20 px-2 py-1 -mx-2' : '',
    ]"
  >
    <span class="sr-only" aria-live="polite" aria-atomic="true">
      {{ liveAnnouncement }}
    </span>

    <!-- Avatar expeditor în chat de grup (ascuns pe mesaje consecutive grupate) -->
    <div v-if="isGroup && !message.isMine" class="w-8 shrink-0 self-start mt-1">
      <div
        v-if="!isGrouped"
        class="w-8 h-8 rounded-full overflow-hidden border flex items-center justify-center text-[10px] font-semibold"
        :class="
          safeSenderAvatarUrl && !senderAvatarFailed
            ? 'bg-slate-800 border-slate-700/60'
            : `${getAvatarTone(senderDisplayName).surface} ${getAvatarTone(senderDisplayName).border}`
        "
        :title="senderDisplayName"
      >
        <img
          v-if="safeSenderAvatarUrl && !senderAvatarFailed"
          :src="safeSenderAvatarUrl"
          referrerpolicy="no-referrer"
          @error="senderAvatarFailed = true"
          alt=""
          decoding="async"
          draggable="false"
          class="w-full h-full object-cover"
        />
        <span v-else aria-hidden="true">
          {{ getAvatarInitials(senderDisplayName, 2) || '?' }}
        </span>
      </div>
    </div>

    <div
      class="max-w-[85%] md:max-w-[70%] flex flex-col gap-1 relative group"
      :class="message.isMine ? 'items-end' : 'items-start'"
    >
      <!-- Nume expeditor în chat de grup -->
      <span
        v-if="isGroup && !message.isMine && !isGrouped && !message.isDeleted"
        class="text-[11px] font-semibold text-slate-400 px-1.5"
      >
        {{ senderDisplayName }}
      </span>

      <div
        class="flex items-start gap-1 max-w-full"
        :class="message.isMine ? 'flex-row-reverse' : 'flex-row'"
      >
        <!-- BULA DE MESAJ -->
        <div
          class="px-3.5 py-2.5 text-[13px] shadow-sm relative min-w-0 transition-shadow"
          :class="[
            bubbleRadiusClass,
            message.isDeleted
              ? 'bg-slate-900/50 border border-slate-700/50 text-slate-400'
              : message.isMine
                ? `${theme.bg} text-white`
                : 'bg-slate-800 text-slate-200 border border-white/5',
            message.status === 'failed' ? 'ring-1 ring-rose-500/60' : '',
            message.status === 'sending' ? 'opacity-80' : '',
          ]"
        >
          <!-- MESAJ ȘTERS -->
          <div
            v-if="message.isDeleted"
            class="flex items-center gap-2 italic text-[12px] opacity-75 py-0.5"
          >
            <Ban :size="14" aria-hidden="true" />
            <span>{{ t.deletedMessage }}</span>
          </div>

          <template v-else>
            <!-- REPLY PREVIEW (Clickabil -> jump la mesajul original) -->
            <button
              v-if="replyMessage"
              type="button"
              @click="emit('jump-to-reply', replyMessage.id)"
              class="w-full text-left mb-2 p-2 bg-black/20 hover:bg-black/30 rounded-lg border-l-4 text-[11px] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              :class="message.isMine ? 'border-white/50' : theme.border"
              :aria-label="t.jumpToReplyAriaLabel(replyAuthorLabel)"
            >
              <span
                class="font-bold block mb-0.5 truncate"
                :class="message.isMine ? 'text-white' : theme.text"
              >
                {{ replyAuthorLabel }}
              </span>
              <span class="truncate block max-w-xs opacity-80">
                {{ replyPreviewText }}
              </span>
            </button>

            <!-- 1. CONȚINUT TEXT (Blocuri de cod + InlineRichText) -->
            <template v-if="message.type === 'text'">
              <template v-for="(block, bIdx) in parsedBlocks" :key="bIdx">
                <div
                  v-if="block.type === 'code'"
                  class="bg-slate-950/90 rounded-lg my-1.5 font-mono text-[11px] border border-white/10 overflow-hidden"
                >
                  <div
                    class="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-white/5"
                  >
                    <span class="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      {{ block.language || t.codeFallbackLang }}
                    </span>
                    <button
                      type="button"
                      @click="copyCodeBlock(block.content, bIdx)"
                      class="inline-flex items-center gap-1 text-[10px] px-2 py-1 md:px-1.5 md:py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                      :aria-label="copiedCodeIndex === bIdx ? t.codeCopied : t.copyCode"
                    >
                      <Check
                        v-if="copiedCodeIndex === bIdx"
                        :size="12"
                        class="text-emerald-400"
                        aria-hidden="true"
                      />
                      <Copy v-else :size="12" aria-hidden="true" />
                      <span>{{ copiedCodeIndex === bIdx ? t.copied : t.copy }}</span>
                    </button>
                  </div>
                  <pre class="p-3 overflow-x-auto code-scrollbar text-slate-200 leading-relaxed"><code>{{ block.content }}</code></pre>
                </div>

                <span v-else class="leading-relaxed whitespace-pre-wrap break-words">
                  <InlineRichText
                    :tokens="block.tokens"
                    :is-mine="message.isMine"
                    :link-class="message.isMine ? 'text-white font-medium' : theme.text"
                    :mark-class="highlightMarkClass"
                    :folded-query="foldedHighlightQuery"
                    :interactive-mentions="interactiveMentions"
                    @mention-click="emit('mention-click', $event)"
                  />
                </span>
              </template>
            </template>

            <!-- 2. CONȚINUT AUDIO (Player complet cu Scrubbing, Retry și Viteză) -->
            <div v-else-if="message.type === 'audio'" class="flex items-center gap-2.5 w-56 md:w-64 py-0.5">
              <audio
                v-if="safeAudioUrl"
                ref="audioRef"
                :src="safeAudioUrl"
                preload="metadata"
                @play="isPlayingAudio = true"
                @pause="isPlayingAudio = false"
                @loadedmetadata="onAudioLoadedMetadata"
                @timeupdate="onAudioTimeUpdate"
                @ended="onAudioEnded"
                @error="audioError = true; isPlayingAudio = false"
                class="hidden"
              />

              <button
                type="button"
                :disabled="!safeAudioUrl"
                @click="toggleAudio"
                class="w-10 h-10 md:w-9 md:h-9 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 flex items-center justify-center shrink-0 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-40 disabled:cursor-not-allowed"
                :aria-label="
                  audioError ? t.retryVoice : isPlayingAudio ? t.pauseVoice : t.playVoice
                "
              >
                <RotateCcw v-if="audioError" :size="16" class="text-white" aria-hidden="true" />
                <Pause
                  v-else-if="isPlayingAudio"
                  :size="16"
                  class="text-white"
                  fill="currentColor"
                  aria-hidden="true"
                />
                <Play
                  v-else
                  :size="16"
                  class="text-white ml-0.5"
                  fill="currentColor"
                  aria-hidden="true"
                />
              </button>

              <div class="flex-1 flex flex-col gap-1 min-w-0">
                <div
                  role="slider"
                  tabindex="0"
                  :aria-label="t.audioSliderAriaLabel"
                  :aria-valuemin="0"
                  :aria-valuemax="100"
                  :aria-valuenow="Math.round(audioProgress)"
                  :aria-valuetext="audioValueText"
                  @pointerdown="onScrubPointerDown"
                  @pointermove="onScrubPointerMove"
                  @pointerup="onScrubPointerEnd"
                  @pointercancel="onScrubPointerEnd"
                  @keydown="handleProgressKeyDown"
                  class="w-full cursor-pointer touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded"
                  :class="normalizedWaveform.length > 0 ? 'h-7 flex items-center gap-[2px]' : 'py-2'"
                >
                  <template v-if="normalizedWaveform.length > 0">
                    <span
                      v-for="(barHeight, barIdx) in normalizedWaveform"
                      :key="barIdx"
                      class="flex-1 rounded-full transition-colors duration-75 pointer-events-none"
                      :class="
                        ((barIdx + 1) / normalizedWaveform.length) * 100 <= audioProgress
                          ? 'bg-white'
                          : 'bg-white/30'
                      "
                      :style="{ height: `${barHeight}%` }"
                    />
                  </template>

                  <div
                    v-else
                    class="w-full h-1.5 bg-black/25 rounded-full overflow-hidden relative pointer-events-none"
                  >
                    <div
                      class="absolute top-0 left-0 h-full bg-white/90 transition-all duration-75"
                      :style="{ width: `${audioProgress}%` }"
                    />
                  </div>
                </div>

                <div class="flex items-center justify-between text-[10px] opacity-85">
                  <span class="font-mono tabular-nums truncate">
                    {{ audioError ? t.audioUnavailable : audioTimeLabel }}
                  </span>
                  <button
                    v-if="!audioError && safeAudioUrl"
                    type="button"
                    @click.stop="cyclePlaybackRate"
                    class="px-1.5 py-0.5 rounded bg-black/20 hover:bg-black/35 font-mono text-[9px] font-bold transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-white/60 shrink-0"
                    :aria-label="t.playbackSpeedAriaLabel(currentPlaybackRate)"
                  >
                    {{ currentPlaybackRate }}x
                  </button>
                </div>
              </div>
            </div>

            <!-- 3. ATAȘAMENTE (Single imagine/fișier + Albume 2..N poze + Loturi fișiere + Caption) -->
            <div v-else-if="hasAttachmentContent" class="flex flex-col gap-2">
              <!-- A. Imagini (Single sau Album Grid) -->
              <template v-if="imageAttachments.length === 1 && imageAttachments[0]">
                <button
                  type="button"
                  :disabled="getImageState(imageAttachments[0].key) === 'error'"
                  @click="handleImagePreview(0)"
                  class="relative block -mx-1 rounded-xl overflow-hidden bg-black/20 text-left outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-default"
                  :class="
                    getImageState(imageAttachments[0].key) !== 'error'
                      ? 'cursor-pointer group/img'
                      : ''
                  "
                  :aria-label="t.openImageAriaLabel(1, 1)"
                >
                  <span
                    v-if="getImageState(imageAttachments[0].key) === 'loading'"
                    class="block w-56 h-40 bg-slate-700/50 motion-safe:animate-pulse"
                    aria-hidden="true"
                  />

                  <span
                    v-else-if="getImageState(imageAttachments[0].key) === 'error'"
                    class="w-52 h-32 flex flex-col items-center justify-center gap-1.5 text-white/60 text-xs px-4"
                  >
                    <ImageOff :size="20" aria-hidden="true" />
                    <span>{{ t.imageUnavailable }}</span>
                  </span>

                  <img
                    v-if="getImageState(imageAttachments[0].key) !== 'error'"
                    :key="imageAttachments[0].key"
                    :ref="(el) => setImageElRef(imageAttachments[0]!.key, el)"
                    :src="imageAttachments[0].url"
                    referrerpolicy="no-referrer"
                    @load="setImageState(imageAttachments[0]!.key, 'loaded')"
                    @error="setImageState(imageAttachments[0]!.key, 'error')"
                    :alt="message.text?.trim() || imageAttachments[0].fileName"
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                    class="max-w-[240px] md:max-w-xs max-h-72 rounded-xl object-cover shadow-sm transition-all duration-200 group-hover/img:brightness-95"
                    :class="
                      getImageState(imageAttachments[0].key) === 'loaded'
                        ? 'opacity-100'
                        : 'opacity-0 absolute inset-0'
                    "
                  />
                </button>
              </template>

              <div
                v-else-if="imageAttachments.length > 1"
                class="-mx-1 grid grid-cols-2 gap-1 w-60 md:w-72"
              >
                <button
                  v-for="(img, imgIdx) in visibleAlbumImages"
                  :key="img.key"
                  type="button"
                  :disabled="getImageState(img.key) === 'error'"
                  @click="handleImagePreview(imgIdx)"
                  class="relative rounded-xl overflow-hidden bg-black/25 outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-default group/img flex items-center justify-center"
                  :class="[
                    imageAttachments.length === 3 && imgIdx === 0
                      ? 'col-span-2 aspect-[2/1]'
                      : 'aspect-square',
                    getImageState(img.key) !== 'error' ? 'cursor-pointer' : '',
                  ]"
                  :aria-label="t.openImageAriaLabel(imgIdx + 1, imageAttachments.length)"
                >
                  <span
                    v-if="getImageState(img.key) === 'loading'"
                    class="absolute inset-0 bg-slate-700/50 motion-safe:animate-pulse"
                    aria-hidden="true"
                  />

                  <span
                    v-else-if="getImageState(img.key) === 'error'"
                    class="flex flex-col items-center justify-center gap-1 text-white/60 text-[10px]"
                  >
                    <ImageOff :size="18" aria-hidden="true" />
                  </span>

                  <img
                    v-if="getImageState(img.key) !== 'error'"
                    :key="img.key"
                    :ref="(el) => setImageElRef(img.key, el)"
                    :src="img.url"
                    referrerpolicy="no-referrer"
                    @load="setImageState(img.key, 'loaded')"
                    @error="setImageState(img.key, 'error')"
                    :alt="img.fileName"
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                    class="w-full h-full object-cover transition-all duration-200 group-hover/img:brightness-95"
                    :class="getImageState(img.key) === 'loaded' ? 'opacity-100' : 'opacity-0'"
                  />

                  <!-- Overlay +N pe al 4-lea tile când albumul are > 4 poze -->
                  <span
                    v-if="imgIdx === 3 && overflowImageCount > 0"
                    class="absolute inset-0 bg-slate-950/65 backdrop-blur-[1px] flex items-center justify-center text-lg font-bold text-white"
                    aria-hidden="true"
                  >
                    +{{ overflowImageCount }}
                  </span>
                </button>
              </div>

              <!-- Fallback explicit când un mesaj de tip image nu are niciun URL valid -->
              <div
                v-else-if="message.type === 'image' && imageAttachments.length === 0"
                class="w-52 h-28 rounded-xl bg-black/20 flex flex-col items-center justify-center gap-1.5 text-white/60 text-xs px-4"
              >
                <ImageOff :size="20" aria-hidden="true" />
                <span>{{ t.imageUnavailable }}</span>
              </div>

              <!-- B. Fișiere (1 sau mai multe) -->
              <div v-if="fileAttachments.length > 0" class="flex flex-col gap-1.5">
                <div
                  v-for="file in fileAttachments"
                  :key="file.key"
                  class="flex items-center gap-2.5 p-2 bg-black/15 rounded-xl w-56 md:w-64 border border-white/10"
                >
                  <div class="p-2 bg-white/10 rounded-lg text-white shrink-0 flex flex-col items-center">
                    <FileText :size="20" stroke-width="1.5" aria-hidden="true" />
                  </div>

                  <div class="flex-1 min-w-0 flex flex-col justify-center">
                    <span class="text-xs font-semibold text-white truncate" :title="file.fileName">
                      {{ file.fileName }}
                    </span>
                    <span class="text-[10px] text-white/65 truncate">
                      {{ file.extension }}{{ file.sizeLabel ? ` · ${file.sizeLabel}` : '' }}
                    </span>
                  </div>

                  <AppTooltip :text="t.download" placement="top" align="right">
                    <a
                      :href="file.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      :download="file.fileName"
                      class="min-w-[40px] min-h-[40px] md:min-w-[32px] md:min-h-[32px] flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                      :aria-label="t.downloadFileAriaLabel(file.fileName)"
                    >
                      <Download :size="14" aria-hidden="true" />
                    </a>
                  </AppTooltip>
                </div>
              </div>

              <!-- C. Caption opțional (același InlineRichText) -->
              <p
                v-if="parsedCaptionTokens.length > 0"
                class="text-[13px] px-0.5 leading-relaxed whitespace-pre-wrap break-words"
              >
                <InlineRichText
                  :tokens="parsedCaptionTokens"
                  :is-mine="message.isMine"
                  :link-class="message.isMine ? 'text-white font-medium' : theme.text"
                  :mark-class="highlightMarkClass"
                  :folded-query="foldedHighlightQuery"
                  :interactive-mentions="interactiveMentions"
                  @mention-click="emit('mention-click', $event)"
                />
              </p>
            </div>
          </template>
        </div>

        <!-- Meniu Dropdown (auto-flip container-aware + keyboard A11y + touch 44x44px) -->
        <div v-if="!message.isDeleted" ref="menuRef" class="relative pt-0.5 shrink-0">
          <button
            ref="menuTriggerRef"
            type="button"
            @click="toggleMenu"
            aria-haspopup="menu"
            :aria-expanded="isMenuOpen"
            :aria-label="t.messageActionsAriaLabel"
            class="min-w-[40px] min-h-[40px] md:min-w-[28px] md:min-h-[28px] flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
            :class="
              isMenuOpen ? 'opacity-100 bg-slate-800 text-white' : 'opacity-0 group-hover:opacity-100'
            "
          >
            <ChevronDown :size="15" aria-hidden="true" />
          </button>

          <transition name="fade-fast">
            <div
              v-if="isMenuOpen"
              ref="menuDropdownRef"
              role="menu"
              :aria-label="t.messageOptionsAriaLabel"
              class="absolute w-48 bg-slate-800/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl z-30 overflow-hidden"
              :class="[
                alignMenuRight ? 'right-0' : 'left-0',
                openMenuUpward ? 'bottom-full mb-1.5' : 'top-full mt-1',
              ]"
            >
              <!-- Quick reactions (ascunse pe mesaje sending/failed; marchează reacțiile active) -->
              <div
                v-if="!isPendingOrFailed"
                class="flex justify-between px-2 py-1.5 border-b border-slate-700/60 bg-slate-700/25"
              >
                <button
                  v-for="emo in QUICK_REACTIONS"
                  :key="emo"
                  type="button"
                  :aria-pressed="myReactionsSet.has(emo)"
                  @click="handleReaction(emo)"
                  class="w-8 h-8 md:w-7 md:h-7 rounded-lg hover:bg-slate-700/80 hover:scale-110 active:scale-95 flex items-center justify-center transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  :class="myReactionsSet.has(emo) ? `bg-slate-700 ring-1 ${theme.border}` : ''"
                  :aria-label="t.reactWithAriaLabel(emo, myReactionsSet.has(emo))"
                >
                  {{ emo }}
                </button>
              </div>

              <!-- Actions -->
              <div class="py-1">
                <button
                  v-if="message.isMine && message.status === 'failed'"
                  type="button"
                  role="menuitem"
                  @click="triggerAction('retry')"
                  class="w-full text-left px-3 py-2 text-[12px] text-amber-300 hover:bg-amber-500/15 flex items-center gap-2 transition-colors cursor-pointer outline-none focus-visible:bg-amber-500/15"
                >
                  <RotateCcw :size="14" aria-hidden="true" />
                  <span>{{ t.retry }}</span>
                </button>

                <button
                  v-if="!isPendingOrFailed"
                  type="button"
                  role="menuitem"
                  @click="triggerAction('reply')"
                  class="w-full text-left px-3 py-2 text-[12px] text-slate-200 hover:bg-slate-700/80 flex items-center gap-2 transition-colors cursor-pointer outline-none focus-visible:bg-slate-700"
                >
                  <Reply :size="14" aria-hidden="true" />
                  <span>{{ t.reply }}</span>
                </button>

                <button
                  v-if="message.text?.trim()"
                  type="button"
                  role="menuitem"
                  @click="copyMessageText"
                  class="w-full text-left px-3 py-2 text-[12px] text-slate-200 hover:bg-slate-700/80 flex items-center gap-2 transition-colors cursor-pointer outline-none focus-visible:bg-slate-700"
                >
                  <Copy :size="14" aria-hidden="true" />
                  <span>{{ t.copyText }}</span>
                </button>

                <button
                  v-if="message.isMine && message.type === 'text' && !isPendingOrFailed"
                  type="button"
                  role="menuitem"
                  @click="triggerAction('edit')"
                  class="w-full text-left px-3 py-2 text-[12px] text-slate-200 hover:bg-slate-700/80 flex items-center gap-2 transition-colors cursor-pointer outline-none focus-visible:bg-slate-700"
                >
                  <Edit2 :size="14" aria-hidden="true" />
                  <span>{{ t.edit }}</span>
                </button>

                <button
                  v-if="message.isMine"
                  type="button"
                  role="menuitem"
                  @click="triggerAction('delete')"
                  class="w-full text-left px-3 py-2 text-[12px] text-rose-400 hover:bg-rose-500/15 flex items-center gap-2 transition-colors cursor-pointer outline-none focus-visible:bg-rose-500/15"
                >
                  <Trash2 :size="14" aria-hidden="true" />
                  <span>{{ t.delete }}</span>
                </button>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- REACȚII -->
      <div
        v-if="formattedReactions.length > 0 && !message.isDeleted"
        class="flex flex-wrap gap-1 z-10"
        :class="message.isMine ? 'justify-end pr-1' : 'justify-start pl-1'"
      >
        <button
          v-for="reaction in formattedReactions"
          :key="reaction.emoji"
          type="button"
          :disabled="isPendingOrFailed"
          @click="handleReaction(reaction.emoji)"
          :aria-pressed="reaction.isMe"
          :aria-label="t.reactionPillAriaLabel(reaction.emoji, reaction.count, reaction.isMe)"
          class="px-2 py-0.5 rounded-full border text-[11px] shadow-sm flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-default outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          :class="
            reaction.isMe
              ? `bg-slate-700/90 ${theme.border} text-white`
              : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-700'
          "
        >
          <span>{{ reaction.emoji }}</span>
          <span v-if="reaction.count > 1" class="font-bold text-[10px] tabular-nums opacity-85">
            {{ reaction.count }}
          </span>
        </button>
      </div>

      <!-- FOOTER MESAJ: TIMP, STATUS LIVRARE, COPIED & RETRY -->
      <div
        v-if="showFooterRow"
        class="flex items-center gap-1.5 px-1 transition-opacity"
        :class="
          message.status === 'failed' || copiedMessage
            ? 'opacity-100'
            : 'opacity-70 group-hover:opacity-100'
        "
      >
        <span v-if="copiedMessage" class="text-[10px] font-medium text-emerald-400">
          {{ t.copied }}
        </span>

        <time
          :datetime="isoTimestamp"
          class="text-[10px] text-slate-500 tabular-nums"
          :title="fullTimestampTitle"
        >
          {{ message.isEdited ? t.editedPrefix : '' }}{{ formattedTimestamp }}
        </time>

        <template v-if="message.isMine">
          <Clock
            v-if="message.status === 'sending'"
            :size="11"
            class="text-slate-500"
            :aria-label="t.statusSending"
          />
          <Check
            v-else-if="message.status === 'sent'"
            :size="12"
            class="text-slate-500"
            :aria-label="t.statusSent"
          />
          <CheckCheck
            v-else-if="message.status === 'delivered'"
            :size="12"
            class="text-slate-500"
            :aria-label="t.statusDelivered"
          />
          <CheckCheck
            v-else-if="message.status === 'read'"
            :size="12"
            :class="theme.text"
            :aria-label="t.statusRead"
          />
          <button
            v-else-if="message.status === 'failed'"
            type="button"
            @click="emit('retry', message)"
            class="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 hover:text-rose-300 cursor-pointer outline-none focus-visible:underline"
            :aria-label="t.statusFailedAriaLabel"
          >
            <AlertCircle :size="11" aria-hidden="true" />
            <span>{{ t.statusFailedRetry }}</span>
            <RotateCcw :size="10" aria-hidden="true" />
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.code-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.35) transparent;
}
.code-scrollbar::-webkit-scrollbar {
  height: 6px;
}
.code-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.code-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.35);
  border-radius: 9999px;
}
.code-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(148, 163, 184, 0.55);
}
.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 0.14s ease, transform 0.14s ease;
}
.fade-fast-enter-from,
.fade-fast-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.96);
}
</style>