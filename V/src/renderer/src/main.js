import './assets/main.css'
import TDesign from 'tdesign-vue-next'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import i18n from "./i18n/index.js";
// 引入组件库的少量全局样式变量
import 'tdesign-vue-next/es/style/index.css'

createApp(App).use(router).use(createPinia()).use(TDesign).use(i18n).mount('#app')
