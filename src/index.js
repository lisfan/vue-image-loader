/**
 * 占位图片加载器
 *
 * @version 1.2.0
 */

import validation from '@~lisfan/validation'
import VueLogger from '@~lisfan/vue-logger'
import { addAnimationEnd, removeAnimationEnd } from './utils/animation-handler'

let ImagePlaceholder = {} // 插件对象
const DIRECTIVE_NAMESPACE = 'image-placeholder' // 指令名称
const PLUGIN_TYPE = 'directive'

const vueLogger = new VueLogger(`${PLUGIN_TYPE}-${DIRECTIVE_NAMESPACE}`)

// 透明图片base64
const PLACEHOLDER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABBJREFUeNpi/P//PwNAgAEACQEC/2m8kPAAAAAASUVORK5CYII='

/**
 * 请求图片资源
 *
 * @param {element} $el - 目标dom元素
 * @param {string} imgSrc - 请求图片地址
 * @param {VNode} vnode - vue 节点实例
 */
function requestImage($el, imgSrc, vnode) {
  // 是否在请求占位图片的步骤，若请求占位图片也失败，则会使用透明图片代替占位
  // 如果动态地址和占位地址相同，则直接认为是在请求占位图片的步骤
  let isRequestPhImage = false
  if (imgSrc === $el.phImageSrc) {
    isRequestPhImage = true
  }

  let $image = new Image()
  let currentImgSrc = imgSrc
  $image.src = currentImgSrc

  // 如果这张图片已下载过，且开启强制动效
  if ($image.complete && !$el.enableForceEffect) {
    $el.imageComplete = true
  } else {
    $el.imageComplete = false
  }

  // 判断dom元素标签名，若为img元素，则设置透明图片占位
  if ($el.nodeName === 'IMG') {
    $el.setAttribute('src', PLACEHOLDER_IMAGE)
  } else {
    $el.style.backgroundImage = 'url("' + PLACEHOLDER_IMAGE + '")'
  }

  // 绑定动画结束事件
  // 是否已开启动画
  if (vnode.context.$$enableAnimate && $el.animationClassName) {
    // 若已绑定则不再重复绑定
    const animationEndHandler = function () {
      const enterEndClassNameList = $el.oriClassNameList.slice()
      enterEndClassNameList.push($el.animationClassName + '-enter-end')
      $el.setAttribute('class', enterEndClassNameList.join(' ').trim())
      removeAnimationEnd($el, animationEndHandler)
    }
    // 绑定动画结束事件
    addAnimationEnd($el, animationEndHandler)
  }

  /**
   * 图片请求成功事件
   */
  const successHandler = function () {
    // 图片分布式加载，不要在同一时间内同时加载
    requestAnimationFrame(() => {
      $image = null // 销毁
      if ($el.nodeName === 'IMG') {
        $el.setAttribute('src', currentImgSrc)
      } else {
        $el.style.backgroundImage = 'url("' + currentImgSrc + '")'
      }

      if (!$el.imageComplete && vnode.context.$$enableAnimate && $el.animationClassName) {
        const enterClassNameList = $el.oriClassNameList.slice()
        enterClassNameList.push($el.animationClassName + '-enter')
        $el.setAttribute('class', enterClassNameList.join(' ').trim())

        // 至于下一事件循环
        Promise.resolve().then(() => {
          const enterActiveClassNameList = $el.oriClassNameList.slice()
          enterActiveClassNameList.push($el.animationClassName + '-enter-active')
          $el.setAttribute('class', enterActiveClassNameList.join(' ').trim())
        })
      }
    })
  }

  /**
   * 图片请求失败事件
   */
  const failHandler = function () {
    // 如果是二次加载图片且又失败
    // 则使用透明图片代替
    if (!isRequestPhImage) {
      currentImgSrc = $el.phImageSrc
      $image.src = currentImgSrc
      isRequestPhImage = true
    } else {
      currentImgSrc = PLACEHOLDER_IMAGE
      $image.src = currentImgSrc
      // $image = null // 销毁
    }

    // 如果这张图片已下载过，且开启强制动效
    if ($image.complete && !$el.enableForceEffect) {
      $el.imageComplete = true
    } else {
      $el.imageComplete = false
    }
  }

  $image.addEventListener('error', failHandler)
  $image.addEventListener('load', successHandler)
}

/**
 * 暴露install钩子，供vue注册
 * @param {Vue} Vue - Vue构造器类
 */
ImagePlaceholder.install = function (Vue) {
  Vue.directive(DIRECTIVE_NAMESPACE, {
    /**
     * 组件绑定
     * @param {Element} $el - 目标dom元素
     * @param {object} binding - 指令对象
     * @param {VNode} vnode - vue节点对象
     */
    bind($el, binding, vnode) {
      vueLogger.log(vnode.context, '组件bind')

      // 在目标节点上绑定该指令标识
      $el.setAttribute(`v-${DIRECTIVE_NAMESPACE}`, '')

      // 设置一些初次绑定保存的数据
      // 保存默认占位图片的值
      $el.phImageSrc = $el.getAttribute('placeholder') || ''
      $el.imageSrc = $el.getAttribute('image-src') || ''

      // 保存原dom元素class类名
      const oriClassName = $el.getAttribute('class') || ''
      $el.oriClassNameList = oriClassName.split(' ')

      // 自定义动画类
      $el.animationClassName = binding.value || ''
      // 是否开启强制动效
      $el.enableForceEffect = binding.modifiers.forceEffect || false

      // 自定义的高宽值
      $el.sizeList = []

      if (binding.arg) {
        $el.sizeList = binding.arg.split('x')
      }

      $el.sizeList = $el.sizeList.slice(0, 2)
      const rootFontRule = document.documentElement.getAttribute('data-rem-rule')

      // 设置目标元素的高度
      if ($el.sizeList.length === 2) {
        $el.style.width = ($el.sizeList[0] / rootFontRule) + 'rem'
        $el.style.height = ($el.sizeList[1] / rootFontRule) + 'rem'
      } else if ($el.sizeList.length === 1) {
        $el.style.width = ($el.sizeList[0] / rootFontRule) + 'rem'
        $el.style.height = ($el.sizeList[0] / rootFontRule) + 'rem'
      }

      if (validation.isEmpty($el.imageSrc)) {
        requestImage($el, $el.phImageSrc, vnode)
      } else {
        // 请求图片
        requestImage($el, $el.imageSrc, vnode)
      }
    },
    /**
     * 值更新
     * @param {Element} $el - 目标dom元素
     * @param {object} binding - 指令对象
     * @param {VNode} vnode - vue节点对象
     */
    update($el, binding, vnode) {
      vueLogger.log(vnode.context, '组件update')

      const newImageSrc = $el.getAttribute('image-src') || ''
      // 当图片地址有变化时，更新
      if ($el.imageSrc !== newImageSrc) {
        // 若强制启用了动效，则每次图片显示，都会执行动效
        $el.imageSrc = newImageSrc
        requestImage($el, $el.imageSrc, vnode)
      }
    }
  })
}

export default ImagePlaceholder
