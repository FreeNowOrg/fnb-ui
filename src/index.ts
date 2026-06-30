import './styles/index.scss'
import type { App, Component, Plugin } from 'vue'
import FnbButton from './components/FnbButton.vue'
import FnbCard from './components/FnbCard.vue'
import FnbIcon from './components/FnbIcon.vue'

export { FnbButton, FnbCard, FnbIcon }

const components: Record<string, Component> = { FnbButton, FnbCard, FnbIcon }

const FnbUI: Plugin = {
  install(app: App) {
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component)
    }
  },
}

export const version = import.meta.env.__VERSION__
export default FnbUI
