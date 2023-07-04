# RSA-Web-Chat

### 背景和目的
有时我们想和好友共享自己的账号，这就需要想办法让好友知道我们的账号密码。

如果好友就在身边，那可太妙了：我们可以用U盘拷贝或者直接把密码念一遍；
若是非常不巧，好友远在天边，我们就只能通过一些通信软件，在网络上传递账号密码。

但是密码是一种非常隐私的数据，我们不希望自己的密码在互联网上留下明文痕迹。
为了防止潜在的隐私泄漏，我们希望在传递密码时对数据进行加密。

### 成果
这里提供了一个Web解决方案，你可以将其部署在任意服务器上。

双方使用浏览器传递隐私数据时，将使用RSA端到端加密。

# 初始原文

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
    1) Run `Extensions: Show Built-in Extensions` from VSCode's command palette
    2) Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
cd vue
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
