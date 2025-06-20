import { defineStore } from 'pinia'
import { useAppStore } from './app'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: {},
    token: ''
  }),
  getters: {
    isLogined: (state) => !!state.token && state.userInfo?.id
  },
  actions: {
    setToken(token) {
      //已自动持久化
      this.token = token
    },
    setUserInfo(userInfo) {
      this.userInfo = userInfo
    },
    logout() {
      this.token = ''
      this.userInfo = {}
    },
    async loginGuard() {
      if (this.isLogined) {
        return this.userInfo
      } else {
        const appStore = useAppStore()
        await appStore.loginApp()
        if (this.isLogined) {
          return this.userInfo
        } else {
          throw new Error('登录失败')
        }
      }
    }
  }
})
