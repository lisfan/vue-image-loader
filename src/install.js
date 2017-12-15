/**
 * @file vue指令插件-图片加载器
 * @author lisfan <goolisfan@gmail.com>
 * @version 1.2.0
 * @licence MIT
 */

import validation from '@~lisfan/validation'
import ImageLoader from './image-loader'
import ElementShell from './element-shell'
import { addAnimationEnd, removeAnimationEnd } from './utils/animation-handler'

const PLUGIN_TYPE = 'directive'  // 插件类型
const DIRECTIVE_NAMESPACE = 'image-loader' // 指令名称

// 透明图片base64
const PLACEHOLDER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABBJREFUeNpi/P//PwNAgAEACQEC/2m8kPAAAAAASUVORK5CYII='

// 私有方法
const _actions = {
  /**
   * 获取匹配到的占位图片
   *
   * @param {object} binding - 指令对象
   * @param {object} placeholders - 占位图片枚举集合
   *
   * @returns {string}
   */
  getPlaceholderImageSrc(binding, placeholders) {
    let placeholderImage

    Object.keys(binding.modifiers).some((key) => {
      return (placeholderImage = placeholders[key])
    })

    return placeholderImage
  },
  /**
   * 根据dom元素的不同设置图片地址
   *
   * @param {Element} $el - 目标dom元素
   * @param {string} imageSrc - 图片地址
   */
  setImageSrc($el, imageSrc) {
    $el.nodeName === 'IMG'
      ? $el.setAttribute('src', imageSrc)
      : $el.style.backgroundImage = 'url("' + imageSrc + '")'
  },
  /**
   * 请求图片资源
   *
   * @param {Vue} vm - vue实例
   * @param {ElementShell} shell - 元素壳实例
   * @param {string} imageSrc - 请求图片地址
   * @param {boolean} animate - 全局配置，是否进行动效
   */
  requestImage(vm, shell, imageSrc, animate) {
    // 1. 判断是否正在请求**占位图片**的步骤，若请求占位图片也失败，则使用**透明图片**代替占位
    // 2. 如果动态图片地址和占位图片地址相同，则直接认为是在请求占位图片的步骤
    let imageLoader = new ImageLoader({
      debug: shell._vueLogger.$debug
    })

    // 载入图片
    imageLoader.load(imageSrc)

    shell.$currentImgSrc = imageSrc

    // 如果这张图片已下载过，且未开启强制动效，则判断图片已加载完毕，否则将进行动效载入
    shell.$loaded = imageLoader.$complete && !shell.$enableForceEffect

    imageLoader.on('load', _actions.successHandler(vm, shell, animate))
    imageLoader.on('error', _actions.failHandler(vm, shell, imageLoader))
  },
  /**
   * 图片请求成功事件
   *
   * @param {Vue} vm - vue实例
   * @param {ElementShell} shell - 元素壳实例
   * @param {boolean} animate - 全局配置，是否进行动效
   */
  successHandler(vm, shell, animate) {
    return function () {
      clearTimeout(shell.$loadingTimeouter)

      // 设置图片地址
      _actions.setImageSrc(shell.$el, shell.$currentImgSrc)

      if (shell.$currentImgSrc !== shell.$realImageSrc) {
        return
      }

      // 图片请求成功时非真实图片则不进行动画加载，直接替换
      // 性能优化：图片延迟加载，不要在同一时间内同时加载
      requestAnimationFrame(() => {
        shell._vueLogger.log('image load successed:', shell.$currentImgSrc)

        // 图片未加载完毕，且开启了动效，且存在动效名称时，才进行动画
        if (shell.$loaded || !animate || !shell.$animationClassName) {
          return
        }

        // 替换为起始样式
        const enterClassNameList = shell.$originClassNameList.slice()
        enterClassNameList.push(shell.$animationClassName + '-enter')
        shell.$el.setAttribute('class', enterClassNameList.join(' ').trim())

        // 替换为动画样式
        requestAnimationFrame(() => {
          const enterActiveClassNameList = shell.$originClassNameList.slice()
          enterActiveClassNameList.push(shell.$animationClassName + '-enter-active')
          shell.$el.setAttribute('class', enterActiveClassNameList.join(' ').trim())
        })
      })
    }
  },
  /**
   * 图片请求失败事件
   *
   * @param {Vue} vm - vue实例
   * @param {ElementShell} shell - 元素壳实例
   * @param {ImageLoader} imageLoader - 图片加载器实例
   */
  failHandler(vm, shell, ImageLoader) {
    return function () {
      clearTimeout(shell.$loadingTimeouter)

      shell._vueLogger.log('image load faild:', shell.$currentImgSrc)

      // 如果是二次加载图片且又失败
      // 则使用透明图片代替
      shell.$currentImgSrc = shell.$currentImgSrc === shell.$phImageSrc
        ? PLACEHOLDER_IMAGE
        : shell.$phImageSrc

      ImageLoader.load(shell.$currentImgSrc)
    }
  }
}

export default {
  /**
   * 图片加载器注册函数
   *
   * @since 1.2.0
   *
   * @function install
   *
   * @param {Vue} Vue - Vue构造器类
   * @param {object} [options={}] - 配置选项
   * @param {boolean} [options.debug=false] - 是否开启日志调试模式，默认关闭
   * @param {number} [options.remRatio=100] - rem与px的比便关系，默认值为100，表示1rem=100px
   * @param {boolean} [options.animate=true] - 是否启用动效载入，全局性动效开关，比如为了部分机型，可能会关闭动效的展示，默认开启
   * @param {boolean} [options.force=false] - 是否强制开启每次指令绑定或更新进行动效展示，默认关闭：图片只在初次加载成功进行特效载入，之后不进行特效加载。需要同时确保animate是启用true
   * @param {number} [options.loadingDelay=300] - 载入中占位图片的延迟加载时间，避免出现载入中图片瞬间切换为真实图片的闪烁问题
   * @param {string} [options.loadingPlaceholder=''] - 全局配置图片载入中占位图片
   * @param {object} [options.placeholders={}] - 全局配置占位图片，key名会转换为修饰符
   */
  install: function (Vue, {
    debug = false,
    remRatio = 100,
    animate = true,
    force = false,
    loadingDelay = 300,
    loadingPlaceholder = '',
    placeholders = {}
  } = {}) {
    /**
     * vue指令：image-loader
     * 该指令会从元素节点属性上读取两个值：placeholder和image-src
     * - loading-placeholder - 自定义设置了真实图片初始加载过程中的占位图片
     * - src - 读取原始图片值，如果设置了该值，则loading-placeholder将无效（为了应对一些场景而设立）
     * - placeholder -自定义设置了当图片加载失败时，使用该图片占位(优先级高)。若未设定，将读取通过modifiers进行快捷指定的全局配置的占用图片
     * - image-src - 设置了图片'真正'需要加载的图片
     *
     *
     * @since 1.2.0
     *
     * @function image-loader
     *
     * @param {string} [arg=false] - 参数图片宽度尺寸
     * @param {string} [value=false] - 动效样式
     * @param {object} [modifiers] - 修饰符对象，除了force值外，其他值都将当成占位符的快捷指定
     * @param {boolean} [modifiers.force=false] - 是否启用每次指令绑定或更新，重新进行动效展示修饰符
     * @param {boolean} [modifiers.debug=false] - 是否启用单独启用调试日志，该设定优先级低于指令注册时的debug全局配置
     */
    Vue.directive(DIRECTIVE_NAMESPACE, {
      /**
       * 初始化绑定
       *
       * @ignore
       *
       * @param {element} $el - 目标dom元素
       * @param {object} binding - 指令对象
       * @param {VNode} vnode - vue节点对象
       */
      bind($el, binding, vnode) {
        const shell = new ElementShell({
          el: $el,
          name: `${PLUGIN_TYPE}-${DIRECTIVE_NAMESPACE}`,
          debug: binding.debug || debug,
          vm: vnode.context,
        })

        shell._vueLogger.log('emit bind hook!')

        // 在目标节点上绑定该指令标识
        $el.setAttribute(`v-${DIRECTIVE_NAMESPACE}`, '')

        // 在dom实例上绑定一些初次绑定保存的数据
        // - 保存保默认占位图片的值
        // - 若未自定义默认占位图片的值，从修饰符对象中找出第一个匹配中的占位图片
        shell.$phImageSrc = $el.getAttribute('placeholder') || _actions.getPlaceholderImageSrc(binding, placeholders) || ''

        // 获取载入中占位图片地址
        shell.$loadingPhImageSrc = $el.getAttribute('loading-placeholder') || ''

        shell.$originImageSrc = $el.getAttribute('src') || ''

        // 获取真实图片地址
        shell.$realImageSrc = $el.getAttribute('image-src') || ''

        // 判断dom元素标签名，若为img标签元素，则设置透明图片占位，否则设置为该元素的背景
        // 如果未指定src属性的值，则设置使用默认透明图片占位

        _actions.setImageSrc($el, PLACEHOLDER_IMAGE)

        if (validation.isEmpty(shell.$originImageSrc)) {
          shell.$loadingTimeouter = setTimeout(() => {
            _actions.setImageSrc($el, shell.$loadingPhImageSrc || loadingPlaceholder || PLACEHOLDER_IMAGE)
          }, loadingDelay)
        }

        // 暂存原样式类
        const originClassName = $el.getAttribute('class') || ''
        shell.$originClassNameList = originClassName.split(' ')

        // 自定义动画类
        shell.$animationClassName = binding.value || ''

        // 是否强制开启每次载入动效
        // 若未自定义，则取全局配置force
        shell.$enableForceEffect = binding.modifiers.force || force

        // 获取自定义高宽值
        let sizeList = binding.arg
          ? binding.arg.split('x')
          : []

        // 只截取前两个的值
        let [width, height] = sizeList.slice(0, 2)

        // 高不存在时则同样的宽值
        height = height || width

        // 设置目标元素的高宽
        // [注]：他拉伸的是直接的元素高度，不会自适应缩放
        if (width && height) {
          const widthStyle = (width / remRatio ) + 'rem'
          const heightStyle = (height / remRatio ) + 'rem'
          // 减少重绘，注意留空
          $el.style = `width:${widthStyle}; height:${heightStyle}; ` + $el.style
        }

        // 若启用了动效且存在动效样式时
        if (animate && shell.$animationClassName) {
          // 为dom元素绑定动画结束事件
          // 若已绑定则不再重复绑定
          const animationEndHandler = function () {
            const enterEndClassNameList = shell.$originClassNameList.slice()
            enterEndClassNameList.push(shell.$animationClassName + '-enter-end')
            $el.setAttribute('class', enterEndClassNameList.join(' ').trim())

            // 动画结束后移除绑定事件
            removeAnimationEnd($el, animationEndHandler)
          }

          // 为节点绑定动画结束事件
          addAnimationEnd($el, animationEndHandler)
        }

        if (validation.isEmpty(shell.$realImageSrc)) {
          // 若不存在真实图片地址，请求空白图片占位
          shell._vueLogger.log('image src no existed, request placeholder image resource!')
          _actions.requestImage(vnode.context, shell, shell.$phImageSrc, animate)
        } else {
          // 若存在真实图片地址，请求空白图片占位
          shell._vueLogger.log('image src existed, request image resource!')
          _actions.requestImage(vnode.context, shell, shell.$realImageSrc, animate)
        }
      },
      /**
       * 值进行了更新
       *
       * @ignore
       *
       * @param {element} $el - 目标dom元素
       * @param {object} binding - 指令对象
       * @param {VNode} vnode - vue节点对象
       */
      update($el, binding, vnode) {
        const shell = new ElementShell({
          el: $el,
          name: `${PLUGIN_TYPE}-${DIRECTIVE_NAMESPACE}`,
          debug: binding.debug || debug,
          vm: vnode.context,
        })

        shell._vueLogger.log('emit update hook!')

        const newImageSrc = $el.getAttribute('image-src') || ''

        // 当图片地址未变化时，则不进行处理
        if (shell.$realImageSrc === newImageSrc) {
          return
        }

        // 重新请求图片
        // 若强制启用了动效，则每次图片显示，都会执行动效
        shell._vueLogger.log('image src updated, request image resource!')

        // 更新新图片地址
        shell.$realImageSrc = newImageSrc

        // 重新请求图片
        _actions.requestImage(vnode.context, shell, newImageSrc, animate)
      }
    })
  }
}
