// src/utils/avatar.ts
export interface AvatarTone {
  surface: string;
  border: string;
}

const AVATAR_PALETTE: readonly AvatarTone[] = [
  { surface: 'bg-indigo-500/20 text-indigo-300', border: 'border-indigo-400/25' },
  { surface: 'bg-emerald-500/20 text-emerald-300', border: 'border-emerald-400/25' },
  { surface: 'bg-amber-500/20 text-amber-300', border: 'border-amber-400/25' },
  { surface: 'bg-rose-500/20 text-rose-300', border: 'border-rose-400/25' },
  { surface: 'bg-cyan-500/20 text-cyan-300', border: 'border-cyan-400/25' },
  { surface: 'bg-violet-500/20 text-violet-300', border: 'border-violet-400/25' },
  { surface: 'bg-sky-500/20 text-sky-300', border: 'border-sky-400/25' },
  { surface: 'bg-fuchsia-500/20 text-fuchsia-300', border: 'border-fuchsia-400/25' },
] as const;

const FALLBACK_TONE: AvatarTone = {
  surface: 'bg-slate-800 text-slate-200',
  border: 'border-slate-700/60',
};

/** Extrage 1 sau 2 inițiale fără a tăia emoji-uri sau caractere Unicode compuse. */
export function getAvatarInitials(name?: string | null, maxChars: 1 | 2 = 2): string {
  const trimmed = name?.trim();
  if (!trimmed) return '';
  const parts = trimmed.split(/\s+/);
  if (maxChars === 1 || parts.length === 1) {
    return [...parts[0]].slice(0, maxChars).join('').toUpperCase();
  }
  return ([...parts[0]][0] + [...parts[parts.length - 1]][0]).toUpperCase();
}

/** Returnează o culoare consistentă (deterministă) pe baza numelui. */
export function getAvatarTone(name?: string | null): AvatarTone {
  const trimmed = name?.trim();
  if (!trimmed) return FALLBACK_TONE;

  let hash = 0;
  for (const char of trimmed) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}