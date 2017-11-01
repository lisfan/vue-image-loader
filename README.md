# vue-image-loader

## vue指令插件-图片加载器

[API documentation](https://lisfan.github.io/vue-image-loader/)

## Feature 特性

- 图片在加载之前会使用透明图片抢先占位，接着才进入加载图片逻辑
- 图片请求失败时，使用占位图片代替，占位图片也请求失败时，则使用透明图片代替（避免在某些浏览器里会出现'叉'）

## Detail 详情

- [注意]：若图片地址需要在请求接口完成后才能取到真实地址，则需要保证接口请求完成再触发该指令，否则会因为空地址而请求了占位图片
- 支持img标签或者非img标签的背景图片加载
- 图片地址变化时，自动响应图片更新
- 若图片已加载过，那么下一次再加载该图片时会直接显示，会忽略图片加载的动效，你可以通过设置(force修饰符)来决定是否强制启用每次动效载入
- 可选的自定义目标DOM的宽高尺寸，宽高之间使用`x`符风格，（只指定宽度时，则高度等同于宽度)，如：v-image-loader:300x400，（假设UI稿尺寸是基于设备物理尺寸放大2倍的基础上设计的，一般直接取ui稿的尺寸即可，内部会根据remRatio配置项自动计算成rem单位）
- 可选的自定义图片载入动效类名，如：v-image-loader="'mj-ani-fadeIn'"
- 动画样式的规则参考了`vue`的`transition`组件定义过渡的方式，动画样式定义时有如下规则:
  - 图片加载时DOM更改样式为'mj-ani-fadeIn-enter'，可以在这个类名上定义一些基础样式
  - 图片加载过程中DOM更改为'mj-ani-fadeIn-enter-active'，可以在这个类名上定义真正需要动画的样式
  - 图片加载结束后更改为'mj-ani-fadeIn-enter-end'，（这么做的原因是，css3动效的触发条件是这一次的动效必须与上一次的动画不同，所以需要有个变化，而我们又需要有一个动效结束后固定样式，所以如果没有end这个类的话，就无法体现与上一次的不同）
  - 暂时没有图片移除动效

## Install 安装

```bash
npm install -S @~lisfan/vue-image-loader
```

## Usage 起步

```js
import Vue from 'vue'
import VueImageLoader from '@~lisfan/vue-image-loader'

// 注册指令
// 以下是默认值
Vue.use(VueImageLoader,{
    debug: false, // 关闭调试模式
    remRatio: 100, // rem和px的比例
    animate: true, // 开启动效
    force: false, // 每次加载动效
})
```

```html
// 在img标签上使用，会被当成src图片
- 使用格式：<img :placeholder='占位图片地址' :image-src="请求的图片地址" v-image-loader:WIDTHxHEIGHT='动效类名' />
// 使用方法：<img :placeholder='phImgSrc' :image-src="imageSrc" v-image-loader:[[width]x[height]].[force]=[animationClassName] />

<img :placeholder='phImgSrc' :image-src="imageSrc" v-image-loader:[500x300].[force]=[mj-ani-fadeIn] />


// 在非image标签上使用：会被当成背景图
<!img :placeholder='phImgSrc' :image-src="imageSrc" v-image-loader:500x300='mj-ani-fadeIn'></!img>
```