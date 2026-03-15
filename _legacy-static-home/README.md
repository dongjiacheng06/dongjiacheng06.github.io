# 董嘉铖的技术博客

基于Jekyll Chirpy主题的个人技术博客，专注于3D视觉、深度学习等领域的技术分享。

## 🌐 访问地址

**博客地址**: https://dongjiacheng06.github.io/blog/

**学术主页**: https://dongjiacheng06.github.io/

## 📝 内容方向

- **3D Gaussian Splatting**: 神经渲染与3D重建技术
- **3D Vision**: 立体视觉、点云处理、场景理解  
- **Deep Learning**: 计算机视觉算法与应用
- **Research Notes**: 论文阅读笔记与思考

## 🚀 本地开发

### 环境要求

- Ruby 3.x
- Jekyll 4.x
- Bundler

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/dongjiacheng06/blog.git
cd blog

# 安装依赖
bundle install

# 本地运行
bundle exec jekyll serve
```

访问 http://localhost:4000/blog/ 查看效果。

## 📁 项目结构

```
blog/
├── _config.yml           # Jekyll配置
├── _posts/              # 博客文章
├── _tabs/               # 页面标签
├── assets/              # 静态资源
├── .github/workflows/   # GitHub Actions
└── README.md           # 说明文档
```

## ✍️ 写作指南

### 创建新文章

1. 在 `_posts/` 目录下创建文件：`YYYY-MM-DD-title.md`
2. 添加Front Matter：

```yaml
---
title: 文章标题
date: YYYY-MM-DD HH:MM:SS +0800
categories: [分类1, 分类2]
tags: [标签1, 标签2]
math: true    # 启用数学公式
mermaid: true # 启用图表
---
```

3. 编写Markdown内容

### 数学公式

支持LaTeX语法：

```latex
$$E = mc^2$$

$\alpha + \beta = \gamma$
```

### 代码块

支持语法高亮：

```python
def hello_world():
    print("Hello, World!")
```

## 🛠 部署说明

### GitHub Pages自动部署

1. 推送代码到GitHub
2. GitHub Actions自动构建和部署
3. 访问 https://dongjiacheng06.github.io/blog/

### 配置要点

在 `_config.yml` 中确保以下配置正确：

```yaml
url: "https://dongjiacheng06.github.io"
baseurl: "/blog"
```

## 🎨 主题特性

基于 [Jekyll Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) 主题：

- ✅ 响应式设计
- ✅ 深色/浅色模式切换
- ✅ 搜索功能
- ✅ 分类和标签
- ✅ 数学公式支持
- ✅ 代码语法高亮
- ✅ 社交媒体集成
- ✅ SEO优化
- ✅ PWA支持

## 📞 联系方式

- **邮箱**: Dong48@illinois.edu
- **GitHub**: [@dongjiacheng06](https://github.com/dongjiacheng06)
- **主页**: [dongjiacheng06.github.io](https://dongjiacheng06.github.io)

---

欢迎交流与讨论！🎉