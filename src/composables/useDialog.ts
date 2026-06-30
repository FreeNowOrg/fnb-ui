import { inject } from 'vue'
import { fnbDialogKey } from '../providers/dialog-context'
import type { FnbDialogApi } from '../providers/dialog-context'

export function useDialog(): FnbDialogApi {
  const api = inject(fnbDialogKey, null)
  if (!api) {
    throw new Error(
      '[fnb-ui] useDialog() requires an outer <FnbDialogProvider>'
    )
  }
  return api
}
