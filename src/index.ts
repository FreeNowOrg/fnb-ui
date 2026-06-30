import './styles/index.scss'
import type { App, Component, Plugin } from 'vue'
import FnbAlert from './components/FnbAlert.vue'
import FnbButton from './components/FnbButton.vue'
import FnbCard from './components/FnbCard.vue'
import FnbConfigProvider from './providers/FnbConfigProvider.vue'
import FnbEllipsis from './components/FnbEllipsis.vue'
import FnbFloatButton from './components/FnbFloatButton.vue'
import FnbIcon from './components/FnbIcon.vue'
import FnbImage from './components/FnbImage.vue'
import FnbInput from './components/FnbInput.vue'
import FnbMessageProvider from './providers/FnbMessageProvider.vue'
import FnbPagination from './components/FnbPagination.vue'
import FnbProgress from './components/FnbProgress.vue'
import FnbResult from './components/FnbResult.vue'
import FnbScrollbar from './components/FnbScrollbar.vue'
import FnbSelect from './components/FnbSelect.vue'
import FnbSkeleton from './components/FnbSkeleton.vue'
import FnbSpin from './components/FnbSpin.vue'
import FnbTable from './components/FnbTable.vue'
import FnbTabPane from './components/FnbTabPane.vue'
import FnbTabs from './components/FnbTabs.vue'
import FnbTag from './components/FnbTag.vue'

export {
  FnbAlert,
  FnbButton,
  FnbCard,
  FnbConfigProvider,
  FnbEllipsis,
  FnbFloatButton,
  FnbIcon,
  FnbImage,
  FnbInput,
  FnbMessageProvider,
  FnbPagination,
  FnbProgress,
  FnbResult,
  FnbScrollbar,
  FnbSelect,
  FnbSkeleton,
  FnbSpin,
  FnbTable,
  FnbTabPane,
  FnbTabs,
  FnbTag,
}

export { useMessage } from './composables/useMessage'

export type { FnbTabPaneInfo, FnbTabsContext } from './components/tabs-context'
export type {
  FnbThemeOverrides,
  FnbConfigContext,
} from './providers/config-context'
export type {
  FnbMessageApi,
  FnbMessageType,
  FnbMessageOptions,
  FnbMessageHandle,
} from './providers/message-context'

const components: Record<string, Component> = {
  FnbAlert,
  FnbButton,
  FnbCard,
  FnbConfigProvider,
  FnbEllipsis,
  FnbFloatButton,
  FnbIcon,
  FnbImage,
  FnbInput,
  FnbMessageProvider,
  FnbPagination,
  FnbProgress,
  FnbResult,
  FnbScrollbar,
  FnbSelect,
  FnbSkeleton,
  FnbSpin,
  FnbTable,
  FnbTabPane,
  FnbTabs,
  FnbTag,
}

const FnbUI: Plugin = {
  install(app: App) {
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component)
    }
  },
}

export const version = import.meta.env.__VERSION__
export default FnbUI
