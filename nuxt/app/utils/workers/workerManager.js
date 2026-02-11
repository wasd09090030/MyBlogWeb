/**
 * Worker 生命周期管理器
 * 负责 Worker 实例创建、任务队列、错误处理和优雅降级
 */

// 全局 Worker 实例缓存
const workerInstances = new Map()
let taskIdCounter = 0

/**
 * 检测浏览器是否支持 Web Workers
 */
export function isWorkerSupported() {
  return typeof Worker !== 'undefined'
}

/**
 * 检测是否支持 OffscreenCanvas
 */
export function isOffscreenCanvasSupported() {
  return typeof OffscreenCanvas !== 'undefined'
}

/**
 * 检测是否支持 createImageBitmap
 */
export function isImageBitmapSupported() {
  return typeof createImageBitmap === 'function'
}

/**
 * 生成唯一任务 ID
 */
function generateTaskId() {
  return `task_${++taskIdCounter}_${Date.now()}`
}

/**
 * 创建 Worker 包装器
 * @param {string} name - Worker 名称（用于缓存和日志）
 * @param {Function} workerFactory - 创建 Worker 实例的工厂函数
 * @param {Object} options - 配置选项
 * @param {number} options.timeout - 任务超时时间（毫秒，默认 30000）
 * @param {boolean} options.singleton - 是否使用单例模式（默认 true）
 * @param {number} options.maxRetries - 最大重试次数（默认 1）
 * @returns {Object} Worker 管理实例
 */
export function createWorkerManager(name, workerFactory, options = {}) {
  const {
    timeout = 30000,
    singleton = true,
    maxRetries = 1
  } = options

  // 等待中的任务
  const pendingTasks = new Map()
  // 进度回调
  const progressCallbacks = new Map()
  let worker = null
  let isTerminated = false

  /**
   * 获取或创建 Worker 实例
   */
  function getWorker() {
    if (isTerminated) return null

    // 单例模式：复用现有实例
    if (singleton && workerInstances.has(name)) {
      return workerInstances.get(name)
    }

    try {
      worker = workerFactory()

      worker.onmessage = handleMessage
      worker.onerror = handleError

      if (singleton) {
        workerInstances.set(name, worker)
      }

      console.log(`[WorkerManager] ${name} Worker 已创建`)
      return worker
    } catch (err) {
      console.error(`[WorkerManager] ${name} Worker 创建失败:`, err)
      return null
    }
  }

  /**
   * 处理 Worker 消息
   */
  function handleMessage(event) {
    const { taskId, type, data, error: taskError } = event.data

    if (type === 'progress') {
      const progressCb = progressCallbacks.get(taskId)
      if (progressCb) {
        progressCb(data)
      }
      return
    }

    const task = pendingTasks.get(taskId)
    if (!task) return

    clearTimeout(task.timer)
    pendingTasks.delete(taskId)
    progressCallbacks.delete(taskId)

    if (type === 'error') {
      task.reject(new Error(taskError || 'Worker 任务执行失败'))
    } else {
      task.resolve(data)
    }
  }

  /**
   * 处理 Worker 错误
   */
  function handleError(event) {
    console.error(`[WorkerManager] ${name} Worker 错误:`, event.message)

    // 拒绝所有等待中的任务
    for (const [taskId, task] of pendingTasks) {
      clearTimeout(task.timer)
      task.reject(new Error(`Worker 错误: ${event.message}`))
    }
    pendingTasks.clear()
    progressCallbacks.clear()

    // 移除失败的 Worker 实例以便下次重新创建
    if (singleton) {
      workerInstances.delete(name)
    }
    worker = null
  }

  /**
   * 发送任务到 Worker
   * @param {string} action - 动作名称
   * @param {*} payload - 任务数据
   * @param {Object} taskOptions - 任务选项
   * @param {Function} taskOptions.onProgress - 进度回调
   * @param {number} taskOptions.timeout - 自定义超时
   * @param {Array} taskOptions.transferables - Transferable 对象列表
   * @returns {Promise<*>} 任务结果
   */
  function postTask(action, payload = {}, taskOptions = {}) {
    return new Promise((resolve, reject) => {
      const w = getWorker()
      if (!w) {
        reject(new Error(`Worker "${name}" 不可用`))
        return
      }

      const taskId = generateTaskId()
      const taskTimeout = taskOptions.timeout || timeout

      // 设置超时
      const timer = setTimeout(() => {
        pendingTasks.delete(taskId)
        progressCallbacks.delete(taskId)
        reject(new Error(`Worker 任务超时 (${taskTimeout}ms): ${action}`))
      }, taskTimeout)

      // 注册任务
      pendingTasks.set(taskId, { resolve, reject, timer, action })

      // 注册进度回调
      if (taskOptions.onProgress) {
        progressCallbacks.set(taskId, taskOptions.onProgress)
      }

      // 发送消息
      const message = { taskId, action, ...payload }
      if (taskOptions.transferables) {
        w.postMessage(message, taskOptions.transferables)
      } else {
        w.postMessage(message)
      }
    })
  }

  /**
   * 带降级的任务执行
   * @param {string} action - 动作名称
   * @param {*} payload - 任务数据
   * @param {Function} fallback - 降级函数（Worker 不可用时执行）
   * @param {Object} taskOptions - 任务选项
   * @returns {Promise<*>}
   */
  async function postTaskWithFallback(action, payload, fallback, taskOptions = {}) {
    if (!isWorkerSupported() || isTerminated) {
      console.log(`[WorkerManager] ${name} Worker 不可用，使用主线程降级`)
      return fallback()
    }

    let retries = 0
    while (retries <= maxRetries) {
      try {
        return await postTask(action, payload, taskOptions)
      } catch (err) {
        retries++
        if (retries > maxRetries) {
          console.warn(`[WorkerManager] ${name} Worker 任务失败 (${retries}次)，降级到主线程:`, err.message)
          return fallback()
        }
        console.warn(`[WorkerManager] ${name} Worker 任务重试 ${retries}/${maxRetries}:`, err.message)
      }
    }
  }

  /**
   * 终止 Worker
   */
  function terminate() {
    isTerminated = true

    // 拒绝所有等待中的任务
    for (const [, task] of pendingTasks) {
      clearTimeout(task.timer)
      task.reject(new Error('Worker 已终止'))
    }
    pendingTasks.clear()
    progressCallbacks.clear()

    if (worker) {
      worker.terminate()
      worker = null
    }

    if (singleton) {
      workerInstances.delete(name)
    }

    console.log(`[WorkerManager] ${name} Worker 已终止`)
  }

  /**
   * 获取等待中的任务数量
   */
  function getPendingCount() {
    return pendingTasks.size
  }

  /**
   * 检查 Worker 是否可用
   */
  function isAvailable() {
    return isWorkerSupported() && !isTerminated
  }

  return {
    postTask,
    postTaskWithFallback,
    terminate,
    getPendingCount,
    isAvailable,
    get name() { return name }
  }
}

/**
 * 终止所有 Worker 实例（应用销毁时调用）
 */
export function terminateAllWorkers() {
  for (const [name, worker] of workerInstances) {
    try {
      worker.terminate()
      console.log(`[WorkerManager] ${name} Worker 已终止`)
    } catch (e) {
      // ignore
    }
  }
  workerInstances.clear()
}
