/**
 * 画廊全屏查看的缩放和拖拽功能
 */

/**
 * 放大图片
 * @param {Ref} imageScaleRef - 图片缩放比例的响应式引用
 * @param {number} maxScale - 最大缩放比例
 * @param {number} step - 缩放步长
 */
export function zoomIn(imageScaleRef, maxScale = 3, step = 0.25) {
  if (imageScaleRef.value < maxScale) {
    imageScaleRef.value = Math.min(maxScale, imageScaleRef.value + step)
  }
}

/**
 * 缩小图片
 * @param {Ref} imageScaleRef - 图片缩放比例的响应式引用
 * @param {Ref} imagePositionRef - 图片位置的响应式引用
 * @param {number} minScale - 最小缩放比例
 * @param {number} step - 缩放步长
 */
export function zoomOut(imageScaleRef, imagePositionRef, minScale = 0.5, step = 0.25) {
  if (imageScaleRef.value > minScale) {
    imageScaleRef.value = Math.max(minScale, imageScaleRef.value - step)
    if (imageScaleRef.value <= 1) {
      imagePositionRef.value = { x: 0, y: 0 }
    }
  }
}

/**
 * 重置缩放和位置
 * @param {Ref} imageScaleRef - 图片缩放比例的响应式引用
 * @param {Ref} imagePositionRef - 图片位置的响应式引用
 */
export function resetZoom(imageScaleRef, imagePositionRef) {
  imageScaleRef.value = 1
  imagePositionRef.value = { x: 0, y: 0 }
}

/**
 * 处理滚轮缩放
 * @param {WheelEvent} event - 滚轮事件
 * @param {Ref} imageScaleRef - 图片缩放比例的响应式引用
 * @param {Ref} imagePositionRef - 图片位置的响应式引用
 * @param {number} minScale - 最小缩放比例
 * @param {number} maxScale - 最大缩放比例
 * @param {number} step - 缩放步长
 */
export function handleWheel(event, imageScaleRef, imagePositionRef, minScale = 0.5, maxScale = 3, step = 0.1) {
  const delta = event.deltaY > 0 ? -step : step
  const newScale = Math.max(minScale, Math.min(maxScale, imageScaleRef.value + delta))
  imageScaleRef.value = newScale
  
  if (newScale <= 1) {
    imagePositionRef.value = { x: 0, y: 0 }
  }
}

/**
 * 创建拖拽处理器
 * @returns {Object} 包含拖拽相关方法和状态的对象
 */
export function createDragHandler() {
  const isDragging = ref(false)
  const dragStart = ref({ x: 0, y: 0 })
  const lastPosition = ref({ x: 0, y: 0 })

  /**
   * 开始拖拽
   * @param {Event} event - 鼠标或触摸事件
   * @param {Ref} imageScaleRef - 图片缩放比例
   * @param {Ref} imagePositionRef - 图片位置
   */
  const startDrag = (event, imageScaleRef, imagePositionRef) => {
    if (imageScaleRef.value <= 1) return
    
    isDragging.value = true
    const clientX = event.type === 'touchstart' ? event.touches[0].clientX : event.clientX
    const clientY = event.type === 'touchstart' ? event.touches[0].clientY : event.clientY
    
    dragStart.value = { x: clientX, y: clientY }
    lastPosition.value = { ...imagePositionRef.value }
    
    const onDrag = (e) => {
      if (!isDragging.value) return
      
      const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX
      const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY
      
      const deltaX = clientX - dragStart.value.x
      const deltaY = clientY - dragStart.value.y
      
      imagePositionRef.value = {
        x: lastPosition.value.x + deltaX,
        y: lastPosition.value.y + deltaY
      }
    }

    const stopDrag = () => {
      isDragging.value = false
      document.removeEventListener('mousemove', onDrag)
      document.removeEventListener('mouseup', stopDrag)
      document.removeEventListener('touchmove', onDrag)
      document.removeEventListener('touchend', stopDrag)
    }
    
    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
    document.addEventListener('touchmove', onDrag)
    document.addEventListener('touchend', stopDrag)
  }

  return {
    isDragging,
    dragStart,
    lastPosition,
    startDrag
  }
}
