/**
 * 动画事件（animationend）的浏览器兼容polyfill
 *
 * [因]部分安卓机需要使用`webkitAnimationEnd`这样的写法
 *
 * @version 1.0.0
 */

/**
 * 绑定动画结束事件
 *
 * @ignore
 * @param {Element} $el - 目标dom元素
 * @param {function} handler - 事件处理器
 * @param {function} [useCapture=false] - 是否在捕获或冒泡阶段执行，false=冒泡(默认)，true=捕获
 */
export function addAnimationEnd($el, handler, useCapture = false) {
  $el.addEventListener('webkitAnimationEnd', handler, useCapture)
  $el.addEventListener('animationend', handler, useCapture)
}

/**
 * 移除动画结束事件
 *
 * @ignore
 * @param {Element} $el - 目标dom元素
 * @param {function} handler - 事件处理器
 * @param {function} [useCapture=false] - 是否在捕获或冒泡阶段执行，false=冒泡(默认)，true=捕获
 */
export function removeAnimationEnd($el, handler, useCapture = false) {
  $el.removeEventListener('webkitAnimationEnd', handler, useCapture)
  $el.removeEventListener('animationend', handler, useCapture)
}
