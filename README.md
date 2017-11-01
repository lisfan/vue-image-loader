# logger 日志打印器

[API documentation](https://lisfan.github.io/logger/)

## Feature 特性

- 解决提交时因eslint提示console的语句无法通过问题
- 仅在开发环境打印日志，生产环境不打印日志

## Detail 详情

- 在console上包装了一层，支持console的所有的方法（包含部分非标准APi，但不包含未被废弃的API），部分API做了变化和新增加，未提及的保原效果不变，只是在原api上封装了一层进行代理运行，API使用方法可以参考[console API](https://developer.mozilla.org/en-US/docs/Web/API/Console/group)
  - 新增的isActivated、color、enable、disable方法
  - 调整error方法的作用：打印时会抛出错误，阻止脚本执行
  - 调整table方法的作用：如果数据非array或object类型，则使用this.log打印
- 若需要在生产环境下调式日志，可以更改或设置LS离线存储的值
   - localStorage设置`IS_DEV`为true
   - localStorage设置`LOGGER_RULES`配置命名空间规则
- 支持配置整个命名空间是否输出日志
- 支持配置命名空间下某个实例方法是否输出日志

## Install 安装

```bash
npm install -S @~lisfan/logger
```

## Usage 起步

``` js
import Logger from '@~lisfan/logger'

// 配置规则
Logger.configRules({
   request:true, // 该命名空间支持打印输出
   request.error:false, // 该命名空间下的error方法不支持打印输出
   response:false // 该命名空间不支持打印输出
})

const logger = new Logger() // 默认打印器，命名空间为`logger`
const loggerRequest = new Logger('request') // 创建命名空间为`request`的打印器
const loggerResponse = new Logger('response')

// 创建打印器，但关闭调试功能
const loggerDebug = new Logger({
   name: 'debug',
   debug: false
})

loggerRequest.log('请求url')    =>    [request]: 请求url
loggerRequest.error('请求url')    =>    // 无内容打印
loggerResponse.error('响应数据')    =>    // 无内容打印
loggerDebug.log('请求url')    =>     // 无内容打印
```


  *
  * ## 特性
  * - 图片加载之前会使用透明图片置换，接着才是加载图片逻辑
  * - 图片请求失败时，使用占位图片代替，占位图片也请求失败时，则继续使用透明图片代替（避免在某些浏览器里会出现'叉'）
  * - 图片地址变化时，自动响应图片更新
  * - 若图片已加载过，那么下一次再加载该图片时会直接显示（比如会忽略图片加载的动效），可以通过设置(forceEffect字段)决定是否强制启用每次动效载入
  * - 支持img标签或者非img标签的背景图片加载
  * - 可选的指定加载图片的目标节点的高宽尺寸（只指定一项时，另一边则同值，需同时指定），直接取ui稿的即可（会自动计算成rem单位），如v-image-load:100x200
  * - 可选的自定义图片载入动效（会受全局动效配置级别的影响），如：v-image-load="'mj-ani-fadeIn'"
  * - 动画样式的规则参考了vue的transition组件定义过渡的方式，动画样式定义时有如下规则
  *  -
  * 图片加载时更改为'mj-ani-fadeIn-enter'样式，图片加载过程中更改为'mj-ani-fadeIn-enter-active'，图片加载结束后更改为'mj-ani-fadeIn-end'（这么做的原因是，css3动效的触发条件是这一次的动效必须与上一次的动画不同，所以需要有个变化，而我们又需要有一个动效结束后固定样式，所以如果没有end这个类的话，就无法体现与上一次的不同）
  *  - 没有图片移除动效
  * - 使用格式：<img :placeholder='占位图片地址' :image-src="请求的图片地址" v-image-load:WIDTHxHEIGHT='动效类名' />
  *
  * ## Changelog

  *
  * ## Todo
  *
  * ## Usage
  *
  * ```js
  *
  * ./config.js
  *
  * import Vue from 'vue'
  * import imageLoad from 'plugins/directives/image-load'
  *
  * Vue.use(imageLoad)
  * ```
  *
  * ```html
  * <img :placeholder='phImgSrc' :image-src="imageSrc" v-image-load:500x300='mj-ani-fadeIn' />
  * or
  * <!img :placeholder='phImgSrc' :image-src="imageSrc" v-image-load:500x300='mj-ani-fadeIn'></!img>
  * ```