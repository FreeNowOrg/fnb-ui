import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import FnbUI from '@fnb-ui/vue'
// Preview against source directly, matching the '@fnb-ui/vue' alias in
// config.ts — no build step needed to see style changes in the docs site.
import '../../../packages/core/src/styles/index.css'
// Docs chrome rebuilt on the same tokens — the site is its own showcase.
import './fnb-theme.css'
import Layout from './Layout.vue'
import FnbHome from './FnbHome.vue'

const theme: Theme = {
  extends: DefaultTheme,
  // Wrap the whole site in FnbProvider so demos can call useMessage/useDialog.
  Layout,
  enhanceApp({ app }) {
    app.use(FnbUI)
    app.component('FnbHome', FnbHome)
  },
}

export default theme
