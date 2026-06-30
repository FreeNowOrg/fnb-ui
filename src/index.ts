import './styles/index.scss'
import type { App, Component, Plugin } from 'vue'
import FnbButton from './components/FnbButton.vue'
import FnbIcon from './components/FnbIcon.vue'

export { FnbButton, FnbIcon }

const components: Record<string, Component> = { FnbButton, FnbIcon }

const FnbUI: Plugin = {
  install(app: App) {
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component)
    }
  },
}

export const version = import.meta.env.__VERSION__
export default FnbUI
