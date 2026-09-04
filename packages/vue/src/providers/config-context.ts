import type { ComputedRef, InjectionKey } from 'vue'
import type { FnbThemeOverrides } from '@fnb-ui/core'

export type { FnbThemeOverrides }

export interface FnbConfigContext {
  themeOverrides: ComputedRef<FnbThemeOverrides>
  dark: ComputedRef<boolean>
}

export const fnbConfigKey: InjectionKey<FnbConfigContext> = Symbol('fnb-config')
