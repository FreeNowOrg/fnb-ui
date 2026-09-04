// Single source of truth for all design tokens.
// `scripts/gen-tokens.mjs` reads this file and emits src/styles/tokens.css.
// Never hand-edit the generated CSS.

/** Colors a theme may override. Semantic values derive from these. */
export const color = {
  bg: '#eef2ff',
  bgAlt: '#f0f0f0',
  brand: '#4993ff',
  accent: '#a78bfa',
  success: '#7fd957',
  highlight: '#ffe066',
  danger: '#ff5555',
  border: '#000',
  surface: '#fff',
  text: '#1a1a1a',
  textMuted: '#666',
  onBrand: '#fff',
  onLight: '#1a1a1a',
  skeleton: '#e8e8e8',
  divider: '#dedede',
  gridLine: 'rgba(0, 0, 0, 0.03)',
  silver: '#d1d5db',
  bronze: '#f0b27a',
} as const

/**
 * Dark-mode overrides. Only keys that actually differ are listed.
 *
 * The generator emits these under a bare `.dark` selector (see
 * scripts/gen-tokens.mjs), not `.fnb-dark`. This is intentional: it aligns
 * with the `.dark` convention used by Tailwind's class strategy and Nuxt
 * color-mode, so a host page toggling `.dark` on its root switches fnb-ui's
 * theme along with the rest of the page for free. Do not rename this to
 * `.fnb-dark` — that would silently break every consumer relying on that
 * convention.
 */
export const colorDark = {
  bg: '#14151b',
  bgAlt: '#1d2029',
  border: '#4c5160',
  surface: '#1e222b',
  text: '#eef0f3',
  textMuted: '#9aa1ac',
  skeleton: '#2a2e38',
  divider: '#343a45',
  gridLine: 'rgba(255, 255, 255, 0.04)',
} as const

/** Dimension one: size. Governs geometry of single-line controls. */
export const control = {
  sm: { h: '28px', font: '13px', px: '10px' },
  md: { h: '36px', font: '14px', px: '14px' },
  lg: { h: '44px', font: '16px', px: '18px' },
} as const

/**
 * Dimension two: visual weight. border and shadow ALWAYS move together —
 * they jointly form one step of visual weight in this design language.
 * Element type picks the tier, not size alone: a Tag stays w1 at any size.
 */
export const weight = {
  w1: { border: '2px', shadow: '3px' },
  w2: { border: '2px', shadow: '4px' },
  w3: { border: '3px', shadow: '6px' },
  w4: { border: '3px', shadow: '8px' },
} as const

export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
} as const

export const motion = {
  durationFast: '150ms',
  duration: '250ms',
  ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const

/** Explicit stacking order. Never hand-pick a z-index outside this scale. */
export const zIndex = {
  base: '1',
  stickyHeader: '100',
  floatButton: '150',
  siderOverlay: '200',
  sider: '210',
  dialogOverlay: '300',
  dialog: '310',
  message: '400',
  imagePreview: '500',
} as const

export const font = {
  sans: "'Noto Sans SC', 'PingFang SC', 'Hiragino Sans GB', system-ui, sans-serif",
  display: "'Archivo Black', 'Noto Sans SC', system-ui, sans-serif",
  mono: "'Space Grotesk', ui-monospace, monospace",
} as const

/** Layout sizes multiple components must agree on. */
export const layout = {
  headerHeight: '56px',
} as const

/**
 * Breakpoints are NOT emitted as CSS variables: `@media (min-width: var(--x))`
 * silently fails, and `@custom-media` is not usable yet. The generator emits
 * SCSS variables for `@media`; TS consumers import this constant instead.
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const

export const tokens = {
  color,
  colorDark,
  control,
  weight,
  spacing,
  motion,
  zIndex,
  font,
  layout,
} as const

export type FnbBreakpoint = keyof typeof breakpoints

/** camelCase -> kebab-case at the type level, e.g. 'bgAlt' -> 'bg-alt' */
type Kebab<S extends string> = S extends `${infer H}${infer T}`
  ? T extends Uncapitalize<T>
    ? `${Lowercase<H>}${Kebab<T>}`
    : `${Lowercase<H>}-${Kebab<T>}`
  : S

export type FnbTokenName =
  | Kebab<keyof typeof color>
  | 'brand-hover'
  | 'shadow-color'
  | 'radius'
  | `font-${keyof typeof font}`
  | Kebab<keyof typeof layout>
