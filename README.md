# `Dora CLI`

Dora CLI 是 DoraemonUI 开发的标准工具。

## 安装

> Node 版本要求\
Dora CLI 需要 [Node.js](https://nodejs.org/) v8.9 或更高版本 (推荐 v10 以上)。你可以使用 [n](https://github.com/tj/n)，[nvm](https://github.com/creationix/nvm) 或 [nvm-windows](https://github.com/coreybutler/nvm-windows) 在同一台电脑中管理多个 Node 版本。

可以使用下列任一命令安装这个新的包：

```bash
npm install -g @doraemon-ui/miniprogram.cli
# OR
yarn global add @doraemon-ui/miniprogram.cli
```

安装之后，你就可以在命令行中访问 `dora` 命令。你可以通过简单运行 `dora`，看看是否展示出了一份所有可用命令的帮助信息，来验证它是否安装成功。

你还可以用这个命令来检查其版本是否正确：

```bash
dora --version
# OR
dora -V
```

### 升级

如需升级全局的 `Dora CLI` 包，请运行：

```bash
npm update -g @doraemon-ui/miniprogram.cli
# OR
yarn global upgrade --latest @doraemon-ui/miniprogram.cli
```

## 创建一个项目

### 模板预设

```
用法: create <name>

选项:

  --default 忽略提示符并使用默认预设选项
```

你可以通过 `dora create` 命令来创建一个新组件项目。

### 在现有的项目中安装插件

当你使用 `dora create` 来创建一个新项目的时候，有些插件会根据你选择的特性被预安装好。如果你想在一个已经被创建好的项目中安装一个插件，可以使用 `dora install` 命令：

```bash
dora install eslint
```

## CLI 服务

### 使用命令

在一个 Dora CLI 项目中，`@doraemon-ui/miniprogram.cli` 安装了一个名为 `dora` 的命令。你可以在 npm scripts 中以 `dora`、或者从终端中以 `./node_modules/.bin/dora` 访问这个命令。

```json
{
  "scripts": {
    "serve": "dora serve",
    "build": "dora build"
  }
}
```

你可以通过 npm 或 Yarn 调用这些 script：

```bash
npm run serve
# OR
yarn serve
```

### dora serve

```
用法: dora serve [options] [entry]

选项:

  --open      在服务器启动时打开小程序开发者工具
  --host      指定 host (默认值：127.0.0.1)
  --port      指定 port (默认值：8080)，对应小程序开发者工具的: 菜单-设置-安全设置-服务端口
  --https     使用 https (默认值：false)
  --build-npm 使用构建 npm (默认值：false)，对应小程序开发者工具的: 菜单-工具-构建 npm
```

`dora serve` 命令会启动一个基于小程序的开发服务器。

### dora build

```
用法: dora build [options]

选项:

  --mode    指定环境模式 (默认值：production)
  --watch   监听文件变化
```

`dora build` 会在 `miniprogram_dist/` 目录产生一个可用于生产环境的包。

### 查看所有的可用命令

你可以运行以下命令查看所有注入的命令：

```bash
npx dora help
# OR
npx dora help [command]
```