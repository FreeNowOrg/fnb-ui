import './styles/index.scss'
import type { App, Component, Plugin } from 'vue'
import FnbButton from './components/FnbButton.vue'
import FnbCard from './components/FnbCard.vue'
import FnbIcon from './components/FnbIcon.vue'
import FnbInput from './components/FnbInput.vue'
import FnbProgress from './components/FnbProgress.vue'
import FnbScrollbar from './components/FnbScrollbar.vue'
import FnbTag from './components/FnbTag.vue'

export {
  FnbButton,
  FnbCard,
  FnbIcon,
  FnbInput,
  FnbProgress,
  FnbScrollbar,
  FnbTag,
}

const components: Record<string, Component> = {
  FnbButton,
  FnbCard,
  FnbIcon,
  FnbInput,
  FnbProgress,
  FnbScrollbar,
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
