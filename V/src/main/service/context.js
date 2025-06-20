import { ipcMain } from 'electron'
import { insert, findByKey, update as updateContext } from '../dao/context.js'

const MODEL_NAME = 'context'

export function saveContext(key, val) {
  const context = findByKey(key)
  if (context) {
    return updateContext(key, val)
  }
  return insert(key, val)
}

export function getContext(key) {
  return findByKey(key)
}

export function init() {
  ipcMain.handle(MODEL_NAME + '/get', (event, ...args) => {
    return getContext(...args)
  })
  ipcMain.handle(MODEL_NAME + '/save', (event, ...args) => {
    return saveContext(...args)
  })
}
