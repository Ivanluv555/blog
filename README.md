# 我的个人博客

使用 Hugo + PaperMod 主题构建的个人博客。

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
├── archetypes/     # 内容模板
├── assets/         # 资源文件（CSS, JS等）
├── content/        # 博客内容
│   ├── about.md    # 关于页面
│   ├── archives/   # 归档页面
│   └── posts/      # 博客文章
├── data/           # 数据文件
├── layouts/        # 自定义布局
├── static/         # 静态文件（图片等）
├── themes/         # 主题目录
│   └── PaperMod/   # PaperMod主题
├── hugo.toml       # Hugo配置文件
└── public/         # 构建输出目录（自动生成）
```

## 配置说明

编辑 `hugo.toml` 文件来自定义你的博客：

- `baseURL`: 你的网站域名
- `title`: 网站标题
- `params.author`: 作者名称
- `params.description`: 网站描述
- `params.socialIcons`: 社交媒体链接

## 部署

可以将 `public/` 目录部署到以下平台：

- **GitHub Pages**: 推送到 GitHub 仓库并启用 Pages
- **Vercel**: 连接 Git 仓库自动部署
- **Netlify**: 连接 Git 仓库自动部署
- **Cloudflare Pages**: 连接 Git 仓库自动部署

## 主题文档

PaperMod主题文档: https://github.com/adityatelange/hugo-PaperMod/wiki

## Hugo文档

Hugo官方文档: https://gohugo.io/documentation/
