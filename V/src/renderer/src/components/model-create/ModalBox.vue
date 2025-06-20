<template>
  <div class="form">
    <!-- 模特名称 -->
    <div class="form-item --name">
      <span class="label required">{{ $t('common.modelCreateView.avatarNameText') }}</span>
      <t-input
        class="value"
        v-model="form.name"
        :placeholder="$t('common.input.avatarNamePlaceholder')"
      />
    </div>

    <!-- 上传文件 -->
    <div class="form-item --upload">
      <ModalBoxUpload class="invoke" v-model="form.uploadInfo" />
      <ModalBoxGuide class="guide" />
    </div>
  </div>
</template>
<script setup>
import ModalBoxUpload from './ModalBoxUpload.vue'
import ModalBoxGuide from './ModalBoxGuide.vue'

const form = defineModel({ uploadInfo: {}, name: '' })
</script>
<style lang="less" scoped>
.form {
  &-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;

    &:not(:last-child) {
      margin-bottom: 26px;
    }

    .label,
    .value {
      white-space: nowrap;
    }

    .label.required::before {
      content: '*';
      color: #eb5757;
      font-size: 12px;
      display: inline-block;
      margin-right: 2px;
    }

    :deep(.t-input) {
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: none;
      font-size: 12px;
      color: #ffffff;
    }

    &.--name {
      width: 37%;
      --td-text-color-placeholder: rgba(255, 255, 255, 0.6);
    }

    &.--upload {
      align-items: stretch;
      height: 436px;
      gap: 40px;

      .invoke {
        flex: 5.6;
        overflow: hidden;
      }

      .guide {
        flex: 4.4;
      }
    }
  }
}
</style>
