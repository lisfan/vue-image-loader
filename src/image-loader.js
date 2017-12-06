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
  BASE64_REG: /data:(.*);base64,/,
  /**
   * 获取图片扩展名
   * 1. 如果图片地址是base64格式
   * 2. 兼容了又拍云的图片处理，如path/to/source.jpg!both/100x100这样的格式
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
   * 获取图片mime类型
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
   * 简易ajax
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

        console.log(xhr.getResponseHeader('content-type'))

        resolve(this)
      }

      xhr.onerror = function (err) {
        reject(err)
      }

      xhr.send()
    })
  },
  /**
   * base64转blob
   * @param dataurl
   * @returns {*}
   */
  dataURLtoBlob(dataUrl) {
    const arr = dataUrl.split(',')

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

class ImageLoader extends EventQueues {
  /**
   * 默认配置选项
   * 为了在生产环境能开启调试模式
   * 提供了从localStorage获取默认配置项的措施
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
    successHook: 'success', // 载入成功钩子
    errorHook: 'error' // 载入失败钩子
  }

  /**
   * 更新默认配置选项
   *
   * @since 1.3.0
   * @static
   * @param {object} options - 配置参数
   * @param {boolean} [options.debug] - 调试模式是否开启
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
   * @
   * @param {object} [options] - 实例配置选项，若参数为`string`类型，则表示设定为`options.name`的值
   * @param {string} [options.name] - 日志器命名空间
   * @param {boolean} [options.debug] - 调试模式是否开启
   */
  constructor(options) {
    super({
      ...ImageLoader.options,
      ...options
    })
  }

  /**
   * 获取实例配置的载入成功事件钩子
   *
   * @since 1.3.0
   * @getter
   * @readonly
   * @return {string}
   */
  get $successHook() {
    return this.$options.successHook
  }

  /**
   * 获取image实例对应图片的地址
   *
   * @since 1.3.0
   * @getter
   * @readonly
   * @return {string}
   */
  get $currentSrc() {
    return this.$image.currentSrc
  }

  /**
   * 获取image实例的设置宽度
   *
   * @since 1.3.0
   * @getter
   * @readonly
   * @return {string}
   */
  get $width() {
    return this.$image.width
  }

  /**
   * 获取实例配置的载入失败事件钩子
   *
   * @since 1.3.0
   * @getter
   * @readonly
   * @return {string}
   */
  get $errorHook() {
    return this.$options.errorHook
  }

  /**
   * 获取image实例对应图片的真实宽度
   *
   * @since 1.3.0
   * @getter
   * @readonly
   * @return {string}
   */
  get $naturalWidth() {
    return this.$image.naturalWidth
  }

  /**
   * 获取image实例对应图片的真实高度
   *
   * @since 1.3.0
   * @getter
   * @readonly
   * @return {string}
   */
  get $naturalHeight() {
    return this.$image.naturalHeight
  }

  /**
   * 获取image实例的设置高度
   *
   * @since 1.3.0
   * @getter
   * @readonly
   * @return {string}
   */
  get $height() {
    return this.$image.height
  }

  /**
   * 获取当前文件扩展名
   *
   * @since 1.3.0
   * @getter
   * @readonly
   * @return {string}
   */
  get $ext() {
    return _actions.getExtension(this.$currentSrc)
  }

  /**
   * 获取当前文件的mime类型
   *
   * @since 1.3.0
   * @getter
   * @readonly
   * @return {string}
   */
  get $mime() {
    return this.$blob.type
  }

  /**
   * 获取当前文件的大小
   *
   * @since 1.3.0
   * @getter
   * @readonly
   * @return {string}
   */
  get $size() {
    return this.$blob.size
  }

  /**
   * 下载图片
   * 调用属性时，请确保图片已下载完毕
   *
   * @since 1.3.0
   * @param {string} imgSrc - 图片地址
   * @returns {Function} - 返回自定义颜色的打印方法
   */
  load(imgSrc, width, height) {
    return new Promise((resolve, reject) => {
      this.$image = new Image(width, height)

      this.$image.crossOrigin = '*' // 跨域请求

      this.$image.addEventListener('load', () => {
        this._logger.log('image load successed!', this.$currentSrc)
        this.emit(this.$successHook).then((result) => {
          resolve(result)
        }).catch(() => {
          resolve()
        })
      })

      this.$image.addEventListener('error', async () => {
        this._logger.log('image load error!', this.$currentSrc)
        this.emit(this.$errorHook).then((result) => {
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
   * @param imgSrc
   */
  base64(imgSrc, format = 'image/jpeg') {
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

      const base64Image = canvas.toDataURL(_actions.getMimeType(_actions.getExtension(imgSrc)), format)

      canvas = null

      return base64Image
    })
  }

  /**
   * 以ajax方式获取图片
   * @param imgSrc
   * @returns {Promise}
   */
  fetch(imgSrc) {
    // 如果已经是base64格式
    return new Promise((resolve, reject) => {
      const matched = imgSrc.match(_actions.BASE64_REG)

      // 如果本身是base64
      if (matched) {
        this.$blob = _actions.dataURLtoBlob(imgSrc)

        return resolve(imgSrc)
      }

      // 非base64格式
      return _actions.ajax(imgSrc, 'get', 'blob').then((result) => {
        this.$blob = result.response

        const fileReader = new FileReader()

        fileReader.onload = (event) => {
          resolve(event.target.result)
        }

        fileReader.onerror = (err) => {
          reject(err)
        }

        fileReader.readAsDataURL(this.$blob)
      }).catch((err) => {
        reject(err)
      })
    })
  }
}

export default ImageLoader
