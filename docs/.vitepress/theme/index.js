// docs/.vitepress/theme/index.js
import DefaultTheme from 'vitepress/theme'
import './custom.css'
import './custom-scripts.js'

export default {
    ...DefaultTheme,
    // 你可以在這裡擴展 Layout 或其他元件
    // Layout: () => { ... }
}