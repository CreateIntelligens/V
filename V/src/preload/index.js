import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { exposeWebHandles } from '../main/handlers/index'

// Custom APIs for renderer

const client = exposeWebHandles(electronAPI)

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('client', client)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.client = client
}
