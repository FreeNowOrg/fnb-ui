import './styles/index.scss'
import type { App, Component, Plugin } from 'vue'
import FnbAlert from './components/FnbAlert.vue'
import FnbButton from './components/FnbButton.vue'
import FnbCard from './components/FnbCard.vue'
import FnbEllipsis from './components/FnbEllipsis.vue'
import FnbFloatButton from './components/FnbFloatButton.vue'
import FnbIcon from './components/FnbIcon.vue'
import FnbImage from './components/FnbImage.vue'
import FnbInput from './components/FnbInput.vue'
import FnbProgress from './components/FnbProgress.vue'
import FnbResult from './components/FnbResult.vue'
import FnbScrollbar from './components/FnbScrollbar.vue'
import FnbSkeleton from './components/FnbSkeleton.vue'
import FnbSpin from './components/FnbSpin.vue'
import FnbTable from './components/FnbTable.vue'
import FnbTag from './components/FnbTag.vue'

export {
  FnbAlert,
  FnbButton,
  FnbCard,
  FnbEllipsis,
  FnbFloatButton,
  FnbIcon,
  FnbImage,
  FnbInput,
  FnbProgress,
  FnbResult,
  FnbScrollbar,
  FnbSkeleton,
  FnbSpin,
  FnbTable,
  FnbTag,
}

const components: Record<string, Component> = {
  FnbAlert,
  FnbButton,
  FnbCard,
  FnbEllipsis,
  FnbFloatButton,
  FnbIcon,
  FnbImage,
  FnbInput,
  FnbProgress,
  FnbResult,
  FnbScrollbar,
  FnbSkeleton,
  FnbSpin,
  FnbTable,
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
