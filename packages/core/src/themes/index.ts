import type { FnbTokenName } from '../tokens'

/** Only real token names are accepted; typos fail at compile time. */
export type FnbThemeOverrides = Partial<Record<FnbTokenName, string>>

// Both projects share the same palette structure; only brand and the
// brand-tinted background differ. Everything else derives or is shared.
export const pixivTheme: FnbThemeOverrides = {
  brand: '#4993ff',
  bg: '#eef2ff',
}

export const picaTheme: FnbThemeOverrides = {
  brand: '#ff5c8a',
  bg: '#fff0f3',
}
