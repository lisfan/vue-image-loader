/**
 * @file 图片下载类
 */

import EventQueues from '@~lisfan/event-queues'

// 下载成功过的图片列表池
const loadedImageList = []

// base64格式匹配正则表达式
const BASE64_REG = /data:(.*);base64,/

// 私有方法
const _actions = {
  /**
   * 判断请求的图片地址与已请求过的地址是否是一致的
   *
   * @param self
   * @param imageSrc
   * @returns {boolean}
   */
  isSameResource(self, imageSrc) {
    console.log('imageSrc', imageSrc)
    console.log('self.$currentSrc', self.$currentSrc)
    return imageSrc === self.$currentSrc
  },
  /**
   * 获取图片扩展名
   * 兼容如下几种图片格式
   * - base64格式
   * - 纯固定扩展结尾
   * - 兼容类似又拍云的图片处理APi，如`path/to/source.jpg!both/100x100`这样的格式
   *
   * @param {string} imageSrc - 图片地址
   *
   * @returns {string}
   */
  getExtension(imageSrc) {
    const matched = imageSrc.match(BASE64_REG)

    let EXT_REG
    // 如果本身是base64
    if (matched) {
      EXT_REG = /image\/(.*)/
      imageSrc = matched[1]
    } else {
      EXT_REG = /.*\.([a-zA-Z\d]+).*/
    }

    return imageSrc.replace(EXT_REG, '$1').toLocaleLowerCase()
  },
  /**
   * 根据图片的后缀获取图片的mime类型
   *
   * @param {string} ext - 后缀名
   *
   * @returns {string} - 返回mime类型
   */
  getMimeType(ext) {
    const MIME_TYPE = {
      jpg: 'image/jpeg',
      jepg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
    }

    return MIME_TYPE[ext]
  },
  /**
   * 简易ajax请求封装
   *
   * @param {string} url - 请求链接
   * @param {string} [method='get'] - 请求方法
   * @param {string} [type='json'] - 响应结果类型
   *
   * @returns {Promise}
   */
  ajax(url, method = 'get', type = 'json') {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open(method, url, true)
      xhr.responseType = type

      xhr.addEventListener('load', () => {
        if (xhr.readyState !== 4 | xhr.status !== 200) {
          return reject(xhr)
        }

        resolve(xhr)
      })

      xhr.addEventListener('error', (err) => {
        console.log('error')
        reject(err)
      })

      xhr.send()
    })
  },
  /**
   * blob转dataURL
   *
   * @param {Blob} blob - blob数据
   *
   * @returns {Promise}
   */
  blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader()

      fileReader.addEventListener('load', (event) => {
        resolve(event.target.result)
      })

      fileReader.addEventListener('error', (err) => {
        reject(err)
      })

      fileReader.readAsDataURL(blob)
    })
  },
  /**
   * dataURL转blob
   *
   * @param {string} dataURL - dataURL数据
   *
   * @returns {Blob}
   */
  dataURLToBlob(dataURL) {
    const arr = dataURL.split(',')

    const blobStr = atob(arr[1])

    let bLen = blobStr.length

    const u8arr = new Uint8Array(bLen)

    while (bLen--) {
      u8arr[bLen] = blobStr.charCodeAt(bLen)
    }

    const mime = arr[0].match(/:(.*?);/)[1]

    return new Blob([u8arr], { type: mime })
  },
  /**
   * canvas 转 dataURL
   *
   * @param {ImageLoader} self - 当前实例
   * @param {HTMLImageElement} image - image实例
   * @param {string} [format] - 输出的图片格式，默认保存原图片后缀格式
   *
   * @returns {string}
   */
  canvasToDataURL(self, image, format) {
    // 如果图片本身是base64
    // 如果存在的是$image
    // 否则进行转换
    let canvas = document.createElement('CANVAS')
    canvas.width = self.$naturalWidth
    canvas.height = self.$naturalHeight

    const context = canvas.getContext('2d')
    context.drawImage(image, 0, 0)

    const mimeType = format ? _actions.getMimeType(format) : _actions.getMimeType(self.$ext)

    return canvas.toDataURL(mimeType)
  }
}

/**
 * @external EventQueues
 *
 * @see {@link http://lisfan.github.io/event-queues|EventQueues}
 */

/**
 * @extends EventQueues
 *
 * @description
 * [注] 继承了EventQueues类，附加的实例方法和属性请至{@link http://lisfan.github.io/event-queues|EventQueues API}文档查看
 *
 * @classdesc 图片下载类
 *
 * @class
 */
class ImageLoader extends EventQueues {
  /**
   * 默认配置选项
   *
   * @since 1.0.0
   *
   * @static
   * @readonly
   * @memberOf ImageLoader
   *
   * @type {object}
   * @property {boolean} debug=false - 打印器调试模式是否开启
   * @property {string} name='ImageLoader' - 打印器名称标记
   */
  static options = {
    name: 'ImageLoader',
    debug: false,
  }

  /**
   * 更新默认配置选项
   *
   * @since 1.0.0
   *
   * @see ImageLoader.options
   *
   * @param {object} options - 其他配置选项见{@link ImageLoader.options}
   *
   * @returns {ImageLoader}
   */
  static config(options) {
    // 以内置配置为优先
    ImageLoader.options = {
      ...ImageLoader.options,
      ...options
    }

    return this
  }

  /**
   * 构造函数
   *
   * @see ImageLoader.options
   *
   * @param {object} options - 其他配置选项见{@link ImageLoader.options}
   */
  constructor(options) {
    super({
      ...ImageLoader.options,
      ...options
    })
  }

  /**
   * load方法执行时绑定的image对象
   *
   * @since 1.0.0
   *
   * @readonly
   *
   * @type {Image}
   */
  $image = undefined

  /**
   * fetch方法执行时绑定的blob对象
   *
   * @since 1.0.0
   *
   * @readonly
   *
   * @type {Blob}
   */
  $blob = undefined

  _currentSrc = undefined

  /**
   * 图片的地址
   *
   * @since 1.0.0
   *
   * @getter
   * @readonly
   *
   * @type {string}
   */
  get $currentSrc() {
    return this._currentSrc
  }

  /**
   * 获取image实例对应图片是否下载完成过
   *
   * @since 1.0.0
   *
   * @getter
   * @readonly
   *
   * @type {boolean}
   */
  get $complete() {
    return this.$image && this.$image.complete
  }

  _status = undefined

  /**
   * 获取image实例对应图片的下载是否成功状态值
   *
   * @since 1.2.1
   *
   * @getter
   * @readonly
   *
   * @type {string}
   */
  get $status() {
    return this._status
  }

  _loaded = undefined

  /**
   * 获取image实例对应图片是否已下载过
   *
   * @since 1.0.0
   *
   * @getter
   * @readonly
   *
   * @type {boolean}
   */
  get $loaded() {
    return this._loaded
  }

  /**
   * 获取image实例的设置宽度
   * [注] 请确保在调用时，图片下载已完成
   *
   * @since 1.0.0
   *
   * @getter
   * @readonly
   *
   * @type {number}
   */
  get $width() {
    return this.$image && this.$image.width
  }

  /**
   * 获取image实例对应图片的真实宽度
   * [注] 请确保在调用时，图片下载已完成
   *
   * @since 1.0.0
   *
   * @getter
   * @readonly
   *
   * @type {number}
   */
  get $naturalWidth() {
    return this.$image && this.$image.naturalWidth
  }

  /**
   * 获取image实例的设置高度
   * [注] 请确保在调用时，图片下载已完成
   *
   * @since 1.0.0
   *
   * @getter
   * @readonly
   *
   * @type {number}
   */
  get $height() {
    return this.$image && this.$image.height
  }

  /**
   * 获取image实例对应图片的真实高度
   * [注] 请确保在调用时，图片下载已完成
   *
   * @since 1.0.0
   *
   * @getter
   * @readonly
   *
   * @type {number}
   */
  get $naturalHeight() {
    return this.$image && this.$image.naturalHeight
  }

  /**
   * 获取当前文件扩展名
   * [注] 请确保在调用时，图片下载已完成
   *
   * @since 1.0.0
   *
   * @getter
   * @readonly
   *
   * @type {string}
   */
  get $ext() {
    return this.$image && _actions.getExtension(this.$currentSrc)
  }

  /**
   * 获取当前文件的mime类型
   * 仅在调用{@link ImageLoader#fetch}方法时有效
   *
   * @since 1.0.0
   *
   * @getter
   * @readonly
   *
   * @type {string}
   */
  get $mime() {
    return this.$blob && this.$blob.type
  }

  /**
   * 获取当前文件的大小，单位：字节
   * 仅在调用{@link ImageLoader#fetch}方法后，该值有效
   *
   * @since 1.0.0
   *
   * @getter
   * @readonly
   *
   * @type {number}
   */
  get $size() {
    return this.$blob && this.$blob.size
  }

  /**
   * 载入图片
   *
   * @since 1.0.0
   *
   * @async
   *
   * @param {string} [imageSrc=''] - 图片地址
   * @param {number} [width] - 图片显示的宽
   * @param {number} [height] - 图片显示的高
   *
   * @returns {Promise}
   */
  load(imageSrc = '', width, height) {
    return new Promise((resolve, reject) => {
      if (!_actions.isSameResource(this, imageSrc)) {
        this.$blob = null
      }

      this._currentSrc = imageSrc

      this.$image = new Image(width, height)

      // // 启用跨域请求
      // this.$image.crossOrigin = '*'

      this.$image.addEventListener('load', () => {
        this._logger.log('image load successed!')
        this._status = 'success'

        if (loadedImageList.indexOf(this.$currentSrc) >= 0) {
          this._loaded = true
        } else {
          this._loaded = false
          loadedImageList.push(this.$currentSrc)
        }

        this.emit('load').then((result) => {
          resolve(result)
        }).catch((err) => {
          reject(err)
        })
      })

      this.$image.addEventListener('error', () => {
        this._logger.log('image load failed!')
        this._status = 'fail'

        this.emit('error').then((result) => {
          reject(result)
        }).catch((err) => {
          reject(err)
        })
      })

      this.$image.src = imageSrc

    })
  }

  /**
   * 以ajax方式获取图片资源，该方式获取的资源可以统计资源的容量大小
   * 此时，可以取实例上的{@link ImageLoader#$mime}和{@link ImageLoader#$size}两个实例属性
   * [注] 若图片地址是dataURL格式，则直接返回dataURL，且{@link ImageLoader#$size}对应的是dataURL的容量大小（并不是原图片的容量大小）
   *
   * @since 1.0.0
   *
   * @async
   *
   * @param {string} [imageSrc=''] - 图片地址
   *
   * @returns {Promise}
   */
  fetch(imageSrc = '') {
    // 如果已经是base64格式
    return new Promise((resolve, reject) => {
      if (!_actions.isSameResource(this, imageSrc)) {
        this.$image = null
      }

      this._currentSrc = imageSrc

      const matched = imageSrc.match(BASE64_REG)

      // 如果本身是base64
      if (matched) {
        this.$blob = _actions.dataURLToBlob(imageSrc)
        return this.load(imageSrc).then((result) => {
          resolve(result)
        }).catch((err) => {
          reject(err)
        })
      }

      return _actions.ajax(imageSrc, 'get', 'blob').then((result) => {
        this.$blob = result.response

        this.load(imageSrc).then((loadResult) => {
          resolve(loadResult)
        }).catch((err) => {
          reject(err)
        })

        // if (loadedImageList.indexOf(this.$currentSrc) >= 0) {
        //   this._loaded = true
        // } else {
        //   this._loaded = false
        //   loadedImageList.push(this.$currentSrc)
        // }

        // this.emit('load').then((result) => {
        //   resolve(result)
        // }).catch((err) => {
        //   reject(err)
        // })
      }).catch((err) => {
        reject(err)
        // this.emit('error').then((result) => {
        //   reject(result)
        // }).catch((err) => {
        //   reject(err)
        // })
      })
    })
  }

  /**
   * 输出base64格式
   * 调用该方法时，请确保$image值存在，或者base64的值存在
   *
   * @since 1.0.0
   *
   * @async
   *
   * @param {string} [format] - 输出的图片格式，默认保存原图片后缀格式
   *
   * @returns {Promise}
   */
  base64(format) {
    return new Promise((resolve, reject) => {
      // 如果ImageLoader#$image和ImageLoader#$dataURL都不存在，则抛出错误
      if (!this.$blob && !this.$image) {
        reject('image resource does not load! please use once (ImageLoader#load) or (ImageLoader#fetch) method.')
      }

      // 假如优先存在$image则优先处理
      // if (this.$image) {
      // 如果图片本身是base64
      const matched = this.$currentSrc.match(BASE64_REG)

      // 如果本身是base64
      if (matched) {
        return resolve(this.$currentSrc)
      }

      return resolve(_actions.canvasToDataURL(this, this.$image, format))
      // }

      // // 如果只存在$blob
      // _actions.blobToDataURL(this.$blob).then((dataURL) => {
      //   // 加载图片，转换url
      //   // 若format与当前后缀格式不匹配，则进行格式转换
      //   const mime = _actions.getMimeType(format)
      //
      //   // 如果相等
      //   if (!mime || this.$mime === mime) {
      //     return resolve(dataURL)
      //   }
      //
      //   // 转化为base64格式
      //   const image = new Image()
      //
      //   image.src = dataURL
      //
      //   image.addEventListener('load', () => {
      //     return resolve(_actions.canvasToDataURL(this, image, format))
      //   })
      // })
    })
  }
}

export default ImageLoader