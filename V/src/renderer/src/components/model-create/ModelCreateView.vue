<template>
  <div class="modal">
    <t-dialog
      v-model:visible="state.show"
      @close="action.close(false)"
      @closed="onClosed"
      :header="$t('common.modelCreateView.headerTitle')"
      :closeOnEscKeydown="false"
      :closeOnOverlayClick="false"
    >
      <ModalBox class="modal-box" v-model="state.form" />
      <template #footer>
        <t-button @click="action.submit" :loading="state.loading.submit">{{
          $t('common.modelCreateView.submitButtonText')
        }}</t-button>
      </template>
    </t-dialog>
  </div>
  <ModalFinished ref="modalFinished" />
</template>
<script setup>
import { reactive, watchEffect, ref } from 'vue'
import ModalBox from './ModalBox.vue'
import ModalFinished from '../ModalFinished.vue'
import { isBoolean, isObject } from 'lodash-es'
import { addModel } from '@renderer/api'
import { MessagePlugin } from 'tdesign-vue-next'
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  onClose: {
    type: Function,
    default: () => {}
  },
  onClosed: {
    type: Function,
    default: () => {}
  }
})

const modalFinished = ref(null)

const state = reactive({
  show: false,
  loading: {
    submit: false
  },
  form: {
    uploadInfo: {
      videoPath: ''
    },
    name: ''
  }
})

watchEffect(() => {
  state.show = props.visible
})

const action = {
  check() {
    const { name, uploadInfo } = state.form
    if (!name) {
      MessagePlugin.error('请输入模特名称')
      return false
    }
    if (!uploadInfo.videoPath) {
      MessagePlugin.error('请上传拍摄好的原始视频')
      return false
    }
    return true
  },
  async submit() {
    if (!action.check()) return
    state.loading.submit = true
    const { name, uploadInfo } = state.form
    try {
      const isOK = await addModel({
        name,
        videoPath: uploadInfo.videoPath
      })
      if (isOK) {
        const isToSee = await modalFinished.value.show()
        action.close({ isSubmitOK: true, isSubmitOK_toSee: isToSee })
      } else {
        throw new Error('制作失败~')
      }
    } catch (err) {
      MessagePlugin.error(err.toString() || '制作失败~')
    } finally {
      state.loading.submit = false
    }
  },
  close(params = false) {
    const result = {
      isSubmitOK: false,
      isSubmitOK_toSee: false
    }
    if (isBoolean(params)) {
      result.isSubmitOK = params
    } else if (isObject(params)) {
      Object.assign(result, params)
    }
    state.show = false
    props.onClose(result)
  }
}
</script>
<style lang="less" scoped>
.modal {
  --td-text-color-primary: #ffffff;
  --td-bg-color-specialcomponent: #1d1e20;
  --td-bg-color-secondarycontainer: #161718;

  :deep(.t-dialog__position) {
    align-items: center;
    padding: 0;
  }

  :deep(.t-dialog) {
    padding: 0;
    width: 75vw;
    max-width: 1080px;
    overflow: hidden;
    max-height: 86vh;
    background: #1d1e20;
    box-shadow: 0px 4px 16px 0px rgba(0, 0, 0, 0.25);
    border-radius: 4px 4px 4px 4px;
    border: 1px solid #3f4041;
    color: #ffffff;
    display: flex;
    flex-direction: column;
  }

  :deep(.t-dialog__header) {
    padding: 16px;
    font-weight: 500;
    font-size: 14px;
    color: #ffffff;
    line-height: 16px;
  }

  :deep(.t-dialog__close) {
    color: #ffffff;

    &:hover {
      background-color: #373739;
    }
  }

  :deep(.t-dialog__body) {
    padding: 20px 40px;
    color: #ffffff;
  }

  :deep(.t-dialog__footer) {
    padding: 24px 40px;
    border-top: 1px solid #000000;
  }
}
</style>
