import type { InjectionKey } from 'vue'

export type FnbMessageType = 'info' | 'success' | 'warning' | 'error'

export interface FnbMessageOptions {
  // Auto-dismiss delay in ms (default 3000).
  duration?: number
}

export interface FnbMessageHandle {
  destroy: () => void
}

export type FnbMessageApi = {
  [K in FnbMessageType]: (
    content: string,
    options?: FnbMessageOptions
  ) => FnbMessageHandle
}

export const fnbMessageKey: InjectionKey<FnbMessageApi> = Symbol('fnb-message')
