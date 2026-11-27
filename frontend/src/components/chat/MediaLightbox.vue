<!-- src/components/chat/MediaLightbox.vue -->
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  ImageOff,
  CornerUpRight,
  Loader2,
} from 'lucide-vue-next';
import AppTooltip from '../ui/AppTooltip.vue';

export interface MediaLightboxItem {
  id: string | number;
  src: string;
  alt?: string;
  caption?: string | null;
  fileName?: string | null;
  senderName?: string | null;
  timestamp?: Date | string | number | null;
  messageId?: string | number;
}

export interface MediaLightboxLabels {
  dialogAriaLabel: string;
  close: string;
  download: string;
  previous: string;
  next: string;
  zoomIn: string;
  zoomOut: string;
  jumpToMessage: string;
  loadError: string;
  imageAltFallback: string;
  positionAnnouncement: (current: number, total: number, caption?: string | null) => string;
}

const DEFAULT_LABELS: MediaLightboxLabels = {
  dialogAriaLabel: 'Shared media gallery',
  close: 'Close gallery',
  download: 'Download image',
  previous: 'Previous image',
  next: 'Next image',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  jumpToMessage: 'Jump to message',
  loadError: 'Could not load image',
  imageAltFallback: 'Shared photo',
  positionAnnouncement: (current, total, caption) =>
    caption ? `Image ${current} of ${total}: ${caption}` : `Image ${current} of ${total}`,
};

export interface MediaLightboxProps {
  items: MediaLightboxItem[];
  activeIndex: number | null;
  canJumpToMessage?: boolean;
  locale?: string;
  labels?: Partial<MediaLightboxLabels>;
}

const props = withDefaults(defineProps<MediaLightboxProps>(), {
  canJumpToMessage: false,
  locale: undefined,
  labels: () => ({}),
});

const emit = defineEmits<{
  'update:activeIndex': [index: number | null];
  close: [];
  'jump-to-message': [messageId: string | number];
}>();

const t = computed<MediaLightboxLabels>(() => ({
  ...DEFAULT_LABELS,
  ...props.labels,
}));

const sanitizeMediaUrl = (raw?: string | null): string | null => {
  const trimmed = raw?.trim();
  if (!trimmed || /[\u0000-\u001F\u007F]/.test(trimmed)) return null;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;

  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol === 'https:' || protocol === 'http:') return parsed.href;
    if (protocol === 'blob:') return trimmed;
    return null;
  } catch {
    return null;
  }
};

// Blocare scroll sigură pentru modale/drawere suprapuse (ref-counted pe document.body)
const acquireScrollLock = () => {
  if (typeof document === 'undefined') return;
  const body = document.body;
  const count = Number(body.dataset.scrollLockCount ?? '0');
  if (count === 0) {
    body.dataset.scrollLockPrevOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
  }
  body.dataset.scrollLockCount = String(count + 1);
};

const releaseScrollLock = () => {
  if (typeof document === 'undefined') return;
  const body = document.body;
  const count = Math.max(0, Number(body.dataset.scrollLockCount ?? '0') - 1);
  if (count === 0) {
    body.style.overflow = body.dataset.scrollLockPrevOverflow ?? '';
    delete body.dataset.scrollLockCount;
    delete body.dataset.scrollLockPrevOverflow;
  } else {
    body.dataset.scrollLockCount = String(count);
  }
};

const currentItem = computed<MediaLightboxItem | null>(() => {
  if (props.activeIndex === null) return null;
  return props.items[props.activeIndex] ?? null;
});

const isOpen = computed(() => props.activeIndex !== null && currentItem.value !== null);
const safeSrc = computed(() => sanitizeMediaUrl(currentItem.value?.src));
const canNavigate = computed(() => props.items.length > 1);

const dialogRef = ref<HTMLElement | null>(null);
const closeBtnRef = ref<HTMLButtonElement | null>(null);
const imgRef = ref<HTMLImageElement | null>(null);

type ImageLoadState = 'loading' | 'loaded' | 'error';
const imageState = ref<ImageLoadState>('loading');
const isZoomed = ref(false);
const zoomedWidth = ref<number | null>(null);

let isLightboxActive = false;
let previouslyFocusedEl: HTMLElement | null = null;
let isUnmounted = false;

const dateFormatter = computed(() => {
  try {
    return new Intl.DateTimeFormat(props.locale || undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
});

const formattedTimestamp = computed(() => {
  const raw = currentItem.value?.timestamp;
  if (!raw) return '';
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? '' : dateFormatter.value.format(date);
});

const livePositionAnnouncement = computed(() => {
  if (!isOpen.value || props.activeIndex === null || !currentItem.value) return '';
  return t.value.positionAnnouncement(
    props.activeIndex + 1,
    props.items.length,
    currentItem.value.caption
  );
});

const resetZoom = () => {
  isZoomed.value = false;
  zoomedWidth.value = null;
};

const syncCachedImage = async () => {
  const expectedSrc = safeSrc.value;
  await nextTick();
  if (isUnmounted || safeSrc.value !== expectedSrc || !isOpen.value) return;

  const img = imgRef.value;
  if (!img || !img.complete) return;
  imageState.value = img.naturalWidth > 0 ? 'loaded' : 'error';
};

const close = () => {
  emit('update:activeIndex', null);
  emit('close');
};

const showPrev = () => {
  if (props.activeIndex === null || props.items.length <= 1) return;
  const nextIdx = (props.activeIndex - 1 + props.items.length) % props.items.length;
  emit('update:activeIndex', nextIdx);
};

const showNext = () => {
  if (props.activeIndex === null || props.items.length <= 1) return;
  const nextIdx = (props.activeIndex + 1) % props.items.length;
  emit('update:activeIndex', nextIdx);
};

const toggleZoom = () => {
  if (imageState.value !== 'loaded') return;
  if (isZoomed.value) {
    resetZoom();
    return;
  }

  const img = imgRef.value;
  if (!img) return;
  const fittedWidth = img.getBoundingClientRect().width;
  if (fittedWidth <= 0) return;

  zoomedWidth.value = Math.round(fittedWidth * 2);
  isZoomed.value = true;
};

const handleJumpToMessage = () => {
  const msgId = currentItem.value?.messageId;
  if (msgId === undefined) return;
  close();
  emit('jump-to-message', msgId);
};

// Swipe stânga/dreapta pe touch (anulat automat la pinch-zoom cu 2+ degete)
let touchStartX = 0;
let touchStartY = 0;
let isTrackingTouch = false;

const onTouchStart = (event: TouchEvent) => {
  if (isZoomed.value || !canNavigate.value || event.touches.length !== 1) {
    isTrackingTouch = false;
    return;
  }
  const touch = event.touches[0];
  if (!touch) return;
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  isTrackingTouch = true;
};

const onTouchMove = (event: TouchEvent) => {
  if (event.touches.length > 1) {
    isTrackingTouch = false;
  }
};

const onTouchEnd = (event: TouchEvent) => {
  if (!isTrackingTouch) return;
  isTrackingTouch = false;

  const touch = event.changedTouches[0];
  if (!touch) return;
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;

  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    if (dx < 0) showNext();
    else showPrev();
  }
};

// Focus trap complet + navigare din tastatură (fără conflicte cu shortcut-urile browserului)
const getFocusableElements = (): HTMLElement[] => {
  const root = dialogRef.value;
  if (!root) return [];
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => el.getClientRects().length > 0);
};

const onWindowKeyDown = (event: KeyboardEvent) => {
  if (!isOpen.value || event.defaultPrevented) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    close();
    return;
  }

  if (
    !event.metaKey &&
    !event.ctrlKey &&
    !event.altKey &&
    (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
  ) {
    event.preventDefault();
    if (event.key === 'ArrowLeft') showPrev();
    else showNext();
    return;
  }

  if (event.key === 'Tab') {
    const focusables = getFocusableElements();
    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      if (!active || active === first || !dialogRef.value?.contains(active)) {
        event.preventDefault();
        last?.focus();
      }
    } else if (!active || active === last || !dialogRef.value?.contains(active)) {
      event.preventDefault();
      first?.focus();
    }
  }
};

const onWindowResize = () => {
  if (isZoomed.value) {
    resetZoom();
  }
};

const activateLightbox = () => {
  if (isLightboxActive || typeof document === 'undefined' || typeof window === 'undefined') return;
  isLightboxActive = true;
  previouslyFocusedEl =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  resetZoom();
  imageState.value = safeSrc.value ? 'loading' : 'error';

  acquireScrollLock();
  window.addEventListener('keydown', onWindowKeyDown, true);
  window.addEventListener('resize', onWindowResize);

  nextTick(() => {
    if (!isLightboxActive || isUnmounted) return;
    closeBtnRef.value?.focus();
    if (safeSrc.value) syncCachedImage();
  });
};

const deactivateLightbox = (restoreFocus: boolean) => {
  if (!isLightboxActive) return;
  isLightboxActive = false;

  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onWindowKeyDown, true);
    window.removeEventListener('resize', onWindowResize);
  }
  releaseScrollLock();
  resetZoom();

  const toRestore = previouslyFocusedEl;
  previouslyFocusedEl = null;
  if (restoreFocus && toRestore && typeof document !== 'undefined') {
    nextTick(() => {
      if (document.contains(toRestore)) toRestore.focus();
    });
  }
};

// Ajustare index dacă lista se micșorează în timp ce Lightbox-ul e deschis
watch(
  () => props.items.length,
  (len) => {
    if (props.activeIndex === null) return;
    if (len === 0) {
      close();
    } else if (props.activeIndex >= len) {
      emit('update:activeIndex', len - 1);
    }
  }
);

watch(
  () => props.activeIndex,
  () => {
    resetZoom();
  }
);

watch(safeSrc, (nextSrc) => {
  resetZoom();
  imageState.value = nextSrc ? 'loading' : 'error';
  if (nextSrc && isOpen.value) {
    syncCachedImage();
  }
});

watch(isOpen, (open) => {
  if (open) activateLightbox();
  else deactivateLightbox(true);
});

onMounted(() => {
  if (isOpen.value) {
    activateLightbox();
  }
});

onUnmounted(() => {
  isUnmounted = true;
  deactivateLightbox(false);
});
</script>

<template>
  <Teleport to="body">
    <transition name="lightbox-fade">
      <div
        v-if="isOpen && currentItem && activeIndex !== null"
        ref="dialogRef"
        role="dialog"
        aria-modal="true"
        :aria-label="t.dialogAriaLabel"
        @click.self="close"
        @touchstart.passive="onTouchStart"
        @touchmove.passive="onTouchMove"
        @touchend.passive="onTouchEnd"
        class="fixed inset-0 z-[130] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 md:p-8 select-none"
      >
        <span class="sr-only" aria-live="polite" aria-atomic="true">
          {{ livePositionAnnouncement }}
        </span>

        <!-- Top Bar -->
        <div
          class="absolute top-3 md:top-4 inset-x-3 md:inset-x-5 flex items-center justify-between gap-2 pointer-events-none z-20"
        >
          <div class="flex items-center gap-2 min-w-0 pointer-events-auto">
            <span
              class="px-3 py-1.5 rounded-full bg-slate-900/90 border border-white/10 text-xs font-mono tabular-nums text-slate-200 shrink-0"
            >
              {{ activeIndex + 1 }} / {{ items.length }}
            </span>

            <div
              v-if="currentItem.senderName || formattedTimestamp"
              class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/10 text-xs text-slate-300 truncate max-w-[260px]"
            >
              <span v-if="currentItem.senderName" class="font-medium text-white truncate">
                {{ currentItem.senderName }}
              </span>
              <span
                v-if="currentItem.senderName && formattedTimestamp"
                class="text-slate-500"
                aria-hidden="true"
              >
                ·
              </span>
              <span v-if="formattedTimestamp" class="text-slate-400 shrink-0">
                {{ formattedTimestamp }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-1.5 md:gap-2 pointer-events-auto">
            <AppTooltip
              v-if="canJumpToMessage && currentItem.messageId !== undefined"
              :text="t.jumpToMessage"
              align="right"
            >
              <button
                type="button"
                @click="handleJumpToMessage"
                class="min-w-[44px] min-h-[44px] md:min-w-[40px] md:min-h-[40px] flex items-center justify-center rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                :aria-label="t.jumpToMessage"
              >
                <CornerUpRight :size="18" aria-hidden="true" />
              </button>
            </AppTooltip>

            <AppTooltip
              v-if="imageState === 'loaded'"
              :text="isZoomed ? t.zoomOut : t.zoomIn"
              align="right"
            >
              <button
                type="button"
                @click="toggleZoom"
                :aria-pressed="isZoomed"
                class="min-w-[44px] min-h-[44px] md:min-w-[40px] md:min-h-[40px] flex items-center justify-center rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                :aria-label="isZoomed ? t.zoomOut : t.zoomIn"
              >
                <ZoomOut v-if="isZoomed" :size="18" aria-hidden="true" />
                <ZoomIn v-else :size="18" aria-hidden="true" />
              </button>
            </AppTooltip>

            <AppTooltip v-if="safeSrc" :text="t.download" align="right">
              <a
                :href="safeSrc"
                :download="currentItem.fileName || ''"
                target="_blank"
                rel="noopener noreferrer"
                class="min-w-[44px] min-h-[44px] md:min-w-[40px] md:min-h-[40px] flex items-center justify-center rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                :aria-label="t.download"
              >
                <Download :size="18" aria-hidden="true" />
              </a>
            </AppTooltip>

            <AppTooltip :text="t.close" shortcut="Esc" align="right">
              <button
                ref="closeBtnRef"
                type="button"
                @click="close"
                class="min-w-[44px] min-h-[44px] md:min-w-[40px] md:min-h-[40px] flex items-center justify-center rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                :aria-label="t.close"
              >
                <X :size="18" aria-hidden="true" />
              </button>
            </AppTooltip>
          </div>
        </div>

        <!-- Prev / Next -->
        <button
          v-if="canNavigate"
          type="button"
          @click="showPrev"
          class="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-slate-900/85 hover:bg-slate-800 border border-white/10 text-slate-200 hover:text-white transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          :aria-label="t.previous"
        >
          <ChevronLeft :size="22" aria-hidden="true" />
        </button>

        <!-- Container Imagine (m-auto permite scroll pe toate 4 laturile la zoom 2x) -->
        <div
          @click.self="close"
          class="relative flex w-full flex-1 min-h-0 mt-12"
          :class="isZoomed ? 'overflow-auto p-2' : 'overflow-hidden items-center justify-center'"
        >
          <div
            v-if="imageState === 'loading' && safeSrc"
            class="absolute inset-0 flex items-center justify-center pointer-events-none"
            aria-busy="true"
          >
            <Loader2 :size="28" class="text-slate-400 motion-safe:animate-spin" aria-hidden="true" />
          </div>

          <div
            v-if="imageState === 'error' || !safeSrc"
            class="m-auto px-8 py-10 rounded-2xl bg-slate-900/90 border border-white/10 flex flex-col items-center gap-2.5 text-slate-400"
          >
            <ImageOff :size="28" class="opacity-60" aria-hidden="true" />
            <p class="text-xs">{{ t.loadError }}</p>
          </div>

          <img
            v-else
            :key="safeSrc"
            ref="imgRef"
            :src="safeSrc"
            referrerpolicy="no-referrer"
            :alt="currentItem.alt || currentItem.caption || t.imageAltFallback"
            draggable="false"
            @load="imageState = 'loaded'"
            @error="imageState = 'error'"
            @click="toggleZoom"
            :style="isZoomed && zoomedWidth ? { width: `${zoomedWidth}px` } : undefined"
            class="m-auto rounded-2xl object-contain shadow-2xl border border-white/10 transition-opacity duration-200 shrink-0"
            :class="[
              imageState === 'loaded' ? 'opacity-100' : 'opacity-0',
              isZoomed
                ? 'max-w-none max-h-none h-auto cursor-zoom-out'
                : 'max-w-[85vw] max-h-[75vh] cursor-zoom-in',
            ]"
          />
        </div>

        <button
          v-if="canNavigate"
          type="button"
          @click="showNext"
          class="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-slate-900/85 hover:bg-slate-800 border border-white/10 text-slate-200 hover:text-white transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          :aria-label="t.next"
        >
          <ChevronRight :size="22" aria-hidden="true" />
        </button>

        <!-- Footer: Metadata mobil + Caption -->
        <div
          v-if="currentItem.caption || currentItem.senderName || formattedTimestamp"
          class="mt-3 flex flex-col items-center gap-1.5 max-w-2xl z-20"
        >
          <p
            v-if="currentItem.senderName || formattedTimestamp"
            class="sm:hidden text-[11px] text-slate-400 text-center"
          >
            <span v-if="currentItem.senderName" class="font-medium text-slate-200">
              {{ currentItem.senderName }}
            </span>
            <span v-if="currentItem.senderName && formattedTimestamp" aria-hidden="true"> · </span>
            <span v-if="formattedTimestamp">{{ formattedTimestamp }}</span>
          </p>

          <p
            v-if="currentItem.caption"
            class="text-center text-sm text-slate-200 bg-slate-900/85 px-4 py-2 rounded-xl border border-white/10 select-text"
          >
            {{ currentItem.caption }}
          </p>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.lightbox-fade-enter-active,
.lightbox-fade-leave-active {
  transition: opacity 0.18s ease;
}
.lightbox-fade-enter-from,
.lightbox-fade-leave-to {
  opacity: 0;
}
</style>