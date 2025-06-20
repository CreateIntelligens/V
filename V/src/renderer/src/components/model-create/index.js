import { createApp } from 'vue'
import TDesign from 'tdesign-vue-next'
import ModelCreateView from './ModelCreateView.vue'
import i18n from "@renderer/i18n/index.js";
export { default as ModalBox } from './ModalBox.vue'
export { default as ModalBoxUpload } from './ModalBoxUpload.vue'

// 组件式调用
export { ModelCreateView }

//命令式调用
export const createModel = (props = {}) => {
  const rootNode = document.createElement('div')
  document.body.appendChild(rootNode)

  return new Promise((resolve) => {
    const options = {
      ...props,
      visible: true,
      onClose(result) {
        resolve(result)
      },
      onClosed: () => {
        app.unmount()
        document.body.removeChild(rootNode)
      }
    }

    const app = createApp(ModelCreateView, options).use(TDesign).use(i18n)
    app.mount(rootNode)
  })
}
