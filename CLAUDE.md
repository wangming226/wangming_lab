# CLAUDE.md — 王明课题组网站

## 项目概述

这是一个面向吉林大学化学学院王明课题组（超分子化学）的静态学术网站。纯 HTML + CSS + JS，可直接部署到 GitHub Pages。

## 语言要求

**始终使用中文进行所有回复**，包括解释、代码注释、文档说明等。代码标识符（变量名、函数名）可使用英文。

## 技术栈

- 纯静态网站，无框架，无构建工具
- 数据集中管理在 `site-data.js`（双语数据）
- 通用逻辑在 `common.js`（导航、回到顶部等）
- 各页面独立 `.js` 文件负责渲染

## 文件结构

```
index.html          — 首页
members.html        — 成员介绍
publications.html   — 研究成果
news.html           — 新闻列表
news-item.html      — 新闻详情
paper.html          — 论文详情
gallery.html        — 实验室相册
contact.html        — 联系方式
cooperation.html    — 资源与合作
404.html            — 404 页面
styles.css          — 全局样式
site-data.js        — 核心数据（87KB，双语文案 + 数据）
common.js           — 公共 JS
script.js           — 首页 JS
members.js          — 成员页 JS
publications.js     — 成果页 JS
news.js             — 新闻页 JS
news-item.js        — 新闻详情 JS
paper.js            — 论文详情 JS
gallery.js          — 相册 JS
contact.js          — 联系页 JS
cooperation.js      — 合作页 JS
```

## 修改指南

- 修改文案/数据 → 编辑 `site-data.js`
- 修改样式 → 编辑 `styles.css`
- 修改页面结构 → 编辑对应 HTML 文件
- 修改页面交互逻辑 → 编辑对应 JS 文件
