import type { ComputedRef, InjectionKey } from 'vue'

export type FnbThemeOverrides = Record<string, string>

export interface FnbConfigContext {
  themeOverrides: ComputedRef<FnbThemeOverrides>
  dark: ComputedRef<boolean>
}

export const fnbConfigKey: InjectionKey<FnbConfigContext> = Symbol('fnb-config')
