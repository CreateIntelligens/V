import { createI18n } from 'vue-i18n'
import en from './config/en'
import zh from './config/zh'
import { createPinia } from 'pinia'
import { useHomeStore } from "@renderer/stores/home.js";
const pinia = createPinia()
const home = useHomeStore(pinia);

//引入的不同语言文件
const messages = {
  en, zh
}
//这个类型可以自己配置，毕竟每个人做的都不一样
const i18n = createI18n({
  legacy: false,         // 使用 Composition API 模式，则需要将其设置为false
  globalInjection: true, //全局生效$t
  //locale: getQueryString('lang') || (localStorage.getItem('local') || "en"),          // 默认cn翻译
  locale: home.homeState.language,
  messages
})
export default i18n;
