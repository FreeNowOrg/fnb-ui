import { computed, inject } from 'vue'
import type { ComputedRef, CSSProperties } from 'vue'
import { fnbConfigKey } from './config-context'

/**
 * Teleported content leaves the provider's subtree, so it inherits neither the
 * theme CSS variables nor the `dark` class. Bind both onto the teleported root
 * element. Never solve this by writing to document.documentElement: that breaks
 * provider nesting and does not render on the server.
 */
export function useThemeScope(): {
  themeClass: ComputedRef<Record<string, boolean>>
  themeStyle: ComputedRef<CSSProperties>
} {
  const config = inject(fnbConfigKey, null)
  return {
    themeClass: computed(() => ({ dark: config?.dark.value ?? false })),
    themeStyle: computed(() => config?.cssVars.value ?? {}),
  }
}
