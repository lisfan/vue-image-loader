/**
 * @file vue指令插件-图片加载器
 */

import validation from '@~lisfan/validation'
import VueLogger from '@~lisfan/vue-logger'

import ImageElementShell from './image-element-shell'

const PLUGIN_TYPE = 'directive'  // 插件类型
const DIRECTIVE_NAMESPACE = 'image-loader' // 指令名称

// 私有方法
const _actions = {
  /**
   * 计算宽高值
   *
   * @since 1.2.0
   *
   * @param {object} binding - 指令对象
   * @param {number} remRatio - rem与px的比例，默认值为100，表示1rem=100px
   *
   * @returns {object}
   */
  getSize(binding, remRatio) {
    // 获取自定义高宽值
    let sizeList = binding.arg
      ? binding.arg.split('x')
      : []

    // 只截取前两个的值
    let [width, height] = sizeList.slice(0, 2)

    // 高不存在时则同样的宽值
    height = height || width

    return {
      width: (width / remRatio ) + 'rem',
      height: (height / remRatio ) + 'rem',
    }
  },
  /**
   * 获取匹配到的占位图片
   *
   * @since 1.1.0
   *
   * @param {object} binding - 指令对象
   * @param {object} placeholders - 占位图片枚举集合
   *
   * @returns {string}
   */
  getPlaceholder(binding, placeholders) {
    let placeholderImage

    Object.keys(binding.modifiers).some((key) => {
      return (placeholderImage = placeholders[key])
    })

    return placeholderImage
  },
}

export default {
  /**
   * 图片加载器注册函数
   *
   * @since 1.1.0
   *
   * @function install
   *
   * @param {Vue} Vue - VUE类
   * @param {object} [options={}] - 配置选项
   * @param {string} [options.name='directive-image-loader'] - 日志打印器命名空间
   * @param {boolean} [options.debug=false] - 打印器调试模式是否开启
   * @param {number} [options.remRatio=100] - rem与px的比例，表示1rem=100px
   * @param {object} [options.placeholders={}] - 全局配置占位图片，key名会转换为修饰符
   * @param {string} [options.loadingPlaceholder=''] - 全局配置图片载入中占位图片
   * @param {number} [options.loadingDelay=300] - 载入中占位图片的延迟加载时间，避免出现载入中图片瞬间切换为真实图片的闪烁问题
   * @param {number} [options.animationClassName=''] - 动效的样式类
   * @param {boolean} [options.animate=true] - 是否启用动效载入，全局性动效开关，比如为了部分机型，可能会关闭动效的展示
   * @param {boolean} [options.force=false] - 是否强制开启每次指令绑定或更新进行动效展示。若关闭，则图片只在初次加载成功进行特效载入，之后不进行特效加载
   */
  install(Vue, {
    name = `${PLUGIN_TYPE}-${DIRECTIVE_NAMESPACE}`,
    debug = ImageElementShell.options.placeholders,
    remRatio = 100,
    placeholders = ImageElementShell.options.placeholders,
    loadingDelay = ImageElementShell.options.loadingDelay,
    loadingPlaceholder = ImageElementShell.options.loadingPlaceholder,
    animationClassName = ImageElementShell.options.animationClassName,
    animate = ImageElementShell.options.animate,
    force = ImageElementShell.options.force,
  } = {}) {
    /**
     * vue指令：image-loader
     * 该指令会从元素节点属性上读取以下值
     * - src - 读取原图片值，如果设置了该值，则loading-placeholder的设置将无效（为了应对一些场景而设立）
     * - image-src - 设置了图片'真正'需要加载的图片
     * - loading-placeholder - 设置了图片加载中的占位图片
     * - placeholder - 设置了当图片加载失败时，使用的占位图片。也可以不设置该值，而是通过读取指令的modifiers进行快捷指定全局配置的占用图片
     *
     * @since 1.2.0
     *
     * @function image-loader
     *
     * @param {string} [arg=false] - 参数图片宽度尺寸
     * @param {string} [value=false] - 动效样式
     * @param {object} [modifiers] - 修饰符对象，除了force值外，其他值都将当成占位符的快捷指定
     * @param {boolean} [modifiers.debug=false] - 是否启用单独启用调试日志
     * @param {boolean} [modifiers.animate=false] - 是否启用单独启用动效
     * @param {boolean} [modifiers.force=false] - 是否启用启用单独启用强制重新进行动效展示修饰符
     */
    Vue.directive(DIRECTIVE_NAMESPACE, {
      /**
       * 初始化绑定
       *
       * @since 1.0.0
       *
       * @ignore
       *
       * @param {element} $el - 目标dom元素
       * @param {object} binding - 指令对象
       * @param {VNode} vnode - Vue节点对象
       */
      bind($el, binding, vnode) {
        // 在目标节点上绑定该指令标识
        $el.setAttribute(`v-${DIRECTIVE_NAMESPACE}`, '')

        const vueLogger = new VueLogger({
          name,
          debug: binding.modifiers.debug || debug,
          vm: vnode.context,
        })

        vueLogger.log('emit bind hook!')

        // 因需要获取$el的属性，所以必须放在下一帧dom刷新才可以获取到样式
        Vue.nextTick().then(() => {

          // 设置目标元素的高宽
          const { width, height } = _actions.getSize(binding, remRatio)

          const shell = new ImageElementShell({
            debug: vueLogger.$debug,
            name: vueLogger.$name,
            el: $el,
            width: width || '',
            height: height || '',
            originSrc: $el.getAttribute('src') || '',
            placeholder: $el.getAttribute('placeholder') || _actions.getPlaceholder(binding, placeholders) || '',
            loadingPlaceholder: $el.getAttribute('loading-placeholder') || loadingPlaceholder || '',
            loadingDelay,
            originClassName: $el.getAttribute('class') || '',
            animationClassName: binding.value || animationClassName || '',
            animate: binding.modifiers.animate || animate,
            force: binding.modifiers.force || force,
          })

          const actualSrc = $el.getAttribute('image-src') || ''

          if (validation.isEmpty(actualSrc)) {
            // 若不存在真实图片地址，请求空白图片占位
            vueLogger.log('image src no existed, request placeholder image resource!')
            shell.load(shell.$placeholder)
          } else {
            // 若存在真实图片地址，请求空白图片占位
            vueLogger.log('image src existed, request image resource!')
            shell.load(actualSrc)
          }
        })
      },
      /**
       * 值进行了更新
       *
       * @since 1.0.0
       *
       * @ignore
       *
       * @param {element} $el - 目标dom元素
       * @param {object} binding - 指令对象
       * @param {VNode} vnode - Vue节点对象
       */
      update($el, binding, vnode) {
        const vueLogger = new VueLogger({
          name,
          debug: binding.modifiers.debug || debug,
          vm: vnode.context,
        })

        vueLogger.log('emit update hook!')

        // 获取绑定在节点上的shell实例
        const shell = $el._shell

        const actualSrc = $el.getAttribute('image-src') || ''

        // 当图片地址未变化时，则不进行处理
        if (shell.$actualSrc === actualSrc) {
          return
        }

        // 重新请求图片
        // 若强制启用了动效，则每次图片显示，都会执行动效
        vueLogger.log('image src updated, request image resource!')

        shell.load(actualSrc)
      }
    })
  }
}
