import './styles/index.scss'
import type { App, Plugin } from 'vue'
import FnbButton from './components/FnbButton.vue'

export { FnbButton }

const components: Record<string, Plugin | unknown> = { FnbButton }

const FnbUI: Plugin = {
  install(app: App) {
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component as never)
    }
  },
}

export const version = import.meta.env.__VERSION__
export default FnbUI
