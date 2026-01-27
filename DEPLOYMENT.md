# 红色丝绒·摄影助手 部署指南

## 项目概述

红色丝绒·摄影助手是一款基于AI的智能拍照辅助工具，帮助摄影小白和内容创作者快速掌握拍摄技巧。

## 部署到 GitHub

### 1. 创建仓库

```bash
# 克隆项目
git clone https://github.com/your-username/red-velvet-photography-assistant.git
cd red-velvet-photography-assistant

# 或创建新仓库
mkdir red-velvet-photography-assistant
cd red-velvet-photography-assistant
git init
```

### 2. 初始化项目

```bash
# 添加所有文件
git add .
git commit -m "feat: 初始化红色丝绒·摄影助手项目"

# 关联远程仓库
git remote add origin https://github.com/your-username/red-velvet-photography-assistant.git

# 推送到GitHub
git branch -M main
git push -u origin main
```

### 3. 配置 GitHub Pages（可选）

对于前端静态页面部署：

1. 进入仓库 Settings -> Pages
2. Source 选择 "Deploy from a branch"
3. Branch 选择 "main" 并指定 "/docs" 文件夹或 "/" 
4. 保存设置

## 部署到 ModelScope

### 1. 准备 ModelScope 项目

1. 登录 [ModelScope](https://www.modelscope.cn/)
2. 创建新项目，名称为 "red-velvet-photography-assistant"
3. 选择 "Hugging Face Spaces" 类似的在线演示类型

### 2. 配置 ModelScope 部署

在项目根目录创建 `app.py`（如果需要后端服务）或 `index.html`（纯前端）：

```python
# app.py 示例（如需后端）
from flask import Flask, render_template, send_from_directory
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
```

### 3. ModelScope 配置文件

创建 `requirements.txt`:

```txt
flask==2.3.3
gunicorn==21.2.0
```

创建 `models.py` 或 `model.py`（根据ModelScope要求）:

```python
# model.py - ModelScope模型定义
class Service:
    def __init__(self, model_path: str = None):
        """
        初始化服务
        """
        pass

    def preprocess(self, input_data):
        """
        预处理输入数据
        """
        return input_data

    def forward(self, input_data):
        """
        模型推理
        """
        # 这里集成您的AI功能
        return {"result": "success"}

    def postprocess(self, input_data):
        """
        后处理输出数据
        """
        return input_data
```

### 4. 使用 Git 推送到 ModelScope

```bash
# 添加 ModelScope 远程仓库
git remote add modelscope https://www.modelscope.cn/your-username/red-velvet-photography-assistant.git

# 推送代码
git push modelscope main
```

## 环境配置

### 前端配置

前端代码位于项目根目录，使用纯 HTML/CSS/JS 实现，无需构建步骤。

### 后端配置

进入 `server/` 目录配置后端服务：

```bash
cd server
npm install
```

创建 `.env` 文件：

```env
# 服务器配置
PORT=3000
NODE_ENV=production

# MySQL数据库配置
DB_HOST=your_mysql_host
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=photo_assistant

# CORS配置
ALLOWED_ORIGINS=http://localhost:8080,https://your-domain.com,https://*.modelscope.cn,https://*.ms.show

# 阿里云API配置
DASHSCOPE_API_KEY=your_dashscope_api_key
API_GATEWAY_URL=your_api_gateway_url
ALIYUN_APP_KEY=your_app_key
ALIYUN_APP_SECRET=your_app_secret

# MaxCompute配置（可选）
MAXCOMPUTE_ACCESS_KEY_ID=your_access_key_id
MAXCOMPUTE_ACCESS_KEY_SECRET=your_access_key_secret
MAXCOMPUTE_PROJECT=your_project_name
MAXCOMPUTE_ENDPOINT=https://service.cn-shanghai.maxcompute.aliyun.com/api

# 日志级别
LOG_LEVEL=info
```

## API 接口文档

### 用户相关接口

- `POST /api/users/login` - 用户登录/注册
- `GET /api/users/:user_id` - 获取用户信息
- `POST /api/users/:user_id/consume-quota` - 消费配额

### 照片相关接口

- `POST /api/photos` - 创建照片记录
- `GET /api/photos/user/:user_id` - 获取用户照片
- `GET /api/photos/popular` - 获取热门题材
- `POST /api/photos/:photo_id/guide-usage` - 记录辅助线使用
- `POST /api/photos/:photo_id/download` - 更新下载状态

### 数据分析接口

- `POST /api/analytics/page-view` - 记录页面访问
- `POST /api/analytics/page-views-batch` - 批量记录页面访问
- `POST /api/analytics/event` - 记录用户事件
- `POST /api/analytics/events-batch` - 批量记录用户事件
- `GET /api/analytics/dau` - 获取今日DAU

### AI识别服务

- `POST /api/ai/recognize` - 图片风格识别
- `POST /api/ai/advice` - AI生成拍摄建议
- `GET /api/ai/status` - AI服务状态

### MaxCompute数据同步

- `POST /api/maxcompute/sync-now` - 立即同步数据
- `GET /api/maxcompute/stats` - 同步统计信息
- `POST /api/maxcompute/schedule` - 配置定时任务
- `GET /api/maxcompute/schema` - 获取表结构

## 部署验证

### GitHub 部署验证

访问 `https://your-username.github.io/red-velvet-photography-assistant/`

### ModelScope 部署验证

访问 `https://www.modelscope.cn/studios/your-username/red-velvet-photography-assistant`

### API 服务验证

```bash
# 健康检查
curl http://your-server-domain/health

# API 测试
curl http://your-server-domain/api/ai/status
```

## CI/CD 配置（可选）

在 `.github/workflows/deploy.yml` 中配置自动化部署：

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        cd server
        npm install
        
    - name: Run tests
      run: |
        cd server
        npm test
        
    - name: Deploy to production
      env:
        DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
      run: |
        # 部署脚本
```

## 故障排除

### 常见问题

1. **CORS 错误**：检查 `ALLOWED_ORIGINS` 配置
2. **API 连接失败**：验证阿里云 API 密钥配置
3. **数据库连接失败**：检查数据库连接参数

### 联系支持

如有问题请联系项目维护者。

---

**版本**: 1.0  
**更新日期**: 2025-01-27  
**作者**: 红色丝绒开发团队