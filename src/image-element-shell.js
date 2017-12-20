/**
 * @file DOM元素壳封装类
 */

import validation from '@~lisfan/validation'
import Logger from '@~lisfan/logger'
import ImageLoader from './image-loader'

import { addAnimationEnd, removeAnimationEnd } from './utils/animation-handler'

// 透明图片base64
const PLACEHOLDER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABBJREFUeNpi/P//PwNAgAEACQEC/2m8kPAAAAAASUVORK5CYII='

// 私有方法
const _actions = {
  /**
   * 遍历并过滤出需要的对象键值
   *
   * @since 1.2.0
   *
   * @param {object} obj - 处理对象
   * @param {function} iteratee - 迭代函数
   *
   * @returns {object}
   */
  mapFilter(obj, iteratee) {
    const map = {}

    Object.entries(obj).forEach(([key, value]) => {
      if (iteratee.call(null, value, key, obj) !== false) map[key] = value
    })

    return map
  },
  /**
   * 将成对格式统一的数组打包成一个对象
   *
   * @since 1.2.0
   *
   * @param {string[]} props - 作对打包对象的键名
   * @param {array} values - 作对打包对象的值
   *
   * @returns {object}
   */
  zipObject(props, values) {
    const zip = {}

    props.forEach((key, index) => {
      zip[key] = values[index]
    })

    return zip
  },
  /**
   * 获取已dom的实际样式集合
   *
   * @since 1.2.0
   *
   * @param {Element} el - 目标DOM节点
   * @param {?string|string[]} props - 获取样式，若未指定
   *
   * @return {object}
   */
  dumpComputedStyles(el, props) {
    const styles = document.defaultView.getComputedStyle(el, null)

    if (validation.isString(props)) {
      return {
        [props]: styles.getPropertyValue(props)
      }
    } else if (validation.isArray(props)) {
      const values = props.map((value) => {
        return styles.getPropertyValue(value)
      })

      return _actions.zipObject(props, values)
    } else {
      return _actions.mapFilter(styles, (value, key) => {
        return validation.isFinite(Number(key)) ? false : value
      })
    }
  },
  /**
   * 为目标节点设置样式
   *
   * @since 1.2.0
   *
   * @param {Element} el - 目标DOM节点
   * @param {object} styles - 设置的样式字段
   */
  setElementStyles(el, styles) {
    Object.entries(styles).forEach(([prop, value]) => {
      el.style.setProperty(prop, value)
    })
  },
  /**
   * 插入节点到目标节点
   *
   * @param {Element} targetNode - 目标DOM节点
   * @param {Element} node - 插入节点
   */
  insertAfter(targetNode, node) {
    const nextNode = targetNode.nextElementSibling
    const parentNode = targetNode.parentElement

    if (nextNode) {
      parentNode.insertBefore(nextNode, node)
    } else {
      parentNode.appendChild(node)
    }
  },
  /**
   * 创建存在占位图片时的包裹节点
   *
   * @param {ImageElementShell} self - 实例本身
   */
  createContainerDom(self) {
    const fragment = document.createDocumentFragment()
    const container = document.createElement('div')
    const bgContent = document.createElement('div')

    self._parentNode = container

    // 设置container的样式
    _actions.setElementStyles(container, _actions.dumpComputedStyles(self.$el))

    let otherStyle = container.style.getPropertyValue('display') === 'inline'
      ? '; position:relative; display:inline-block'
      : '; position:relative'

    container.style = container.style.cssText + otherStyle

    bgContent.style = `
      position:absolute;
      top:0;
      bottom:0;
      left:0;
      right:0;
      width:100%;
      height:100%;
      background-size:contain;
      background-repeat: no-repeat;
      background-image: url(${self.$loadingPlaceholder || PLACEHOLDER_IMAGE});
    `

    container.appendChild(bgContent)
    fragment.appendChild(container)

    _actions.insertAfter(self.$el, fragment)

    container.appendChild(self.$el)

    self.$el.style = self.$el.style.cssText + '; position:relative; z-index:1'
  },
  /**
   * 载入中占位图片处理完成之后，移除容器节点
   *
   * @param {ImageElementShell} self - 实例本身
   */
  removeContainerDom(self) {
    // 如果还存在容器，则进行移除
    if (self._parentNode && !self._canAnimate) {
      // 进行移除
      _actions.insertAfter(self._parentNode, self.$el)
      self._parentNode.parentElement.removeChild(self._parentNode)
      self._parentNode = null
    }
  },
  /**
   * 计算宽高值
   *
   * @since 1.2.0
   *
   * @param {object} binding - 指令对象
   *
   * @returns {object}
   */
  getSize(binding) {
    // 获取自定义高宽值
    let sizeList = binding.arg
      ? binding.arg.split('x')
      : []

    // 只截取前两个的值
    let [width, height] = sizeList.slice(0, 2)

    // 高不存在时则同样的宽值
    height = height || width

    return {
      width,
      height
    }
  },
  /**
   * 设置元素的宽高值
   * [注]：他拉伸的是直接的元素高度，不会自适应缩放
   *
   * @since 1.2.0
   *
   * @param {ImageElementShell} self - 实例自身
   *
   * @returns {undefined}
   */
  setClientSize(self) {
    if (!self.$width || !self.$height) {
      return
    }

    // 减少重绘，注意留空
    self.$el.style = self.$el.style.cssText + `; width:${self.$width}; height:${self.$height};`
  },
  /**
   * 设置目标元素的动效结束事件
   *
   * @since 1.2.0
   *
   * @param {ImageElementShell} self - 实例自身
   *
   * @returns {undefined}
   */
  setAnimationEndHandler(self) {
    // 若启用了动效且存在动效样式时
    if (!self.$animate || !self.$animationClassName) {
      return
    }

    self._canAnimate = true

    // 为dom元素绑定动画结束事件
    // 若已绑定则不再重复绑定
    const animationEndHandler = function () {
      // 标记动画已结束
      self._canAnimate = false

      const enterEndClassNameList = self._originClassNameList.slice()
      enterEndClassNameList.push(self.$animationClassName + '-enter-end')
      self.$el.setAttribute('class', enterEndClassNameList.join(' ').trim())

      // 动画结束后移除绑定事件
      removeAnimationEnd(self.$el, animationEndHandler)

      // 移除包裹dom
      _actions.removeContainerDom(self)
    }

    // 为节点绑定动画结束事件
    addAnimationEnd(self.$el, animationEndHandler)
  },
  /**
   * 根据dom元素的不同设置图片地址
   *
   * @since 1.1.0
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
   * @since 1.1.0
   *
   * @param {ImageElementShell} self - 实例本身
   * @param {string} imageSrc - 请求图片地址
   */
  requestImage(self, imageSrc) {
    // 1. 判断是否正在请求**占位图片**的步骤，若请求占位图片也失败，则使用**透明图片**代替占位
    // 2. 如果动态图片地址和占位图片地址相同，则直接认为是在请求占位图片的步骤
    self._imageLoader = new ImageLoader({
      name: self._logger.$name,
      debug: self._logger.$debug
    })

    self.$currentSrc = imageSrc

    // 载入图片
    self._imageLoader.load(imageSrc)

    // 如果这张图片已下载过，且未开启强制动效，则判断图片已加载完毕，否则将进行动效载入
    self._loaded = self._imageLoader.$complete && !self.$force

    self._imageLoader.on('load', _actions.successHandler(self))
    self._imageLoader.on('error', _actions.failHandler(self))
  },
  /**
   * 图片请求成功事件
   *
   * @since 1.1.0
   *
   * @param {ImageElementShell} self - 元素壳实例
   */
  successHandler(self) {
    return function () {
      clearTimeout(self._loadingTimeouter)

      // 移除包裹dom
      _actions.removeContainerDom(self)

      // 设置图片地址
      _actions.setImageSrc(self.$el, self.$currentSrc)

      if (self.$currentSrc !== self.$actualSrc) {
        return
      }

      // 图片请求成功时非真实图片则不进行动画加载，直接替换
      // 性能优化：图片延迟加载，不要在同一时间内同时加载
      requestAnimationFrame(() => {
        self._logger.log('image load successed:', self.$currentSrc)

        // 图片未加载完毕，且开启了动效，且存在动效名称时，才进行动画
        if (self._loaded || !self.$animate || !self.$animationClassName) {
          return
        }

        // 替换为起始样式
        const enterClassNameList = self._originClassNameList.slice()
        enterClassNameList.push(self.$animationClassName + '-enter')
        self.$el.setAttribute('class', enterClassNameList.join(' ').trim())

        // 替换为动画样式
        requestAnimationFrame(() => {
          const enterActiveClassNameList = self._originClassNameList.slice()
          enterActiveClassNameList.push(self.$animationClassName + '-enter-active')
          self.$el.setAttribute('class', enterActiveClassNameList.join(' ').trim())
        })
      })
    }
  },
  /**
   * 图片请求失败事件
   *
   * @since 1.1.0
   *
   * @param {ImageElementShell} self - 元素壳实例
   */
  failHandler(self) {
    return function () {
      clearTimeout(self._loadingTimeouter)

      // 移除包裹dom
      _actions.removeContainerDom(self)

      self._logger.log('image load faild:', self.$currentSrc)

      // 如果是二次加载图片且又失败
      // 则使用透明图片代替
      self.$currentSrc = self.$currentSrc === self.$placeholder
        ? PLACEHOLDER_IMAGE
        : self.$placeholder

      self._imageLoader.load(self.$currentSrc)
    }
  }
}

/**
 * @classdesc DOM元素数据和操作封装类
 *
 * @class
 */
class ImageElementShell {
  /**
   * 默认配置选项
   *
   * @since 1.0.0
   *
   * @static
   * @readonly
   * @memberOf ImageElementShell
   *
   * @property {string} name='ImageElementShell' - 打印器名称标记
   * @property {boolean} debug=false - 打印器调试模式是否开启
   * force   // 是否强制开启每次载入动效
   // 若未自定义，则取全局配置force
   */
  static options = {
    name: 'ImageElementShell',
    debug: false,
    el: null,
    width: '',
    height: '',
    originSrc: '',
    placeholder: '',
    loadingPlaceholder: '',
    loadingDelay: 300,
    originClassName: '',
    animationClassName: '',
    force: false,
    animate: true,
  }

  /**
   * 构造函数
   *
   * @see ImageElementShell.options
   *
   * @param {object} options - 其他配置选项见{@link ImageElementShell.options}
   */
  constructor(options) {
    this.$options = {
      ...ImageElementShell.options,
      ...options
    }

    // 优先使用透明图片占位
    _actions.setImageSrc(this.$el, PLACEHOLDER_IMAGE)

    // 在dom实例上绑定一些初次绑定保存的数据
    // - 保存保默认占位图片的值
    // - 若未自定义默认占位图片的值，从修饰符对象中找出第一个匹配中的占位图片

    // 占位图片
    this._placeholder = this.$options.placeholder

    // 载入中占位图片
    this._loadingPlaceholder = this.$options.loadingPlaceholder

    // 源图片
    this._originSrc = this.$options.originSrc

    // 源样式列表
    this._originClassNameList = this.$options.originClassName.split(' ')

    // 设置目标元素的高宽
    _actions.setClientSize(this)

    // 绑定目标元素的动效结束事件
    _actions.setAnimationEndHandler(this)

    // 判断dom元素标签名，若为img标签元素，则设置透明图片占位，否则设置为该元素的背景
    // 如果未指定src属性的值，且设置了载入中占位图片时，设置占位图片包裹容器
    if (validation.isEmpty(this.$originSrc) && !validation.isEmpty(this.$loadingPlaceholder)) {
      this._loadingTimeouter = setTimeout(() => {
        _actions.createContainerDom(this)
      }, this.$loadingDelay)
    }

    // 绑定实例到dom节点上
    this.$el._shell = this
  }

  load(actualSrc) {
    this._actualSrc = actualSrc
    _actions.requestImage(this, actualSrc)
  }

  _imageLoader = undefined
  _logger = undefined

  /**
   * 实例初始配置项
   *
   * @since 1.0.0
   *
   * @readonly
   *
   * @type {object}
   */
  $options = undefined

  /**
   * 获取dom节点
   *
   * @since 2.0.0
   *
   * @getter
   *
   * @type {Element}
   */
  get $el() {
    return this.$options.el
  }

  /**
   * 获取实例设置的宽度值
   *
   * @since 2.0.0
   *
   * @getter
   *
   * @type {string}
   */
  get $width() {
    return this.$options.width
  }

  /**
   * 获取实例设置的高度值
   *
   * @since 1.0.0
   *
   * @getter
   *
   * @type {string}
   */
  get $height() {
    return this.$options.height
  }

  _parentNode = undefined

  _currentSrc = undefined

  /**
   * 获取当前图片的地址
   *
   * @since 1.0.0
   *
   * @getter
   *
   * @type {string}
   */
  get $currentSrc() {
    return this._currentSrc
  }

  /**
   * 设置当前图片的地址
   *
   * @since 1.0.0
   *
   * @setter
   *
   * @param {string} val - 新值
   */
  set $currentSrc(val) {
    this._currentSrc = val
  }

  _originSrc = undefined

  /**
   * 获取原图片地址
   *
   * @since 1.0.0
   *
   * @getter
   *
   * @type {string}
   */
  get $originSrc() {
    return this._originSrc
  }

  /**
   * 设置原图片地址
   *
   * @since 1.0.0
   *
   * @setter
   *
   * @param {string} val - 新值
   */
  set $originSrc(val) {
    this._originSrc = val
  }

  _actualSrc = undefined

  /**
   * 获取真实图片的地址
   *
   * @since 1.0.0
   *
   * @getter
   *
   * @type {string}
   */
  get $actualSrc() {
    return this._actualSrc
  }

  /**
   * 设置真实图片的地址
   *
   * @since 1.0.0
   *
   * @setter
   *
   * @param {string} val - 新值
   */
  set $actualSrc(val) {
    this._actualSrc = val
  }

  _placeholder = undefined

  /**
   * 获取真实图片加载失败时的占位图片地址
   *
   * @since 1.0.0
   *
   * @getter
   *
   * @type {string}
   */
  get $placeholder() {
    return this._placeholder
  }

  /**
   * 设置真实图片加载失败时的占位图片地址
   *
   * @since 1.0.0
   *
   * @setter
   *
   * @param {string} val - 新值
   */
  set $placeholder(val) {
    this._placeholder = val
  }

  _loadingPlaceholder = undefined

  /**
   * 获取载入中占位图片地址
   *
   * @since 1.0.0
   *
   * @getter
   *
   * @type {string}
   */
  get $loadingPlaceholder() {
    return this._loadingPlaceholder
  }

  /**
   * 设置载入中占位图片地址
   *
   * @since 1.0.0
   *
   * @setter
   *
   * @param {string} val - 新值
   */
  set $loadingPlaceholder(val) {
    this._loadingPlaceholder = val
  }

  /**
   * 获取载入中占位图片延迟加载的时间
   *
   * @since 1.0.0
   *
   * @getter
   *
   * @type {number}
   */
  get $loadingDelay() {
    return this.$options.loadingDelay
  }

  _loadingTimeouter = undefined

  _originClassNameList = undefined

  _loaded = undefined

  /**
   * 获取真实图片是否加载成功的状态
   *
   * @since 1.0.0
   *
   * @getter
   *
   * @type {boolean}
   */
  get $loaded() {
    return this._loaded
  }

  /**
   * 设置真实图片是否加载成功的状态
   *
   * @since 1.0.0
   *
   * @setter
   *
   * @param {boolean} val - 新值
   */
  set $loaded(val) {
    this._loaded = val
  }

  /**
   * 获取动效样式
   *
   * @since 1.0.0
   *
   * @getter
   *
   * @type {string}
   */
  get $animationClassName() {
    return this.$options.animationClassName
  }

  /**
   * 获取是否启用了每次强制载入动效
   *
   * @since 1.0.0
   *
   * @getter
   *
   * @type {boolean}
   */
  get $force() {
    return this.$options.force
  }

  /**
   * 获取是否需要载入动效的状态
   *
   * @since 1.0.0
   *
   * @getter
   *
   * @type {boolean}
   */
  get $animate() {
    return this.$options.animate
  }
}

export default ImageElementShell