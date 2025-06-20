import { createApp } from 'vue'
import { createPinia } from 'pinia'
import TDesign from 'tdesign-vue-next'
import 'tdesign-vue-next/es/style/index.css'

import App from './App.vue'
import router from './router'
import i18n from './i18n'

// 創建應用實例
const app = createApp(App)

// 使用插件
app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(TDesign)

// 掛載應用
app.mount('#app')
