---
# 详细文档见https://modelscope.cn/docs/%E5%88%9B%E7%A9%BA%E9%97%B4%E5%8D%A1%E7%89%87
domain: 
  - cv
tags: 
  - AI拍照辅助
  - 图像识别
  - H5应用
datasets:
  evaluation:
  test:
  train:
models:

## 启动文件(若SDK为Gradio/Streamlit，默认为app.py, 若为Static HTML, 默认为index.html)
deployspec:
  entry_file: index.html
license: Apache License 2.0
---

# AI拍照辅助应用

这是一个 AI 拍照辅助的 H5 单页应用（SPA），主打复古报纸风格 UI。

## 功能特点

- 复古报纸风格首页（多色调装饰条、衬线字体）
- 自定义路由系统
- LocalStorage 数据管理
- 阿里云 API 封装
- 示例图片数据库

## 技术栈

- HTML5 + CSS3 + JavaScript (ES6+)
- 单页应用路由：自定义 router.js
- 状态管理：LocalStorage
- 图像处理：Canvas API
- API封装：阿里云服务调用

## 目标用户

摄影小白和社交媒体内容创作者

#### Clone with HTTP
```bash
git clone https://www.modelscope.cn/studios/nakia9/photo_advice2.git
```
