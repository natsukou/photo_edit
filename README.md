# AI拍照辅助 H5版本

这是从微信小程序转换而来的H5网页版本，保留了所有核心功能和复古报纸风格的UI设计。

## 📁 项目结构

```
project_h5/
├── index.html              # 主入口文件
├── css/
│   ├── global.css          # 全局样式
│   └── index.css           # 首页样式
├── js/
│   ├── app.js              # 主应用逻辑和首页
│   ├── router.js           # 路由系统
│   ├── utils.js            # 工具函数
│   ├── alicloud.js         # 阿里云API封装
│   └── sample-images.js    # 示例图片数据
├── images/                 # 图片资源
│   └── wechat-qrcode.jpg   # 微信二维码（需要自行添加）
└── README.md               # 本文件
```

## 🚀 快速开始

### 方式1：直接打开（推荐本地测试）
直接用浏览器打开 `index.html` 文件即可运行。

### 方式2：使用本地服务器（推荐开发）
```bash
# 使用Python
cd /Users/nakia/Downloads/project_h5
python3 -m http.server 8080

# 或使用Node.js的http-server
npx http-server -p 8080
```

然后在浏览器访问：`http://localhost:8080`

## ✨ 已实现功能

### 1. 首页 (index)
- ✅ 复古报纸风格UI
- ✅ 多色调装饰条
- ✅ 剩余额度显示
- ✅ 功能卡片展示
- ✅ 使用步骤说明

### 2. 核心功能
- ✅ 本地存储管理（LocalStorage）
- ✅ 路由系统（单页应用）
- ✅ 工具函数库
- ✅ 阿里云API封装
- ✅ 示例图片数据库

## 🔧 待完成功能

由于项目文件较多，以下功能需要继续开发：

### 上传页面 (upload)
- 图片上传和预览
- AI智能识别
- 手动选择风格入口

### 风格选择页面 (style-select)
- 题材分类选择
- 风格标签多选
- 自定义描述输入

### 结果页面 (result)
- Canvas辅助线绘制
- 拍摄建议展示
- 图片下载功能
- 返回首页弹窗

## 📝 继续开发指南

### 1. 创建上传页面
在 `js/app.js` 中添加：
```javascript
const UploadPage = {
  render(params) {
    // 页面HTML
  },
  handleUpload() {
    // 上传逻辑
  }
};
```

### 2. 创建对应的CSS文件
```bash
touch css/upload.css
touch css/style-select.css
touch css/result.css
```

### 3. 在主HTML中引入CSS
```html
<link rel="stylesheet" href="css/upload.css">
<link rel="stylesheet" href="css/style-select.css">
<link rel="stylesheet" href="css/result.css">
```

## 🎨 UI设计特点

- **复古报纸风格**：黑白配色 + 米黄背景
- **衬线字体**：Georgia, Times New Roman
- **等宽字体**：Courier New（用于代码和数据）
- **几何阴影**：3px偏移，无模糊
- **多色调装饰**：13种柔和色彩

## 🔑 核心技术

- **纯原生开发**：HTML5 + CSS3 + JavaScript (ES6+)
- **单页应用**：自定义路由系统
- **响应式设计**：适配移动端和桌面端
- **本地存储**：LocalStorage
- **Canvas API**：辅助线绘制

## 📱 兼容性

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️  IE 不支持

## 📞 联系方式

微信号：**GreeNakia**

扫码添加微信，获取更多免费图片额度！

---

## 🛠️ 从这里继续开发

当前已完成基础框架，建议按以下顺序继续开发：

1. **上传页面** - 实现图片选择和预览
2. **风格选择页面** - 实现标签选择交互
3. **结果页面** - 实现Canvas绘制和建议展示
4. **优化细节** - 添加加载动画、错误处理等

需要完整代码可以参考微信小程序版本的逻辑进行转换。
