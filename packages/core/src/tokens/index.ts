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
  w1: { border: '2px', shadow: '2px' },
  w2: { border: '2px', shadow: '3px' },
  w3: { border: '3px', shadow: '4px' },
  w4: { border: '3px', shadow: '6px' },
} as const

/**
 * State layer: a translucent wash painted OVER whatever background a control
 * already carries, so one pair of values covers every variant — default,
 * primary, danger, and any background a consumer sets themselves.
 *
 * It is the non-geometric half of the interaction ladder. Motion alone cannot
 * carry a state: `prefers-reduced-motion` switches the press off, and a
 * transform is invisible to anyone who cannot perceive the movement. The wash
 * always remains.
 *
 * Components apply it through `background-image`, never `background-color`, so
 * it composites on top instead of replacing the base fill. Never clear it to
 * `none` in another state's rule — doing so makes the luminance ladder
 * non-monotonic (hover darkens, then focus brightens again), which reads as
 * the control lighting up when you press it.
 */
export const state = {
  hover: 'rgb(0 0 0 / 0.09)',
  active: 'rgb(0 0 0 / 0.18)',
} as const

/** On dark ground the wash inverts: the same gesture must still darken→lighten
 *  consistently relative to its own surface. */
export const stateDark = {
  hover: 'rgb(255 255 255 / 0.11)',
  active: 'rgb(255 255 255 / 0.2)',
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
  /* The page grid is part of the design language, not decoration. Both
     first-party apps draw it at 72px; keep them in step by changing it here. */
  gridSize: '72px',
} as const

/**
 * Breakpoints are NOT emitted as CSS variables: `@media (min-width: var(--x))`
 * silently fails — no error, the query just never matches — and
 * `@custom-media` is not usable yet. Never "simplify" these into tokens.css.
 *
 * They are not emitted into any stylesheet at all. This constant is the only
 * published form: TS consumers (useMediaQuery and friends) import it, and any
 * @media rule inside the library hard-codes the literal px value that matches
 * it. There is no SCSS layer left in this repo to hold the other half.
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
  state,
  stateDark,
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
  | `state-${keyof typeof state}`
  | `font-${keyof typeof font}`
  | Kebab<keyof typeof layout>
