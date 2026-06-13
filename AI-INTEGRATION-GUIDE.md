# AI功能集成指南

## 当前AI功能状态

### ✅ 已实现的功能

1. **阿里云API封装** - `js/alicloud.js`
   - ✅ `recognizeStyle()` - 图片风格识别
   - ✅ `generateAdvice()` - 生成拍摄建议
   - ✅ API Key配置完成
   - ✅ 错误处理和降级策略

2. **本地建议生成器** - `js/advice-generator.js`
   - ✅ 6大建议模块（构图、光线、角度、后期、道具、注意事项）
   - ✅ 根据题材和风格动态生成
   - ✅ 支持人像、风光、建筑、美食等题材

3. **上传页AI调用** - `js/pages/upload.js`
   - ✅ 调用AI识别图片
   - ✅ 保存AI识别结果到全局状态
   - ✅ 错误处理和用户提示

---

## 🔄 AI调用流程

### 流程图

```
用户上传图片
    ↓
调用 AliCloud.recognizeStyle(图片)
    ↓
AI识别题材和风格
    ↓
保存结果到 App.globalData
    ↓
用户在风格选择页确认/修改
    ↓
结果页展示建议
    ├── 优先使用AI建议（如果调用成功）
    └── 降级使用本地建议（如果AI失败）
```

### 详细步骤

#### Step 1: 用户上传图片

**文件**: `js/pages/upload.js`

```javascript
// 用户选择图片后
handleFileSelect(e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = (event) => {
    this.imageUrl = event.target.result; // base64格式
    App.globalData.currentImage = this.imageUrl;
    // 显示预览
  };
  reader.readAsDataURL(file);
}
```

#### Step 2: 点击"开始分析"调用AI

**文件**: `js/pages/upload.js`

```javascript
async analyzeImage() {
  try {
    // 调用阿里云AI识别
    const result = await AliCloud.recognizeStyle(this.imageUrl);
    
    if (result) {
      // 保存AI识别结果
      App.globalData.aiRecognizedCategory = result.category;  // "人像摄影"
      App.globalData.aiRecognizedStyle = result.style;        // "日系小清新"
      App.globalData.aiConfidence = result.confidence;        // 85
      
      // 跳转到风格选择页（可以预填AI识别的结果）
      Router.navigate('style-select');
    } else {
      // AI识别失败，仍然跳转，让用户手动选择
      Utils.toast('AI识别失败，请手动选择风格');
      Router.navigate('style-select');
    }
  } catch (error) {
    console.error('AI分析错误:', error);
    Utils.toast('分析失败，请重试');
  }
}
```

#### Step 3: 风格选择页（可选修改AI结果）

**文件**: `js/pages/style-select.js`

```javascript
render() {
  // 获取AI识别的结果
  const aiCategory = App.globalData.aiRecognizedCategory;
  const aiStyle = App.globalData.aiRecognizedStyle;
  
  // 可以预选中AI识别的选项
  // 也可以让用户手动选择/修改
  
  // 最终用户确认后，保存到 currentCategory 和 currentStyle
  App.globalData.currentCategory = selectedCategory;
  App.globalData.currentStyle = selectedStyle;
}
```

#### Step 4: 结果页展示建议

**文件**: `js/pages/result.js`

```javascript
render() {
  const category = App.globalData.currentCategory;
  const style = App.globalData.currentStyle;
  const imageUrl = App.globalData.currentImage;
  
  // 获取建议（本地生成）
  const advice = AdviceGenerator.getAdvice(category, style);
  
  // 展示6个建议模块
  // ...
}
```

---

## 🔌 AI API详细说明

### API 1: 图片风格识别

**函数**: `AliCloud.recognizeStyle(base64Image)`

**输入**:
```javascript
base64Image: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
```

**输出**:
```javascript
{
  category: "人像摄影",      // 题材分类
  style: "日系小清新",        // 风格标签
  confidence: 85             // 置信度（0-100）
}
```

**API配置**:
```javascript
{
  endpoint: "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
  model: "qwen-vl-plus",       // 阿里云通义千问视觉模型
  apiKey: "your-dashscope-api-key"
}
```

### API 2: 生成拍摄建议（可选）

**函数**: `AliCloud.generateAdvice(category, style, base64Image)`

**输入**:
```javascript
{
  category: "人像摄影",
  style: "日系小清新",
  base64Image: "data:image/jpeg;base64,..."
}
```

**输出**:
```javascript
[
  {
    title: "构图建议",
    description: "建议将主体放在九宫格的交叉点上..."
  },
  {
    title: "光线处理",
    description: "选择柔和的自然光..."
  },
  {
    title: "拍摄角度",
    description: "尝试不同的拍摄角度..."
  }
]
```

**API配置**:
```javascript
{
  endpoint: "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
  model: "qwen-turbo",         // 阿里云通义千问文本模型
  apiKey: "your-dashscope-api-key"
}
```

---

## 💡 推荐方案：混合策略

### 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **纯AI方案** | 建议最精准 | 成本高、可能失败 | ⭐⭐⭐ |
| **纯本地方案** | 成本低、速度快 | 建议不够个性化 | ⭐⭐⭐ |
| **混合方案** | 平衡成本和效果 | 需要降级逻辑 | ⭐⭐⭐⭐⭐ |

### 推荐配置：混合方案

```javascript
// 策略1: AI识别 + 本地建议（当前实现）
async analyzeImage() {
  // 1. 调用AI识别图片题材和风格
  const recognition = await AliCloud.recognizeStyle(this.imageUrl);
  
  // 2. 使用本地建议生成器生成建议
  const advice = AdviceGenerator.getAdvice(recognition.category, recognition.style);
  
  // 优点：
  // - AI识别准确度高
  // - 本地建议生成快速、稳定
  // - 成本低（只调用1次AI）
}

// 策略2: 全程AI（可选升级）
async analyzeImage() {
  // 1. 调用AI识别
  const recognition = await AliCloud.recognizeStyle(this.imageUrl);
  
  // 2. 调用AI生成建议
  const advice = await AliCloud.generateAdvice(
    recognition.category, 
    recognition.style, 
    this.imageUrl
  );
  
  // 优点：建议更个性化
  // 缺点：成本高（调用2次AI）、耗时长
}
```

---

## 📊 成本分析

### AI API调用成本

**阿里云百炼价格**（参考）:

| 模型 | 用途 | 价格 | 每次成本 |
|------|------|------|---------|
| qwen-vl-plus | 图片识别 | ￥0.04/千tokens | ￥0.01/次 |
| qwen-turbo | 文本生成 | ￥0.008/千tokens | ￥0.005/次 |

### 方案成本对比

**假设每月10000次分析**:

| 方案 | AI调用次数 | 月成本 | 推荐度 |
|------|-----------|--------|--------|
| 纯本地方案 | 0 | ￥0 | ⭐⭐⭐ |
| AI识别+本地建议 | 10,000次 | ￥100 | ⭐⭐⭐⭐⭐ |
| 全程AI | 20,000次 | ￥250 | ⭐⭐⭐ |

**推荐**：**AI识别 + 本地建议**（当前实现）
- 成本可控：￥100/月
- 识别准确：AI识别题材和风格
- 响应快速：本地生成建议
- 体验良好：2秒内完成分析

---

## 🔧 配置和优化

### 1. 配置API Key

**文件**: `js/alicloud.js`

```javascript
const AliCloud = {
  apiKey: 'your-dashscope-api-key',
  baseURL: 'https://dashscope.aliyuncs.com/api/v1'
};
```

**获取API Key**:
1. 登录阿里云控制台
2. 搜索"百炼"或"DashScope"
3. 创建应用 → 获取API Key
4. 替换上面的apiKey

### 2. 优化识别准确率

**提示词优化**（`js/alicloud.js`）:

```javascript
async recognizeStyle(base64Image) {
  const prompt = `
请识别这张照片的拍摄题材和风格特征。

题材分类（选一个）：
- 人像摄影
- 风光摄影
- 建筑摄影
- 宠物摄影
- 美食摄影
- 街拍摄影
- 产品摄影
- 静物摄影
- 花卉摄影
- 夜景摄影

风格特征（选一个或多个）：
- 日系小清新
- 复古港风
- 电影感
- 胶片风
- INS风
- 暗黑系
- 高级感
- 莫兰迪色
- 赛博朋克
- 油画质感

请以JSON格式返回：
{
  "category": "人像摄影",
  "style": "日系小清新",
  "confidence": 85
}
  `;
  
  // 发送API请求
  // ...
}
```

### 3. 降级策略

**文件**: `js/pages/upload.js`

```javascript
async analyzeImage() {
  try {
    // 尝试调用AI
    const result = await AliCloud.recognizeStyle(this.imageUrl);
    
    if (result && result.confidence > 70) {
      // 置信度高，使用AI结果
      App.globalData.aiRecognizedCategory = result.category;
      App.globalData.aiRecognizedStyle = result.style;
      Utils.toast(`AI识别：${result.category} - ${result.style}`);
    } else {
      // 置信度低，使用默认值
      App.globalData.aiRecognizedCategory = '人像摄影';
      App.globalData.aiRecognizedStyle = '日系小清新';
      Utils.toast('AI识别置信度较低，请手动确认');
    }
  } catch (error) {
    // API调用失败，使用默认值
    console.error('AI调用失败:', error);
    App.globalData.aiRecognizedCategory = '人像摄影';
    App.globalData.aiRecognizedStyle = '日系小清新';
    Utils.toast('AI服务暂时不可用，请手动选择');
  }
  
  Router.navigate('style-select');
}
```

---

## 📝 使用示例

### 完整的用户流程

1. **上传页面**:
   ```
   用户选择图片 → 点击"开始分析"
   → AI识别中（显示Loading）
   → AI识别成功（2-3秒）
   → 跳转到风格选择页
   ```

2. **风格选择页**:
   ```
   AI识别结果已预填：
   题材：人像摄影 ✅
   风格：日系小清新 ✅
   
   用户可以：
   - 直接确认（如果AI识别准确）
   - 修改选择（如果AI识别不准）
   ```

3. **结果页**:
   ```
   展示6个建议：
   1. 构图建议 - 三分法、黄金分割
   2. 光线处理 - 柔和自然光
   3. 拍摄角度 - 平视、俯拍
   4. 后期处理 - VSCO滤镜
   5. 道具推荐 - 白色衣服、花环
   6. 注意事项 - 眼神自然
   ```

---

## 🚀 后续优化方向

### 1. 增加AI建议生成（可选）

```javascript
// 在结果页调用AI生成更个性化的建议
async render() {
  // 本地建议（默认）
  const localAdvice = AdviceGenerator.getAdvice(category, style);
  
  // 尝试获取AI建议（异步）
  AliCloud.generateAdvice(category, style, imageUrl)
    .then(aiAdvice => {
      if (aiAdvice) {
        // 更新页面显示AI建议
        this.updateAdvice(aiAdvice);
      }
    })
    .catch(error => {
      console.log('AI建议生成失败，使用本地建议');
    });
}
```

### 2. 缓存AI识别结果

```javascript
// 避免重复识别同一张图片
const recognitionCache = new Map();

async recognizeStyle(base64Image) {
  const cacheKey = md5(base64Image);
  
  if (recognitionCache.has(cacheKey)) {
    return recognitionCache.get(cacheKey);
  }
  
  const result = await this.callAI(base64Image);
  recognitionCache.set(cacheKey, result);
  
  return result;
}
```

### 3. 离线模式

```javascript
// 检测网络状态，离线时直接使用本地建议
async analyzeImage() {
  if (!navigator.onLine) {
    Utils.toast('当前离线，使用本地建议');
    Router.navigate('style-select');
    return;
  }
  
  // 在线时调用AI
  const result = await AliCloud.recognizeStyle(this.imageUrl);
  // ...
}
```

---

## 📞 技术支持

### 阿里云百炼文档
- 官方文档：https://help.aliyun.com/zh/dashscope/
- API参考：https://help.aliyun.com/zh/dashscope/developer-reference/api-details
- 定价说明：https://help.aliyun.com/zh/dashscope/pricing-overview

### 常见问题

**Q1: API调用失败怎么办？**

A: 检查以下几点：
1. API Key是否正确
2. 网络是否通畅
3. 图片大小是否超限（建议<5MB）
4. 账户余额是否充足

**Q2: AI识别不准确怎么办？**

A: 可以：
1. 优化提示词
2. 提高置信度阈值（如>80才使用AI结果）
3. 让用户在风格选择页手动修正

**Q3: 如何降低成本？**

A: 建议：
1. 使用AI识别 + 本地建议（当前方案）
2. 缓存识别结果
3. 只对付费用户开启AI建议生成

---

**文档版本**: 1.0  
**更新时间**: 2025-10-28  
**当前状态**: ✅ AI识别已集成，本地建议生成器已完成
