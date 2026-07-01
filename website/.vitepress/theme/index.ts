import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import FnbUI from 'fnb-ui'
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
