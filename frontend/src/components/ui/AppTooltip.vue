<!-- src/components/ui/AppTooltip.vue -->
<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';

export type TooltipAlign = 'center' | 'left' | 'right';
export type TooltipPlacement = 'top' | 'bottom';

export interface AppTooltipProps {
  text: string;
  shortcut?: string;
  align?: TooltipAlign;
  placement?: TooltipPlacement;
  disabled?: boolean;
}

const props = withDefaults(defineProps<AppTooltipProps>(), {
  shortcut: '',
  align: 'center',
  placement: 'bottom',
  disabled: false,
});

const isHovered = ref(false);
const isFocusVisible = ref(false);
const isDismissed = ref(false);

const isVisible = computed(
  () =>
    !props.disabled &&
    Boolean(props.text) &&
    !isDismissed.value &&
    (isHovered.value || isFocusVisible.value)
);

const onPointerEnter = (event: PointerEvent) => {
  // Evită declanșarea falsă pe tap la dispozitive hibride (touchscreen + mouse)
  if (event.pointerType !== 'mouse') return;
  isDismissed.value = false;
  isHovered.value = true;
};

const onPointerLeave = () => {
  isHovered.value = false;
  isDismissed.value = false;
};

const onFocusIn = (event: FocusEvent) => {
  const target = event.target as HTMLElement | null;
  if (target?.matches?.(':focus-visible')) {
    isDismissed.value = false;
    isFocusVisible.value = true;
  }
};

const onFocusOut = () => {
  isFocusVisible.value = false;
  isDismissed.value = false;
};

const onWindowKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    isDismissed.value = true;
    isFocusVisible.value = false;
  }
};

watch(isVisible, (visible) => {
  if (typeof window === 'undefined') return;
  if (visible) {
    window.addEventListener('keydown', onWindowKeyDown);
  } else {
    window.removeEventListener('keydown', onWindowKeyDown);
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onWindowKeyDown);
  }
});

const placementClass = computed(() =>
  props.placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
);

const alignmentClass = computed(() => {
  switch (props.align) {
    case 'left':
      return 'left-0';
    case 'right':
      return 'right-0';
    default:
      return 'left-1/2 -translate-x-1/2';
  }
});

const visibilityClass = computed(() => {
  if (!isVisible.value) {
    const offset = props.placement === 'top' ? '-translate-y-0.5' : 'translate-y-0.5';
    return `opacity-0 ${offset} delay-0`;
  }
  if (isFocusVisible.value) {
    return 'opacity-100 translate-y-0 delay-150';
  }
  return 'opacity-100 translate-y-0 delay-300';
});
</script>

<template>
  <div
    class="relative"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
  >
    <slot />

    <!-- aria-hidden previne citirea dublă pe butoane care au deja aria-label -->
    <span
      v-if="!disabled && text"
      aria-hidden="true"
      class="pointer-events-none absolute z-50 hidden [@media(hover:hover)]:flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-slate-950/95 border border-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-200 shadow-lg transition-all duration-150"
      :class="[placementClass, alignmentClass, visibilityClass]"
    >
      <span>{{ text }}</span>
      <kbd
        v-if="shortcut"
        class="px-1 py-0.5 text-[10px] font-mono leading-none rounded bg-slate-800 text-slate-400 border border-white/10"
      >
        {{ shortcut }}
      </kbd>
    </span>
  </div>
</template>