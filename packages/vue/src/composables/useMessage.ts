import { inject } from 'vue'
import { fnbMessageKey } from '../providers/message-context'
import type { FnbMessageApi } from '../providers/message-context'

export function useMessage(): FnbMessageApi {
  const api = inject(fnbMessageKey, null)
  if (!api) {
    throw new Error(
      '[fnb-ui] useMessage() requires an outer <FnbMessageProvider>'
    )
  }
  return api
}
