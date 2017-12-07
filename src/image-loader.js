/**
 * @file 图片加载器
 * @author lisfan <goolisfan@gmail.com>
 * @version 1.3.0
 * @licence MIT
 */
import validation from '@~lisfan/validation'
import EventQueues from '@~lisfan/event-queues'

// 私有方法
const _actions = {
  // base64格式匹配正则表达式
  BASE64_REG: /data:(.*);base64,/,
  /**
   * 获取图片扩展名
   * 兼容如下几种图片格式
   * - base64格式
   * - 纯固定扩展结尾
   * - 兼容类似又拍云的图片处理APi，如`path/to/source.jpg!both/100x100`这样的格式
   * @param {string} imgSrc - 图片地址
   * @return {string}
   */
  getExtension(imgSrc) {
    const matched = imgSrc.match(_actions.BASE64_REG)

    let EXT_REG
    // 如果本身是base64
    if (matched) {
      EXT_REG = /image\/(.*)/
      imgSrc = matched[1]
    } else {
      EXT_REG = /.*\.([a-zA-Z\d]+).*/
    }

    return imgSrc.replace(EXT_REG, '$1').toLocaleLowerCase()
  },
  /**
   * 根据图片的后缀获取图片的mime类型
   * @param {string} ext - 后缀名
   * @return {string} - 返回mime类型
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
   * @param {string} url - 请求链接
   * @param {string} [method='get'] - 请求方法
   * @param {string} [type='json'] - 响应结果类型
   * @return {Promise}
   */
  ajax(url, method = 'get', type = 'json') {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open(method, url, true)
      xhr.responseType = type

      xhr.onload = function () {
        if (this.readyState !== 4 | this.status !== 200) {
          return
        }

        resolve(this)
      }

      xhr.onerror = function (err) {
        reject(err)
      }

      xhr.send()
    })
  },
  /**
   * blob转dataURL
   * @param {blob} blob - blob数据
   * @returns {string}
   */
  blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader()

      fileReader.onload = (event) => {
        resolve(event.target.result)
      }

      fileReader.onerror = (err) => {
        reject(err)
      }

      fileReader.readAsDataURL(blob)
    })
  },
  /**
   * dataURL转blob
   * @param {string} dataURL - dataURL数据
   * @returns {blob}
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
  }
}

/**
 * @external EventQueues
 * @see {@link lisfan.github.io/event-queues|EventQueues}
 */

/**
 * @classdesc
 * 图片下载类
 *
 * [注] 继承了EventQueues类，附加的实例方法和属性请至{@link lisfan.github.io/event-queues|EventQueues API}文档查看
 *
 * @class
 * @extends EventQueues
 */
class ImageLoader extends EventQueues {
  /**
   * 默认配置选项
   *
   * @since 1.3.0
   * @memberOf ImageLoader
   * @readonly
   * @static
   * @property {boolean} debug=false - 打印器调试模式是否开启
   * @property {string} name='ImageLoader' - 打印器名称标记
   */
  static options = {
    name: 'ImageLoader',
    debug: true,
  }

  /**
   * 更新默认配置选项
   *
   * @since 1.3.0
   * @static
   * @param {object} options - 配置参数
   * @param {boolean} [options.debug=false] - 调试模式是否开启
   * @param {string} [options.name='ImageLoader'] - 打印器名称标记
   * @return {ImageLoader}
   */
  static config(options) {
    // 以内置配置为优先
    ImageLoader.options = {
      ...ImageLoader.options,
      ...options
    }

    return ImageLoader
  }

  /**
   * 构造函数
   *
   * @param {object} [options] - 实例配置选项，若参数为`string`类型，则表示设定为`options.name`的值
   * @param {boolean} [options.debug=false] - 调试模式是否开启
   * @param {string} [options.name='ImageLoader'] - 打印器名称标记
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
   * @since 1.3.0
   */
  $image = null

  /**
   * fetch方法执行时绑定的blob对象
   *
   * @since 1.3.0
   */
  $blob = null

  /**
   * 获取image实例对应图片的地址
   * [注] 请确保在调用时，图片下载已完成
   *
   * @since 1.3.0
   * @getter
   * @readonly
   * @return {string}
   */
  get $currentSrc() {
    return this.$image && this.$image.currentSrc
  }

  /**
   * 获取image实例的设置宽度
   * [注] 请确保在调用时，图片下载已完成
   *
   * @since 1.3.0
   * @getter
   * @readonly
   * @return {string}
   */
  get $width() {
    return this.$image && this.$image.width
  }

  /**
   * 获取image实例对应图片的真实宽度
   * [注] 请确保在调用时，图片下载已完成
   *
   * @since 1.3.0
   * @getter
   * @readonly
   * @return {string}
   */
  get $naturalWidth() {
    return this.$image && this.$image.naturalWidth
  }

  /**
   * 获取image实例的设置高度
   * [注] 请确保在调用时，图片下载已完成
   *
   * @since 1.3.0
   * @getter
   * @readonly
   * @return {string}
   */
  get $height() {
    return this.$image && this.$image.height
  }

  /**
   * 获取image实例对应图片的真实高度
   * [注] 请确保在调用时，图片下载已完成
   *
   * @since 1.3.0
   * @getter
   * @readonly
   * @return {string}
   */
  get $naturalHeight() {
    return this.$image && this.$image.naturalHeight
  }

  /**
   * 获取当前文件扩展名
   * [注] 请确保在调用时，图片下载已完成
   *
   * @since 1.3.0
   * @getter
   * @readonly
   * @return {string}
   */
  get $ext() {
    return this.$image && _actions.getExtension(this.$currentSrc)
  }

  /**
   * 获取当前文件的mime类型
   * 仅在调用{@link ImageLoader#fetch}方法时有效
   *
   * @since 1.3.0
   * @getter
   * @readonly
   * @return {string}
   */
  get $mime() {
    return this.$blob && this.$blob.type
  }

  /**
   * 获取当前文件的大小，单位：字节
   * 仅在调用{@link ImageLoader#fetch}方法时有效
   *
   * @since 1.3.0
   * @getter
   * @readonly
   * @return {string}
   */
  get $size() {
    return this.$blob && this.$blob.size
  }

  /**
   * 载入图片
   *
   * @since 1.3.0
   * @param {string} imgSrc - 图片地址
   * @param {number} width - 图片显示的宽
   * @param {number} height - 图片显示的高
   * @returns {Promise}
   */
  load(imgSrc, width, height) {
    return new Promise((resolve, reject) => {
      this.$image = new Image(width, height)

      // 启用跨域请求
      this.$image.crossOrigin = '*'

      this.$image.addEventListener('load', () => {
        this._logger.log('image load successed!', this.$currentSrc)
        this.emit('load').then((result) => {
          resolve(result)
        }).catch(() => {
          resolve()
        })
      })

      this.$image.addEventListener('error', async () => {
        this._logger.log('image load error!', this.$currentSrc)
        this.emit('error').then((result) => {
          reject(result)
        }).catch(() => {
          reject()
        })
      })

      this.$image.src = imgSrc
    })
  }

  /**
   * 图片地址转换为base64格式
   * 若未指定imgSrc则编码当前已载入的图片，若指定了imgSrc则下载图片并导出最终结果
   *
   * @param {string} [imgSrc] - 图片地址
   * @param {string} [format] - 输出的图片格式，默认保存原图片后缀格式
   * @returns {Promise}
   */
  base64(imgSrc, format) {
    return new Promise((resolve, reject) => {
      if (validation.isString(imgSrc)) {
        this.load(imgSrc).then(() => {
          resolve()
        }).catch((err) => {
          reject(err)
        })
      } else {
        resolve()
      }
    }).then(() => {
      let canvas = document.createElement('CANVAS')
      canvas.width = this.$width
      canvas.height = this.$height

      const context = canvas.getContext('2d')
      context.drawImage(this.$image, 0, 0)

      const mimeType = format ? _actions.getMimeType(format) : _actions.getMimeType(_actions.getExtension(imgSrc))

      return canvas.toDataURL(mimeType)
    })
  }

  /**
   * 以ajax方式获取图片资源，该方式获取的资源可以统计资源的容量大小
   * 此时，可以取实例上的{@link ImageLoader#$mime}和{@link ImageLoader#$size}两个实例属性
   * [注] 若图片地址是dataURL格式，则直接返回dataURL，且{@link ImageLoader#$size}对应的是dataURL的容量大小（并不是原图片的容量大小）
   *
   * @param {string} [imgSrc] - 图片地址
   * @returns {Promise}
   */
  fetch(imgSrc) {
    // 如果已经是base64格式
    return new Promise((resolve, reject) => {
      const matched = imgSrc.match(_actions.BASE64_REG)

      // 如果本身是base64
      if (matched) {
        this.$blob = _actions.dataURLToBlob(imgSrc)
        return this.load(imgSrc).then(() => {
          return resolve(imgSrc)
        })
      }

      _actions.ajax(imgSrc, 'get', 'blob').then((result) => {
        // 执行成功事件
        this.emit('load').then((emitResult) => {
          return Promise.resolve(emitResult)
        }).catch((err) => {
          return Promise.resolve(err)
        }).then(() => {
          this.$blob = result.response
          _actions.blobToDataURL(result.response).then((dataURL) => {
            resolve(dataURL)
          })
        })
      }).catch(() => {
        // 执行失败事件
        this.emit('error').then((errResult) => {
          return Promise.reject(errResult)
        }).catch((err) => {
          return Promise.reject(err)
        }).catch((err) => {
          reject(err)
        })
      })
      // // 非base64格式
      // Promise.all([
      //
      //   this.load(imgSrc),
      // ]).then((result) => {
      //
      //
      // }).catch((err) => {
      //   reject(err)
      // })
    })
  }
}

export default ImageLoader