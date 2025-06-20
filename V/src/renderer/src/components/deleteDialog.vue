<template>
  <div class="video-dialog-box">
    <t-dialog
      :width="480"
      v-model:visible="showDialog"
      top="10vh"
      placement="center"
      :closeOnOverlayClick="false"
      :on-close="cancelUpload"
    >
      <template #footer>
        <div class="btn-box">
          <t-button class="cancel" variant="outline" theme="default" @click="cancelUpload">{{
            $t('common.deleteDialog.buttonTextLeft')
          }}</t-button>
          <t-button class="ok" theme="primary" @click="okFun">{{
            $t('common.deleteDialog.buttonTextRight')
          }}</t-button>
        </div>
      </template>
      <div class="delete-content-box">
        <div class="delete-content">
          <div class="title-h1">{{ $t('common.deleteDialog.titleH1') }}</div>
          <img src="../assets/images/home/warning.svg" />
          <div class="title-ok">{{ $t('common.deleteDialog.titleOk') }}</div>
          <div class="title-text">{{ $t('common.deleteDialog.titleText') }}</div>
        </div>
      </div>
    </t-dialog>
  </div>
</template>
<script setup>
import { ref } from 'vue'
const emit = defineEmits(['cancel', 'ok'])
const showDialog = ref(false)
const cancelUpload = () => {
  showDialog.value = false
  emit('cancel')
}
const showDialogFun = () => {
  showDialog.value = true
}
const okFun = () => {
  showDialog.value = false
  emit('ok')
}
defineExpose({
  showDialogFun
})
</script>
<style lang="less" scoped>
.delete-content-box {
  width: 100%;
  .delete-content {
    .title-h1 {
      text-align: center;
      font-family: PingFang SC, PingFang SC;
      font-weight: 500;
      font-size: 20px;
      color: #33353b;
      line-height: 23px;
    }
    .title-ok {
      font-family: PingFang SC, PingFang SC;
      font-weight: 600;
      font-size: 14px;
      text-align: center;
      color: #303133;
      line-height: 22px;
    }
    .title-text {
      font-family: PingFang SC, PingFang SC;
      font-weight: 400;
      font-size: 14px;
      color: #696f7a;
      line-height: 22px;
      text-align: center;
    }
    img {
      width: 48px;
      height: 48px;
      display: block;
      margin: 20px auto 16px;
    }
  }
}
.btn-box {
  display: flex;
  justify-content: center;
  .cancel {
    margin-right: 26px;
    width: 98px;
    color: #9097a5;
    border-color: #9097a5;
    font-family: PingFang SC, PingFang SC;
    font-weight: 500;
    font-size: 12px;
  }
  .ok {
    width: 98px;
    color: #fff;
    background-color: #434af9;
    font-family: PingFang SC, PingFang SC;
    font-weight: 500;
    font-size: 12px;
  }
}
</style>
