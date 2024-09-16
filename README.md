# 规范系列:
### 命名

- 组件文件: 首字母大写
- 文件夹: 小写
- 变量: 小驼峰

### 组织结构

> 根据功能划分文件夹结构
#### components

```js
├─ components 存放公共组件
│  ├─ message 以文件夹起始,样式抽离为单独文件
│  │  ├─ index.less
│  │  └─ index.vue
```

#### pages

```js
├─ pages              存放页面组件
   ├─ home            主页
      ├─ components   主页中抽离的组件
      │  └─ Form      样式单独抽离
      │     ├─ index.less
      │     └─ index.vue
      └─ index.vue    主页组件
```

#### stores

```js
├─ stores    全局状态管理
   ├─ user   分模块定义
   │  ├─ index.ts    定义数据
   │  ├─ type.ts     定义ts类型
   │  └─ useUserStore.ts   定义store的获取,修改等hook,
   └─ index.ts             将hook在此导出
```

#### service

```js
service
├─ request
│  ├─ axios.ts      // axios封装
│  ├─ config.ts     // 请求配置
│  ├─ httpTools.ts  // 封装相关的方法
│  └─ index.ts      // 封装的get post方法
└─ user.ts          // 服务模块相关的请求
```

# 基础框架搭建技术选型

| 功能       | 目的                              | 实现方式                                               | 理由                                                         |
| ---------- | --------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| 基础框架   |                                   | vue3+typescript                                        | ts提供近似强类型规范,将大量bug控制在开发阶段                 |
| 组件库     | 防止组件重复封装,统一组件样式风格 | element plus                                           | 支持vue3                                                     |
| 路由       | 管理各个页面之间的关系            | vue-router                                             | 与vue配套,                                                   |
| 规范工具链 | 代码质量,可读可维护               | eslint+prettier+stylelint+commitlint+husky+lint-staged | 业界最佳实践                                                 |
| 请求封装   | 统一请求管理                      | axios                                                  | 稳定,                                                        |
| css模块化  | 保证各个页面样式独立,防止全局污染 | less模块化方案                                         | vite天然支持                                                 |
| 常用工具库 | 提升开发效率                      | lodsh,classnams,autoprefixer等                         | 1.防止大量重复封装<br />2.完成框架部分基础建设如: css兼容,初始化css样式,响应式等 |
| 状态管理   | 应用中的数据仓库                  | pinia                                                  | 相比vuex,更轻量级,更易用                                     |
| 打包工具   | 编译代码                          | vite                                                   | 与vue配套,速度比webpack更快,开发体验好                       |

# 框架搭建

### vite初始化

```js
npm create vite@latest
```

vite.config.js中添加配置

##### 别名

```js
import path from 'path';
const config = defineConfig({
  // ...
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.scss', '.css'],
    alias: {
      '@': path.resolve(__dirname, 'src'), // 源文件根目录
      '@tests': path.resolve(__dirname, 'tests'), // 测试文件根目录
      '@config': path.resolve(__dirname, 'config') // 配置文件根目录
    }
  }
});
```

tsconfig.js

```js
"compilerOptions": {
    // 使用别名时避免ts语法检查找不到类型声明
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
},
```

node模块解析,否则使用node模块会提示报错

```js
npm i --save-dev @types/node
```

##### dev-server

```js
const config = defineConfig({
  server: {
    open: true, // 自动打开浏览器
    port: 3000, // 服务端口
      hmr:true,
    proxy: {
      '/api': {
        target: '',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '')
      }, // api代理路径
      '/mock': '' // mock代理路径,
    }
  }
});
```

##### 打包分析插件

类似:webpack-bundle-analyzer

```js
npm i rollup-plugin-visualizer

vite.config.js:
import { visualizer } from 'rollup-plugin-visualizer';
    plugins: [
      visualizer({
        open: true, // 是否打包后自动展示
        gzipSize: true,
        brotliSize: true
      })
    ],
```

##### Gzip压缩

```js
npm i -D vite-plugin-compression

vite.config.js:
plugin:[
      // Gzip压缩,上线时需要nginx也开启gzip压缩
      viteCompression({
        filter: /\.(js|css|json|txt|html|ico|svg)(\?.*)?$/i, // 需要压缩的文件
        threshold: 1024, // 文件容量大于这个值进行压缩
        algorithm: 'gzip', // 压缩方式
        ext: 'gz', // 后缀名
        deleteOriginFile: false // 压缩后是否删除压缩源文件
      })
]
```

##### 图片压缩

```js
npm i vite-plugin-imagemin -D
npm install vite-plugin-minipic -D
//全部下载失败
```

##### 分包

使bundle更具内容生成hash进行命名,以便利用浏览器缓存机制

初步分包策略:

1. node_module中一些全局要用的公共库单独打成一个bundle,这些是首页必须要加载的
2. 将其他非公共包单独打成一个bundle,当某个非公共库比较大的时候,也可以单独打包
3. 动态导入的包单独一个bundle
4. 其他文件单独打一个包

```js
build: {
  rollupOptions: {
    output: {
      chunkFileNames: 'js/[name]-[hash:10].js', // 引入文件名的名称
      entryFileNames: 'js/[name]-[hash:10].js', // 包的入口文件名称
      assetFileNames: '[ext]/[name]-[hash:10].[ext]', // 资源文件像 字体，图片等
      manualChunks(id: string) {
        const isNodeModule = id.includes('node_modules');
        const isVue = /[\\/]node_modules[\\/]vue[\\/]/.test(id);
        const isElePlus = /[\\/]node_modules[\\/]element-plus[\\/]/.test(id);
        const isPinia = /[\\/]node_modules[\\/]pinia[\\/]/.test(id);
        const isVueRouter = /[\\/]node_modules[\\/]vue-router[\\/]/.test(id);

        if (isVue || isElePlus || isPinia || isVueRouter) {
          return 'common';
        }

        if (isNodeModule) {
          return 'vendor';
        }
      }
    }
  }
},
```

##### 兼容ie

```js
//引入
import legacyPlugin from '@vitejs/plugin-legacy'
plugins: [
   legacyPlugin({
     targets: ['chrome 52'], // 需要兼容的目标列表，可以设置多个
     additionalLegacyPolyfills: ['regenerator-runtime/runtime'] // 面向IE11时需要此插件
   })
]
```

##### css3兼容

css3属性自动添加兼容前缀

```js
npm i autoprefixer -S

vite.config.js:

import autoprefixer from 'autoprefixer';

    postcss: {
      plugins: [
        // css3兼容前缀
        autoprefixer({
          overrideBrowserslist: ['Android 4.1', 'iOS 7.1', 'Chrome > 31', 'ff > 31', 'ie >= 8']
        })
      ]
    },
```

##### 自动引入插件

1. 对开发者来说不用显式的导入vue等API,直接使用即可

   ```js
   npm install unplugin-auto-import -D

   vite.config.js:
     AutoImport({
       dts: 'auto-imports.d.ts', // 这里是生成的global函数文件
       imports: ['vue', 'vue-router'], // 需要自动导入的插件
       include: [
         /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
         /\.vue$/,
         /\.vue\?vue/, // .vue
         /\.md$/ // .md
       ],
       // 解决eslint报错问题
       eslintrc: {
          // 这里先设置成true然后npm run dev 运行之后会生成 .eslintrc-auto-import.json 文件之后，在改为false
         enabled: true,
         filepath: './.eslintrc-auto-import.json', // 生成的文件路径
         globalsPropValue: true
       }
     })

   为了防止eslint,ts报错,需要将生成的类型文件地址和eslint配置文件配一下:
   eslint配置文件:
     extends: [
         ...
       './.eslintrc-auto-import.json'
     ],
   tsconfig.json:
     "include": ["./auto-imports.d.ts"],
   ```

2. 自动引入组件,如ElementPlus,Antd Vue等

   ```js
   npm install unplugin-vue-components -D
   
   vite.config.js:
   import AutoComponents from 'unplugin-vue-components/vite';
   import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
   
       plugins: [
         AutoImport({
             ...
           resolvers: [ElementPlusResolver()],
             ...
         }),
         AutoComponents({ resolvers: [ElementPlusResolver()] })
       ],
   ```

##### svg图标处理

安装插件:

```js
npm i --save-dev vite-plugin-svg-icons
```

vite.config.js中配置:

```js
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons';

在plugin中配置:
createSvgIconsPlugin({
// 指定需要缓存的图标文件夹
iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
// 指定symbolId格式,icon-是自己加的前缀,与svg-icon组件中name的前缀对应
symbolId: 'icon-[name]'
})
```

##### vite通用组件自动化注册

### 编辑器格式化

新建``.editorconfig`

```js
# 官网: https://EditorConfig.org
# gitHub: https://github.com/editorconfig/editorconfig/wiki/EditorConfig-Properties

# top-most EditorConfig file
# 表示是最顶层的配置文件，设为 true 时，停止向上查找
root = true

# Unix-style newlines with a newline ending every file
[*]

# 通用配置 -----------

# 缩进方式
indent_style = space
# 设置换行符，值为 lf(换行)、cr(回车) 和 crlf(回车换行)
end_of_line = lf
# 编码格式
charset = utf-8
# 是否删除行尾空格
trim_trailing_whitespace = true
# 缩进大小
indent_size = 2
# 行最大长度
max_line_length = off

# 匹配文件配置,将覆盖同名通用配置

# Matches multiple files with brace expansion notation
# Set default charset
[*.{js}]
charset = utf-8


# Tab indentation (no size specified)
[Makefile]
indent_style = space

# Indentation override for all JS under lib directory
[lib/**.js]
indent_style = space
indent_size = 2

# Matches the exact files either package.json or .travis.yml
[{package.json,.travis.yml}]
indent_style = space
indent_size = 2

```



### Eslint

1. ```js
   npm init @eslint/config // 安装最新的eslint并初始化,容易依赖版本出现问题
   ```

2. ```js
   如果上述命令导致版本依赖问题,可以分开执行
   
   npm i eslint@8.57.0 -D // 安装指定版本的eslint
   npx eslint --init //再进行初始化
   ```

3. ##### 按照需要进行问答式初始化配置

   ```js
   You can also run this command directly using 'npm init @eslint/config'.
   √ How would you like to use ESLint? · problems
   √ What type of modules does your project use? · esm
   √ Which framework does your project use? · vue
   √ Does your project use TypeScript? · No / Yes
   √ Where does your code run? · browser
   √ What format do you want your config file to be in? · JavaScript
   The config that you've selected requires the following dependencies:

   @typescript-eslint/eslint-plugin@latest eslint-plugin-vue@latest @typescript-eslint/parser@latest
   √ Would you like to install them now? · No / Yes
   √ Which package manager do you want to use? · npm
   Installing @typescript-eslint/eslint-plugin@latest, eslint-plugin-vue@latest, @typescript-eslint/parser@latest

   added 32 packages in 6s
   Successfully
   ```

4. ##### package.json中配置检查命令:

   ```js
   "script": {
       "lint:script": "eslint --ext .ts,.vue --ignore-path .gitignore --fix src"
   }

   //修复src下的ts文件和vue文件,并根据.gitignore获取其中指定文件
   ```

5. ##### 其他配合的包

   ```js
   eslint-plugin-import:
   airbnb所需的依赖，检测js import语句是否正确

   eslint-config-airbnb-base:
   airbnb风格的代码规范,只涉及js

   vite-plugin-eslint
   在vite运行时检测代码是否符合eslint规范

   npm i -D eslint-plugin-import eslint-config-airbnb-base vite-plugin-eslint

   vite-plugin-eslint:需要在vite.config中使用以下:

   import viteEslint from 'vite-plugin-eslint';
     plugins: [
       react(),
       viteEslint({
         failOnError: false //检测到错误是否停止运行
       })
     ],
   ```

6. ##### 修改eslint配置文件

   ```js
   module.exports = {
     env: {
       browser: true,
       es2021: true
     },
     extends: [
       'plugin:@typescript-eslint/recommended', // ts规则
       'plugin:vue/vue3-recommended', // 使用插件支持vue3
       'airbnb-base', // 基础js规则
       'plugin:prettier/recommended' // prettier和eslint的冲突
     ],
     overrides: [
       {
         env: {
           node: true
         },
         files: ['.eslintrc.{js,cjs}'],
         parserOptions: {
           sourceType: 'script'
         }
       }
     ],
     parserOptions: {
       ecmaVersion: 'latest',
       parser: '@typescript-eslint/parser',
       sourceType: 'module'
     },
     plugins: ['@typescript-eslint', 'vue'],
     rules: {
       'prettier/prettier': 'error',
       'arrow-body-style': 'off',
       'prefer-arrow-callback': 'off',
       'no-unused-vars': 'error',
       'no-debugger': 2,
       'no-alert': 2,
       'no-dupe-keys': 2,
       'no-dupe-args': 2,
       'no-use-before-define': [2, { functions: false }],
       '@typescript-eslint/no-explicit-any': ['off'],
       'react/prop-types': 'off', // 使用ts的参数类型检查
       'import/extensions': 0,
       'prefer-template': 0,
       'no-var': 'error', // 要求使用 let 或 const 而不是 var
       'no-multiple-empty-lines': ['error', { max: 1 }], // 不允许多个空行
       'prefer-const': 'off', // 使用 let 关键字声明但在初始分配后从未重新分配的变量，要求使用 const
       'no-irregular-whitespace': 'off', // 禁止不规则的空白\
       'import/no-cycle': 0,
       'no-nested-ternary': 0,
       'import/prefer-default-export': 0,
       'import/no-unresolved': 0,
       'prefer-destructuring': 0,
       'no-shadow': 0,
       'no-param-reassign': 0,
       'consistent-return': 0,
       'no-case-declarations': 0,
       'prefer-promise-reject-errors': 0,
       'jsx-a11y/click-events-have-key-events': 0,
       'jsx-a11y/no-static-element-interactions': 0,
       camelcase: 0,
       'import/no-extraneous-dependencies': 0,
       'no-underscore-dangle': 0,
       'no-promise-executor-return': 0, // vue (https://eslint.vuejs.org/rules)
       'vue/script-setup-uses-vars': 'error', // 防止<script setup>使用的变量<template>被标记为未使用，此规则仅在启用该no-unused-vars规则时有效。
       'vue/v-slot-style': 'error', // 强制执行 v-slot 指令样式
       'vue/no-mutating-props': 'off', // 不允许组件 prop的改变
       'vue/no-v-html': 'off', // 禁止使用 v-html
       'vue/custom-event-name-casing': 'off', // 为自定义事件名称强制使用特定大小写
       'vue/attributes-order': 'off', // vue api使用顺序，强制执行属性顺序
       'vue/one-component-per-file': 'off', // 强制每个组件都应该在自己的文件中
       'vue/html-closing-bracket-newline': 'off', // 在标签的右括号之前要求或禁止换行
       'vue/max-attributes-per-line': 'off', // 强制每行的最大属性数
       'vue/multiline-html-element-content-newline': 'off', // 在多行元素的内容之前和之后需要换行符
       'vue/singleline-html-element-content-newline': 'off', // 在单行元素的内容之前和之后需要换行符
       'vue/attribute-hyphenation': 'off', // 对模板中的自定义组件强制执行属性命名样式
       'vue/require-default-prop': 'off', // 此规则要求为每个 prop 为必填时，必须提供默认值
       'vue/multi-word-component-names': 'off', // 要求组件名称始终为 “-” 链接的单词
     }
   };
   ```

### prettier

```js
npm install -D prettier eslint-config-prettier eslint-plugin-prettier

eslint-plugin-prettier: 使用 Prettier风格格式化代码
eslint-config-prettier: 配置eslint规则的prettier包，可以禁用 Prettier与 ESLint冲突的规则。
```

#### 配置文件.prettier.cjs

```js
module.exports = {
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  singleQuote: true,
  semi: true,
  trailingComma: 'none',
  bracketSpacing: true,
  quoteProps: 'as-needed',
  proseWrap: 'always', // 超过最大宽度是否换行<always|never|preserve>，默认preserve
  arrowParens: 'avoid', // 在单独的箭头函数参数周围包括括号 always：(x) => x \ avoid：x => x
  requirePragma: false, //无需顶部注释即可格式化
  insertPragma: false, //在已被preitter格式化的文件顶部加上标注
  trailingComma: 'none', //尾部逗号设置，es5是尾部逗号兼容es5，none就是没有尾部逗号，all是指所有可能的情况，需要node8和es2017以上的环境。（trailingComma: "<es5|none|all>"）
  bracketSameLine: false, // 将>多行 HTML（HTML、JSX、Vue、Angular）元素放在最后一行的末尾，而不是单独放在下一行（不适用于自关闭元素）<bool>，默认false
  singleAttributePerLine: true // 在 HTML、Vue 和 JSX 中强制执行每行单个属性<bool>，默认false
};
```

#### 忽略文件:

```js
# prettier忽略文件
node_modules/
dist/
*.yaml
*.md
```

### less && lint

`vite`内置了`less-loader`,只用安装编译器即可:

```js
npm install less -D
```

#### css模块化:

以xxx.module.less命名的样式文件,默认进行模块化处理

```js
import styles from "xxx.module.less"
```

#### vite配置less

```js
  css: {
    preprocessorOptions: {
      less: {
        math: 'always', // 直接写计算公式,不需要calc()
        additionalData: '@import "./src/global.less";  ' // 或者自动将全局变量文件引入每个less文件中
      }
    }
  },
```

#### lint:

```js
stylelint-config-rational-order: 给定的属性排序顺序 / stylelint-order: 可以自定义的顺序,在.stylelintrc.js中order/properties-order指定顺序(两个安装一个即可)
stylelint-config-standard: 基础规则集合
stylelint-config-prettier:解决和prettier的冲突,stylelint15版本的已经内置了,不需要安装
stylelint-less:针对less特定的规则
stylelint-config-recommended-less: less推荐的可共享配置
stylelint-config-standard-vue: lint vue文件中的样式
postcss-html:识别html/vue文件中的style标签

npm i -D stylelint stylelint-config-standard postcss postcss-less postcss-html stylelint-order stylelint-less stylelint-config-recommended-less stylelint-config-standard-vue
```

##### 配置文件.stylelintrc.cjs:

```js
module.exports = {
  extends: ['stylelint-config-standard', 'stylelint-config-recommended-less', 'stylelint-config-standard-vue'],
  plugins: ['stylelint-order'],
  customSyntax: 'postcss-less',
  // 不同格式的文件指定自定义语法
  overrides: [
    {
      files: ['**/*.(less|css|vue|html)'],
      customSyntax: 'postcss-less'
    },
    {
      files: ['**/*.(html|vue)'],
      customSyntax: 'postcss-html'
    }
  ],
  ignoreFiles: ['**/*.js', '**/*.jsx', '**/*.tsx', '**/*.ts', '**/*.json', '**/*.md', '**/*.yaml'],
  rules: {
    'no-descending-specificity': true, // 禁止在具有较高优先级的选择器后出现被其覆盖的较低优先级的选择器
    'selector-pseudo-element-no-unknown': [
      true,
      {
        ignorePseudoElements: ['v-deep']
      }
    ],
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['deep']
      }
    ],
    // 指定样式的排序
    'order/properties-order': [
      'position',
      'top',
      'right',
      'bottom',
      'left',
      'z-index',
      'display',
      'justify-content',
      'align-items',
      'float',
      'clear',
      'overflow',
      'overflow-x',
      'overflow-y',
      'padding',
      'padding-top',
      'padding-right',
      'padding-bottom',
      'padding-left',
      'margin',
      'margin-top',
      'margin-right',
      'margin-bottom',
      'margin-left',
      'width',
      'min-width',
      'max-width',
      'height',
      'min-height',
      'max-height',
      'font-size',
      'font-family',
      'text-align',
      'text-justify',
      'text-indent',
      'text-overflow',
      'text-decoration',
      'white-space',
      'color',
      'background',
      'background-position',
      'background-repeat',
      'background-size',
      'background-color',
      'background-clip',
      'border',
      'border-style',
      'border-width',
      'border-color',
      'border-top-style',
      'border-top-width',
      'border-top-color',
      'border-right-style',
      'border-right-width',
      'border-right-color',
      'border-bottom-style',
      'border-bottom-width',
      'border-bottom-color',
      'border-left-style',
      'border-left-width',
      'border-left-color',
      'border-radius',
      'opacity',
      'filter',
      'list-style',
      'outline',
      'visibility',
      'box-shadow',
      'text-shadow',
      'resize',
      'transition'
    ]
  }
};

```

##### 忽略文件.stylelintignore:

```js
*.js
*.ts
*.tsx
*.jsx
*.jpg
*.png
*.ttf
*.svg
node_modlue/**/*
dist/**/*
```

#### 配置命令:

```js
package.json:
  "scripts": {
    "lint:style": "stylelint \"src/**/*.(less|css)\" --fix",
  },
```

### Husky

在commit 的生命周期中自动代码校验,比如:在commit时,检验代码,不合格不可以commit

```js
npm install husky@^7.0.1 --save-dev
```

初始化配置文件,会在当前目录创建.husky目录，这里将是放置husky hooks的地方

```js
npx husky init
```

并且会在package.json中自动添加命令,配置husky自动安装,便于团队使用,如此执行完npm install，将自动执行`husky install`初始化husky配置

```js
"scripts": {
    "prepare": "husky install"
}
```

添加pre-commit hook将在下文配置完lint-staged之后统一添加:

### lint-staged

lint-staged可以只针对待提交区(staged)的文件做一些处理

```js
npm install lint-staged@^15.2.0 -D
```

在pre-commit钩子中自动执行lint-staged:

```js
npx husky add .husky/pre-commit "npx --no-install lint-staged"

win10下可能无效,需要手动创建文件 .husky/pre commit:
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no-install lint-staged
```

package.json配置一下lint-staged:

```js
{
  "lint-staged": {
    "src/**/*.{css,less}": [ //对src下样式文件进行校验
      "prettier --write --parser css"
    ],
    "src/**/*.{ts,tsx,js,jsx,vue}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

### commit && 交互式提交

#### commitlint

```js
npm install --save-dev @commitlint/config-conventional @commitlint/cli
```

新建.commitlintrc.cjs并添加配置信息:

```js
module.exports = {
  extends: ['@commitlint/config-conventional'],
}
```

添加commit-msg钩子:

```js
npx husky add .husky/commit-msg "npx --no -- commitlint --edit $1"

win10下可能无效,需要手动创建.husky/commit-msg:
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit
```

这样在git提交的时候,就会在commit-msg这个钩子中对提交信息进行校验

#### 交互式提交

@commitlint/cz-commitlint是commitlint官方提供的,配置项主要包括：messages和questions两部分。

安装依赖:

```js
npm install @commitlint/cz-commitlint commitizen -D
```

package.json中配置commitizen:

```js
"config": {
    "commitizen": {
      "path": "@commitlint/cz-commitlint"
    }
}
```

.commitlintrc.js并新增配置信息:

```js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  prompt: {
    settings: {
      enableMultipleScopes: true, // 支持多scope
      scopeEnumSeparator: ',' // 多scope分隔符
    },
    messages: {
      skip: '<可跳过>',
      max: '最多输入 %d 个字符',
      min: '至少需要输入 %d 个字符',
      emptyWarning: '不能为空',
      upperLimitWarning: '超过长度限制',
      lowerLimitWarning: '未达到最少数字要求'
    },
    questions: {
      type: {
        description: '选择你要提交的信息类型 ',
        enum: {
          feat: {
            description: '新功能',
            title: 'Features',
            emoji: '✨'
          },
          fix: {
            description: '修复bug',
            title: 'Bug Fixes',
            emoji: '🐛'
          },
          docs: {
            description: '书写文档',
            title: 'Documentation',
            emoji: '📚'
          },
          style: {
            description: '代码格式化(空格, 格式化, 分号等)',
            title: 'Styles',
            emoji: '💎'
          },
          refactor: {
            description: '代码重构',
            title: 'Code Refactoring',
            emoji: '📦'
          },
          perf: {
            description: '性能优化提升',
            title: 'Performance Improvements',
            emoji: '🚀'
          },
          test: {
            description: '测试',
            title: 'Tests',
            emoji: '🚨'
          },
          build: {
            description: '调整构建或者依赖',
            title: 'Builds',
            emoji: '🛠'
          },
          ci: {
            description: '调整持续集成',
            title: 'Continuous Integrations',
            emoji: '⚙️'
          },
          chore: {
            description: '变更构建流程或者辅助工具',
            title: 'Chores',
            emoji: '♻️'
          },
          revert: {
            description: '代码回退',
            title: 'Reverts',
            emoji: '🗑'
          }
        }
      },
      scope: {
        description: '提交信息类型(模块、组件、页面)'
      },
      subject: {
        description: '简洁明了的修改摘要'
      },
      body: {
        description: '详细的调整信息描述'
      },
      isBreaking: {
        description: '是否有非兼容性的调整？'
      },
      breaking: {
        description: '请输入非兼容调整的详细描述'
      },
      isIssueAffected: {
        description: '是否有关闭 issue'
      },
      issues: {
        description: '列举关闭的 issue (例如 "fix #123", "re #123")'
      }
    }
  }
}
```

git commit`命令需要统一调整为 `:`npx git-cz`,亦可以将改命令添加到package.json中,方便后续使用:

```js
"scripts": {
    "commit": "npx git-cz"
},
```

### 状态管理pinia

```js
npm install pinia
```

状态管理文件结构推荐:

```js
├─ stores    全局状态管理
   ├─ user   分模块定义
   │  ├─ index.ts    定义数据
   │  ├─ type.ts     定义ts类型
   │  └─ useUserStore.ts   定义store的获取,修改等hook,
   └─ index.ts             将hook在此导出
```

### 路由

```js
npm i vue-router -S

目录:
routes
└─ index.ts

index.ts:
import { createWebHashHistory, createRouter } from 'vue-router';

import HomeView from '@/pages/home/index.vue';

const routes = [
  { path: '/', component: HomeView },
  { path: '/about', component: () => import('@/pages/page1/index.vue') } // 动态导入
];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
});

export default router;
```

### 组件库

组件的自动引入已经在vite初始化时,配置过了,这里直接安装组件库即可

```js
npm install element-plus --save
```

### 响应式 && 移动端高清适配

### 请求Axios

```js
npm i axios -S
```

### 请求hook

useRequest: 返回请求状态,请求数据,错误内容等

### TailwindCss

高定制化,高复用性,高自由度,响应式,适合前台项目

```js
安装:
npm install -D tailwindcss postcss autoprefixer

初始化:生成tailwind.config.js和postcss.config.js
npx tailwindcss init

修改配置文件:tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"], //指定文件范围
  theme: {
    extend: {},
  },
  plugins: [],
}

全局样式文件中加入:
@tailwind base;
@tailwind components;
@tailwind utilities;

main.ts中引入该样式文件即可使用
```

配合vscode插件使用效果更佳:Tailwind CSS IntelliSense

### vueuse

#### pinia持久化

**[pinia-plugin-persistedstate](https://github.com/prazdevs/pinia-plugin-persistedstate)**

```js
npm i pinia-plugin-persistedstate -S
```

1. 初始化

   ```js
   import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

   const pinia = createPinia();
   pinia.use(piniaPluginPersistedstate);
   ```

2. 使用

   ```js
   export const useCategorysStore = defineStore(
     'categorys',
      () = >{
          ...
          return {
          categorysState
          }
      },
     {
       persist: {
         key: 'piniaUserStore', // 存储本地时使用的key
         paths: ['categorysState'], // 需要保存的state名称,组合式API语法下必须return出来
         storage: localStorage // 保存位置: sessionStorage
       }
     }
   );
   ```





