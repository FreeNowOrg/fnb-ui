import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import FnbUI from '@fnb-ui/vue'
// Preview against source directly, matching the '@fnb-ui/vue' alias in
// config.ts — no build step needed to see style changes in the docs site.
import '../../../packages/core/src/styles/index.css'
import Layout from './Layout.vue'

const theme: Theme = {
  extends: DefaultTheme,
  // Wrap the whole site in FnbProvider so demos can call useMessage/useDialog.
  Layout,
  enhanceApp({ app }) {
    app.use(FnbUI)
  },
}

export default theme
