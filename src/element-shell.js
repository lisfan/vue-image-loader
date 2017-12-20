/**
 * @file DOM元素壳封装类
 * @author lisfan <goolisfan@gmail.com>
 * @version 1.0.0
 * @licence MIT
 */

import VueLogger from '@~lisfan/vue-logger'

/**
 * @classdesc DOM元素数据封装类
 *
 * @class
 */
class ElementShell {
  /**
   * 默认配置选项
   *
   * @since 1.0.0
   *
   * @static
   * @readonly
   * @memberOf ElementShell
   *
   * @property {string} name='ElementShell' - 打印器名称标记
   * @property {boolean} debug=false - 打印器调试模式是否开启
   */
  static options = {
    name: 'ElementShell',
    debug: false,
  }

  /**
   * 构造函数
   *
   * @see ElementShell.options
   *
   * @param {object} options - 其他配置选项见{@link ElementShell.options}
   */
  constructor(options) {
    this.$options = {
      ...ElementShell.options,
      ...options
    }

    this._vueLogger = new VueLogger({
      name: this.$options.name,
      debug: this.$options.debug,
      vm: this.$options.vm
    })
  }

  /**
   * 日志打印器，方便调试
   *
   * @since 1.0.0
   *
   * @private
   */
  _vueLogger = undefined

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
   * @since 1.0.0
   *
   * @getter
   *
   * @type {Element}
   */
  get $el() {
    return this.$options.el
  }

  /**
   * 获取该dom节点经过包装之后的容器节点
   *
   * @since 1.0.0
   *
   * @getter
   *
   * @type {string}
   */
  get $parentNode() {
    return this.$el.$parentNode
  }

  /**
   * 设置该dom节点经过包装之后的容器节点
   *
   * @since 1.0.0
   *
   * @setter
   *
   * @param {string} val - 新值
   */
  set $parentNode(val) {
    this.$el.$parentNode = val
  }

  /**
   * 获取当前图片的地址
   *
   * @since 1.0.0
   *
   * @getter
   *
   * @type {string}
   */
  get $currentImgSrc() {
    return this.$el.$currentImgSrc
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
  set $currentImgSrc(val) {
    this.$el.$currentImgSrc = val
  }

  /**
   * 获取原图片地址
   *
   * @since 1.0.0
   *
   * @getter
   *
   * @type {string}
   */
  get $originImageSrc() {
    return this.$el.$originImageSrc
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
  set $originImageSrc(val) {
    this.$el.$originImageSrc = val
  }

  /**
   * 获取真实图片的地址
   *
   * @since 1.0.0
   *
   * @getter
   *
   * @type {string}
   */
  get $realImageSrc() {
    return this.$el.$realImageSrc
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
  set $realImageSrc(val) {
    this.$el.$realImageSrc = val
  }

  /**
   * 获取真实图片加载失败时的占位图片地址
   *
   * @since 1.0.0
   *
   * @getter
   *
   * @type {string}
   */
  get $phImageSrc() {
    return this.$el.$phImageSrc
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
  set $phImageSrc(val) {
    this.$el.$phImageSrc = val
  }

  /**
   * 获取载入中占位图片地址
   *
   * @since 1.0.0
   *
   * @getter
   *
   * @type {string}
   */
  get $loadingPhImageSrc() {
    return this.$el.$loadingPhImageSrc
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
  set $loadingPhImageSrc(val) {
    this.$el.$loadingPhImageSrc = val
  }

  /**
   * 获取载入中占位图片的延迟器ID
   *
   * @since 1.0.0
   *
   * @getter
   *
   * @type {number}
   */
  get $loadingTimeouter() {
    return this.$el.$loadingTimeouter
  }

  /**
   * 设置载入中占位图片的延迟器ID
   *
   * @since 1.0.0
   *
   * @setter
   *
   * @param {number} val - 新值
   */
  set $loadingTimeouter(val) {
    this.$el.$loadingTimeouter = val
  }

  /**
   * 获取元素的原始样式类列表
   *
   * @since 1.0.0
   *
   * @getter
   *
   * @type {array}
   */
  get $originClassNameList() {
    return this.$el.$originClassNameList
  }

  /**
   * 设置元素的原始样式类列表
   *
   * @since 1.0.0
   *
   * @setter
   *
   * @param {array} val - 新值
   */
  set $originClassNameList(val) {
    this.$el.$originClassNameList = val
  }

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
    return this.$el.$loaded
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
    this.$el.$loaded = val
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
  get $enableForceEffect() {
    return this.$el.$enableForceEffect
  }

  /**
   * 设置是否启用了每次强制载入动效
   *
   * @since 1.0.0
   *
   * @setter
   *
   * @param {boolean} val - 新值
   */
  set $enableForceEffect(val) {
    this.$el.$enableForceEffect = val
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
    return this.$el.$animationClassName
  }

  /**
   * 设置动效样式
   *
   * @since 1.0.0
   *
   * @setter
   *
   * @param {string} val - 新值
   */
  set $animationClassName(val) {
    this.$el.$animationClassName = val
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
    return this.$el.$animate
  }

  /**
   * 设置是否需要载入动效的状态
   *
   * @since 1.0.0
   *
   * @setter
   *
   * @param {boolean} val - 新值
   */
  set $animate(val) {
    this.$el.$animate = val
  }

}

export default ElementShell