/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  extends: [
    'eslint:recommended',
    // 'plugin:vue/vue3-recommended',
    '@electron-toolkit',
    // '@vue/eslint-config-prettier'
  ],
  parserOptions: {
    ecmaVersion: 2022, // 或者更高版本
    sourceType: 'module', // 如果你使用 ES 模块
  },
  rules: {
    'no-unused-vars': 'off',
    'vue/require-default-prop': 'off',
    'vue/multi-word-component-names': 'off'
  }
}
