// frontend/src/utils/lensTheme.ts
import type { ChatLens, ChatTheme } from '../types/chat';

export type AppLens = ChatLens;

export interface MiniProfileTheme {
  wrapper: string;
  subtitle: string;
  settings: string;
  text: string;
}

export interface ChatListTheme {
  text: string;
  bg: string;
  bgLight: string;
  border: string;
  hover: string;
  activeRow: string;
  focusRing: string;
  tabActive: string;
  mark: string;
}

export interface LensThemeConfig {
  text: string;
  bg: string;
  bgHover: string;
  soft: string;
  active: string;
  tabActive: string;
  badge: string;
  ring: string;
  focusVisibleRing: string;
  accentRing: string;
  chip: string;
  check: string;
  activeRow: string;
  banner: string;
  chatTheme: ChatTheme;
  miniProfile: MiniProfileTheme;
  chatList: ChatListTheme;
}

const LENS_THEMES: Record<AppLens, LensThemeConfig> = {
  PRO: {
    text: 'text-indigo-400',
    bg: 'bg-indigo-500',
    bgHover: 'hover:bg-indigo-400',
    soft: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
    active: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    tabActive: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    badge: 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.55)]',
    ring: 'focus:ring-indigo-500/50 focus:border-indigo-500/50',
    focusVisibleRing: 'focus-visible:ring-indigo-500',
    accentRing: 'ring-2 ring-indigo-400/75 bg-indigo-500/10',
    chip: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-200',
    check: 'bg-indigo-500 border-indigo-500',
    activeRow: 'bg-indigo-500/10 border-indigo-500/25',
    banner: 'from-indigo-600/30 via-violet-500/15 to-transparent',
    chatTheme: {
      text: 'text-indigo-400',
      bg: 'bg-indigo-500',
      bgLight: 'bg-indigo-500/10',
      border: 'border-indigo-500/30',
      hover: 'hover:bg-indigo-500/20',
      mark: 'bg-indigo-500/35 text-indigo-100 rounded px-0.5',
    },
    miniProfile: {
      wrapper:
        'bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.1)] focus-visible:ring-indigo-500',
      subtitle: 'text-indigo-300 group-hover:text-indigo-200',
      settings:
        'text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 focus-visible:ring-indigo-500',
      text: 'Student Frontend Dev',
    },
    chatList: {
      text: 'text-indigo-400',
      bg: 'bg-indigo-500',
      bgLight: 'bg-indigo-500/15',
      border: 'border-indigo-500/30',
      hover: 'hover:bg-indigo-500/10',
      activeRow: 'bg-indigo-500/15 ring-1 ring-indigo-500/30',
      focusRing: 'focus:ring-indigo-500/50 focus:border-indigo-500/50',
      tabActive: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      mark: 'bg-indigo-500/30 text-indigo-100',
    },
  },
  SOCIAL: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500',
    bgHover: 'hover:bg-emerald-400',
    soft: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    tabActive: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    badge: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.55)]',
    ring: 'focus:ring-emerald-500/50 focus:border-emerald-500/50',
    focusVisibleRing: 'focus-visible:ring-emerald-500',
    accentRing: 'ring-2 ring-emerald-400/75 bg-emerald-500/10',
    chip: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200',
    check: 'bg-emerald-500 border-emerald-500',
    activeRow: 'bg-emerald-500/10 border-emerald-500/25',
    banner: 'from-emerald-600/30 via-teal-500/15 to-transparent',
    chatTheme: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500',
      bgLight: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      hover: 'hover:bg-emerald-500/20',
      mark: 'bg-emerald-500/35 text-emerald-100 rounded px-0.5',
    },
    miniProfile: {
      wrapper:
        'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)] focus-visible:ring-emerald-500',
      subtitle: 'text-emerald-300 group-hover:text-emerald-200',
      settings:
        'text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 focus-visible:ring-emerald-500',
      text: 'Connected',
    },
    chatList: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500',
      bgLight: 'bg-emerald-500/15',
      border: 'border-emerald-500/30',
      hover: 'hover:bg-emerald-500/10',
      activeRow: 'bg-emerald-500/15 ring-1 ring-emerald-500/30',
      focusRing: 'focus:ring-emerald-500/50 focus:border-emerald-500/50',
      tabActive: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      mark: 'bg-emerald-500/30 text-emerald-100',
    },
  },
  DATE: {
    text: 'text-rose-400',
    bg: 'bg-rose-500',
    bgHover: 'hover:bg-rose-400',
    soft: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
    active: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    tabActive: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    badge: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.55)]',
    ring: 'focus:ring-rose-500/50 focus:border-rose-500/50',
    focusVisibleRing: 'focus-visible:ring-rose-500',
    accentRing: 'ring-2 ring-rose-400/75 bg-rose-500/10',
    chip: 'bg-rose-500/15 border-rose-500/30 text-rose-200',
    check: 'bg-rose-500 border-rose-500',
    activeRow: 'bg-rose-500/10 border-rose-500/25',
    banner: 'from-rose-600/30 via-pink-500/15 to-transparent',
    chatTheme: {
      text: 'text-rose-400',
      bg: 'bg-rose-500',
      bgLight: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      hover: 'hover:bg-rose-500/20',
      mark: 'bg-rose-500/35 text-rose-100 rounded px-0.5',
    },
    miniProfile: {
      wrapper:
        'bg-rose-500/10 border-rose-500/20 hover:border-rose-500/40 shadow-[0_0_15px_rgba(225,29,72,0.1)] focus-visible:ring-rose-500',
      subtitle: 'text-rose-300 group-hover:text-rose-200',
      settings:
        'text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 focus-visible:ring-rose-500',
      text: 'Dating Profile',
    },
    chatList: {
      text: 'text-rose-400',
      bg: 'bg-rose-500',
      bgLight: 'bg-rose-500/15',
      border: 'border-rose-500/30',
      hover: 'hover:bg-rose-500/10',
      activeRow: 'bg-rose-500/15 ring-1 ring-rose-500/30',
      focusRing: 'focus:ring-rose-500/50 focus:border-rose-500/50',
      tabActive: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      mark: 'bg-rose-500/30 text-rose-100',
    },
  },
};

export const normalizeLens = (lens: string): AppLens => {
  const upper = lens.trim().toUpperCase();
  if (upper === 'SOCIAL' || upper === 'DATE') return upper;
  return 'PRO';
};

export const getLensTheme = (lens: AppLens | string): LensThemeConfig =>
  LENS_THEMES[normalizeLens(lens)];

export const getChatRouteNameForLens = (
  lens: AppLens | string
): 'pro-chats' | 'social-chats' | 'dating-chats' => {
  const normalized = normalizeLens(lens);
  if (normalized === 'SOCIAL') return 'social-chats';
  if (normalized === 'DATE') return 'dating-chats';
  return 'pro-chats';
};