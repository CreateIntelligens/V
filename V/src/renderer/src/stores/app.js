import { defineStore } from 'pinia'

let loginedResolve = () => {}

export const useAppStore = defineStore('app', {
  state: () => ({
    showAppLogin: false
  }),
  actions: {
    setShowAppLogin(show) {
      this.showAppLogin = show
      if (!show) loginedResolve()
    },
    async loginApp() {
      return new Promise((resolve) => {
        this.setShowAppLogin(true)
        loginedResolve = resolve
      })
    }
  }
})
