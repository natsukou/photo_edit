# 红色丝绒·摄影助手 - 后端API服务

基于 Node.js + Express + MySQL 的后端服务，提供数据上报接口，支持将用户行为数据同步到 DataWorks 进行分析。

## 📋 目录结构

```
server/
├── config/
│   └── database.js          # 数据库连接配置
├── models/
│   ├── User.js              # 用户模型
│   ├── PhotoRecord.js       # 照片记录模型
│   ├── PageView.js          # 页面访问模型
│   ├── UserEvent.js         # 用户事件模型
│   ├── GuideUsage.js        # 辅助线使用模型
│   └── Feedback.js          # 反馈模型
├── routes/
│   ├── users.js             # 用户相关路由
│   ├── photos.js            # 照片相关路由
│   ├── analytics.js         # 数据分析路由
│   └── feedback.js          # 反馈相关路由
├── scripts/
│   └── init-db.js           # 数据库初始化脚本
├── .env.example             # 环境变量示例
├── .gitignore
├── package.json
└── server.js                # 主服务器文件
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# MySQL数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=photo_assistant

# CORS配置
ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080

# 日志级别
LOG_LEVEL=info
```

### 3. 初始化数据库

确保MySQL已安装并运行，然后执行：

```bash
npm run init-db
```

这将自动创建数据库、表和测试数据。

### 4. 启动服务器

开发模式（自动重启）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

服务器将在 `http://localhost:3000` 启动。

### 5. 测试接口

访问健康检查接口：
```bash
curl http://localhost:3000/health
```

## 📡 API接口文档

### 用户管理

#### 用户登录/注册
```http
POST /api/users/login
Content-Type: application/json

{
  "user_id": "user_xxx",      // 可选，不传则自动生成
  "nickname": "摄影爱好者",
  "avatar_url": "https://...",
  "source": "h5",
  "device_info": {
    "device_type": "mobile",
    "browser": "Chrome",
    "os": "iOS"
  }
}
```

#### 获取用户信息
```http
GET /api/users/:user_id
```

#### 消费配额
```http
POST /api/users/:user_id/consume-quota
```

### 照片管理

#### 创建照片记录
```http
POST /api/photos
Content-Type: application/json

{
  "user_id": "user_xxx",
  "photo_url": "https://...",
  "photo_size": 2048,
  "photo_width": 1920,
  "photo_height": 1080,
  "category": "人像",
  "style": "日系小清新",
  "custom_description": "用户自定义描述"
}
```

#### 记录辅助线使用
```http
POST /api/photos/:photo_id/guide-usage
Content-Type: application/json

{
  "user_id": "user_xxx",
  "grid_enabled": true,
  "golden_enabled": false,
  "diagonal_enabled": false,
  "center_enabled": false,
  "downloaded": false,
  "view_duration": 30
}
```

#### 更新下载状态
```http
POST /api/photos/:photo_id/download
Content-Type: application/json

{
  "user_id": "user_xxx"
}
```

#### 获取热门题材和风格
```http
GET /api/photos/popular?limit=20
```

### 数据分析

#### 记录页面访问
```http
POST /api/analytics/page-view
Content-Type: application/json

{
  "user_id": "user_xxx",
  "session_id": "session_xxx",
  "page_name": "index",
  "previous_page": "",
  "duration": 30,
  "device_type": "mobile",
  "browser": "Chrome",
  "os": "iOS",
  "screen_resolution": "1920x1080",
  "referrer": "https://..."
}
```

#### 批量记录页面访问
```http
POST /api/analytics/page-views-batch
Content-Type: application/json

{
  "page_views": [
    { ... },
    { ... }
  ]
}
```

#### 记录用户事件
```http
POST /api/analytics/event
Content-Type: application/json

{
  "user_id": "user_xxx",
  "session_id": "session_xxx",
  "event_type": "click",
  "event_target": "download-button",
  "event_data": {
    "guide_type": "grid"
  },
  "page_name": "result"
}
```

#### 批量记录用户事件
```http
POST /api/analytics/events-batch
Content-Type: application/json

{
  "events": [
    { ... },
    { ... }
  ]
}
```

#### 获取今日DAU
```http
GET /api/analytics/dau
```

### 反馈管理

#### 创建反馈
```http
POST /api/feedback
Content-Type: application/json

{
  "user_id": "user_xxx",
  "photo_id": 123,
  "feedback_type": "suggestion",
  "rating": 5,
  "content": "建议内容...",
  "contact": "user@example.com"
}
```

#### 获取待处理反馈
```http
GET /api/feedback/pending?limit=50
```

#### 更新反馈状态
```http
PUT /api/feedback/:feedback_id
Content-Type: application/json

{
  "status": "resolved",
  "handler": "admin",
  "handle_note": "处理备注..."
}
```

## 🔄 DataWorks数据同步

### 配置步骤

1. **在DataWorks中配置MySQL数据源**
   - 数据源名称：`photo_assistant_mysql`
   - JDBC URL：`jdbc:mysql://your-host:3306/photo_assistant`
   - 用户名/密码：与 `.env` 中配置一致

2. **创建MaxCompute表**
   
   参考 `database/dataworks-sync-guide.md` 创建对应的MaxCompute表结构。

3. **配置同步任务**

   **方案一：全部T+1同步（推荐初期）**
   - 成本：￥24/月
   - 数据延迟：1天
   - 适合：初期用户量小

   **方案二：核心表小时级同步（推荐增长期）**
   - 成本：￥280/月
   - 数据延迟：1小时
   - 适合：用户增长期、需要实时监控

   详细配置参考：
   - `database/hourly-sync-config.md` - 小时级同步配置
   - `database/phase2-hybrid-implementation.md` - 混合同步方案

4. **验证数据同步**

   在MaxCompute中查询：
   ```sql
   -- 查看今日数据
   SELECT COUNT(*) FROM page_views 
   WHERE ds = TO_CHAR(GETDATE(), 'yyyymmdd');
   ```

## 📊 数据表说明

| 表名 | 说明 | 同步建议 |
|------|------|----------|
| users | 用户表 | T+1 |
| photo_records | 照片记录表 | 小时级 |
| page_views | 页面访问记录表 | 小时级 |
| guide_usage | 辅助线使用记录表 | 小时级 |
| user_events | 用户行为事件表 | T+1 |
| feedback | 反馈表 | T+1 |
| advice_views | 建议查看记录表 | T+1 |

## 🔧 常用SQL查询

### 今日DAU
```sql
SELECT COUNT(DISTINCT user_id) as dau
FROM page_views
WHERE DATE(created_time) = CURDATE();
```

### 下载转化率
```sql
SELECT 
  COUNT(*) as total_usage,
  SUM(downloaded) as downloads,
  ROUND(SUM(downloaded) * 100.0 / COUNT(*), 2) as conversion_rate
FROM guide_usage
WHERE created_time >= DATE_SUB(NOW(), INTERVAL 30 DAY);
```

### 热门题材Top10
```sql
SELECT category, style, COUNT(*) as cnt
FROM photo_records
WHERE created_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY category, style
ORDER BY cnt DESC
LIMIT 10;
```

### 用户漏斗分析
```sql
SELECT 
  page_name,
  COUNT(DISTINCT user_id) as users
FROM page_views
WHERE DATE(created_time) = CURDATE()
GROUP BY page_name
ORDER BY FIELD(page_name, 'index', 'upload', 'style-select', 'result');
```

## 🛡️ 安全配置

### CORS配置
在 `.env` 文件中配置允许的域名：
```env
ALLOWED_ORIGINS=http://localhost:8080,https://yourdomain.com
```

### 限流配置
默认限制：每个IP每15分钟最多1000次请求

修改 `server.js` 中的限流配置：
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000
});
```

### 安全头
使用 `helmet` 中间件自动添加安全HTTP头。

## 📈 性能优化

### 数据库连接池
默认配置：
- 最大连接数：10
- 等待队列：无限制

修改 `config/database.js`：
```javascript
const poolConfig = {
  connectionLimit: 20,  // 增加连接数
  queueLimit: 100       // 限制队列大小
};
```

### 批量插入
使用批量API减少请求次数：
- `/api/analytics/page-views-batch`
- `/api/analytics/events-batch`

## 🐛 调试

### 查看日志
开发环境会输出详细的请求日志。

### 数据库查询日志
修改 `config/database.js` 启用查询日志：
```javascript
const pool = mysql.createPool({
  ...poolConfig,
  debug: true  // 启用调试
});
```

### 测试API
推荐使用 Postman 或 curl 测试接口。

## 📦 部署

### Docker部署（推荐）

1. 构建镜像：
```bash
docker build -t photo-advice-server .
```

2. 运行容器：
```bash
docker run -d \
  -p 3000:3000 \
  -e DB_HOST=your-db-host \
  -e DB_PASSWORD=your-password \
  --name photo-server \
  photo-advice-server
```

### PM2部署

1. 安装PM2：
```bash
npm install -g pm2
```

2. 启动服务：
```bash
pm2 start server.js --name photo-server
```

3. 查看状态：
```bash
pm2 status
pm2 logs photo-server
```

## 🤝 前端集成

在前端HTML中引入API工具：

```html
<script src="js/api.js"></script>
```

使用示例：

```javascript
// 用户登录
const user = await API.userLogin({
  nickname: '摄影爱好者'
});

// 创建照片记录
const photo = await API.createPhotoRecord({
  category: '人像',
  style: '日系小清新',
  photo_width: 1920,
  photo_height: 1080
});

// 记录页面访问
await API.recordPageView({
  page_name: 'result',
  previous_page: 'upload',
  duration: 30
});

// 记录用户事件
await API.recordEvent({
  event_type: 'click',
  event_target: 'download-button'
});
```

## 💡 注意事项

1. **生产环境配置**
   - 修改 `NODE_ENV=production`
   - 使用强密码
   - 配置HTTPS
   - 启用日志收集

2. **数据库优化**
   - 定期备份数据
   - 监控数据库性能
   - 根据数据量调整索引

3. **成本控制**
   - 根据实际需求选择同步方案
   - 监控DataWorks费用
   - 定期清理过期数据

## 📞 技术支持

- 项目文档：`database/` 目录下的各个 `.md` 文件
- DataWorks文档：https://help.aliyun.com/product/72772.html

---

**版本**: 1.0.0  
**更新时间**: 2025-10-29  
**作者**: GreeNakia
