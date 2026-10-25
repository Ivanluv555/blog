<div align="center">

# Ivan's Blog

![Hugo](https://img.shields.io/badge/Hugo-0.167.0-FF4088?style=flat&logo=hugo&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg)
![GitHub Actions](https://img.shields.io/github/actions/workflow/status/Ivanluv555/blog/hugo.yml?branch=master&label=build)
![Last Commit](https://img.shields.io/github/last-commit/Ivanluv555/blog)

</div>

## 📖 关于

这是一个使用 Hugo 静态站点生成器搭建的个人博客，采用 [Blowfish](https://blowfish.page/) 主题。博客支持中文内容，包含文章分类、系列和标签功能，通过 GitHub Actions 自动构建并部署到 GitHub Pages。

## 🚀 快速开始

克隆仓库并启动本地开发服务器：

```bash
git clone --recursive https://github.com/Ivanluv555/blog.git
cd blog
hugo server -D
```

访问 `http://localhost:1313` 预览博客。新建文章使用 `hugo new content/posts/your-post.md` 命令。

## 🛠️ 技术栈

- **框架**: Hugo v0.167.0 (Extended)
- **主题**: Blowfish
- **部署**: GitHub Actions + GitHub Pages
- **语言**: 中文 (zh-cn)
