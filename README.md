# 落灰的酒精灯的个人博客

使用 Hugo + Blowfish 主题构建的个人博客。

## 快速开始

### 本地开发

启动本地开发服务器：

```bash
npm run dev
# 或者
hugo server -D
```

访问 http://localhost:1313 查看博客。

### 构建生产版本

```bash
npm run build
# 或者
hugo --minify
```

构建后的静态文件会生成在 `public/` 目录下。

### 清理构建文件

```bash
npm run clean
```

## 创建新文章

```bash
hugo new content posts/文章标题.md
```

然后编辑生成的 Markdown 文件，将 `draft = true` 改为 `draft = false` 后即可发布。

## 目录结构

```
blog/
├── archetypes/        # 内容模板
├── assets/            # 资源文件（CSS, JS等）
├── config/
│   └── _default/      # 模块化配置文件
│       ├── config.toml    # 主配置
│       ├── languages.toml # 语言配置
│       ├── menus.toml     # 菜单配置
│       └── params.toml    # 参数配置
├── content/           # 博客内容
│   ├── _index.md      # 首页
│   ├── about.md       # 关于页面
│   ├── page/          # 静态页面
│   └── posts/         # 博客文章
├── layouts/           # 自定义布局
├── static/            # 静态文件（图片等）
├── themes/
│   └── blowfish/      # Blowfish主题
└── public/            # 构建输出目录（自动生成）
```

## 配置说明

编辑 `config/_default/` 目录下的配置文件来自定义你的博客：

- **config.toml**: 基础配置（baseURL、主题、语言等）
- **languages.toml**: 多语言配置和站点标题
- **params.toml**: 主题参数（外观、功能、布局等）
- **menus.toml**: 导航菜单配置

### 重要配置项

- `baseURL`: 你的网站域名（config.toml）
- `title`: 网站标题（languages.toml）
- `author`: 作者信息（_index.md）
- 主题外观和功能：params.toml

## 部署

可以将 `public/` 目录部署到以下平台：

- **GitHub Pages**: 推送到 GitHub 仓库并启用 Pages
- **Vercel**: 连接 Git 仓库自动部署
- **Netlify**: 连接 Git 仓库自动部署
- **Cloudflare Pages**: 连接 Git 仓库自动部署

## 环境要求

- Hugo v0.164.0 或更高版本（Extended 版本）
- Git

## 主题文档

- Blowfish 主题文档: https://blowfish.page/
- Blowfish GitHub: https://github.com/nunocoracao/blowfish

## Hugo文档

Hugo官方文档: https://gohugo.io/documentation/
