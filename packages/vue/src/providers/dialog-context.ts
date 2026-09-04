import type { InjectionKey } from 'vue'

export interface FnbDialogOptions {
  title: string
  content: string
  positiveText?: string
  negativeText?: string
}

export interface FnbDialogApi {
  confirm: (options: FnbDialogOptions) => Promise<boolean>
}

export const fnbDialogKey: InjectionKey<FnbDialogApi> = Symbol('fnb-dialog')
