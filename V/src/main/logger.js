const log = require('electron-log')

// 统一配置
// const isDev = process.env.NODE_ENV === 'development'

// 开发环境显示 debug，生产环境只显示 info 以上
// const defaultLevel = isDev ? 'debug' : 'info'
const defaultLevel = 'debug'

// 统一配置日志级别
Object.keys(log.transports).forEach((transport) => {
  if (log.transports[transport].level) {
    log.transports[transport].level = defaultLevel
  }
})

// 可选：自定义日志格式
log.transports.file.format = '{y}-{m}-{d} {h}:{i}:{s} [{level}] {text}'
log.transports.console.format = '[{level}] {text}'

// 设置日志文件大小上限（字节）
log.transports.file.maxSize = 2 * 1024 * 1024 // 2M

// 设置日志文件备份数量
log.transports.file.maxFiles = 5

// 导出配置好的日志实例
export default log
