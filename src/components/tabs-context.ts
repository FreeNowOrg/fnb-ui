import type { ComputedRef, InjectionKey, Slot } from 'vue'

export interface FnbTabPaneInfo {
  name: string
  tab?: string
  // Optional rich nav label (the FnbTabPane's `#tab` slot).
  tabSlot?: Slot
}

export interface FnbTabsContext {
  activeName: ComputedRef<string | undefined>
  registerPane: (pane: FnbTabPaneInfo) => void
  unregisterPane: (name: string) => void
}

export const fnbTabsKey: InjectionKey<FnbTabsContext> = Symbol('fnb-tabs')
