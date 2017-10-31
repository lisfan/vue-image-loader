/**
 * 动画事件相关事件（animationend）的兼容函数
 * 部分安卓机需要使和`webkitAnimationEnd`这样的写法
 *
 * @since 3.0.0
 * @version 1.0.0
 */

/**
 * 绑定动画结束事件
 * @param {Element} $el - 目标dom元素
 * @param {function} handler - 事件句柄
 * @param {function} [useCapture=false] - 是否在捕获或冒泡阶段执行，false=冒泡(默认)，true=捕获
 */
export function addAnimationEnd($el, handler, useCapture = false) {
  $el.addEventListener('webkitAnimationEnd', handler, useCapture)
  $el.addEventListener('animationend', handler, useCapture)
}

/**
 * 移除动画结束事件
 * @param {Element} $el - 目标dom元素
 * @param {function} handler - 事件句柄
 * @param {function} [useCapture=false] - 是否在捕获或冒泡阶段执行，false=冒泡(默认)，true=捕获
 */
export function removeAnimationEnd($el, handler, useCapture = false) {
  $el.removeEventListener('webkitAnimationEnd', handler, useCapture)
  $el.removeEventListener('animationend', handler, useCapture)
}
