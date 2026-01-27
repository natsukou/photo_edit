# MaxCompute 数据集成指南

## 概述

本指南介绍如何将"红色丝绒·摄影助手"的用户行为数据同步到阿里云MaxCompute进行大数据分析。

## 配置要求

### 环境变量配置

在 `.env` 文件中添加以下配置：

```env
# MaxCompute配置
MAXCOMPUTE_ACCESS_KEY_ID=your_access_key_id
MAXCOMPUTE_ACCESS_KEY_SECRET=your_access_key_secret
MAXCOMPUTE_PROJECT=your_project_name
MAXCOMPUTE_ENDPOINT=https://service.cn-shanghai.maxcompute.aliyun.com/api
```

### 依赖安装

需要安装阿里云ODPS SDK：

```bash
npm install aliyun-odps-sdk-nodejs
```

## 数据表结构

### 1. 页面访问记录表 (page_views)

```sql
CREATE TABLE IF NOT EXISTS page_views (
  id BIGINT,
  user_id STRING,
  session_id STRING,
  page_name STRING,
  previous_page STRING,
  duration INT,
  device_type STRING,
  browser STRING,
  os STRING,
  screen_resolution STRING,
  referrer STRING,
  created_time DATETIME
) 
PARTITIONED BY (ds STRING) -- 按日期分区
LIFECYCLE 365; -- 保留365天
```

### 2. 用户行为事件表 (user_events)

```sql
CREATE TABLE IF NOT EXISTS user_events (
  id BIGINT,
  user_id STRING,
  session_id STRING,
  event_type STRING,
  event_target STRING,
  event_data STRING,  -- JSON格式存储
  page_name STRING,
  created_time DATETIME
)
PARTITIONED BY (ds STRING)
LIFECYCLE 365;
```

### 3. 照片记录表 (photo_records)

```sql
CREATE TABLE IF NOT EXISTS photo_records (
  id BIGINT,
  user_id STRING,
  photo_url STRING,
  photo_size INT,
  photo_width INT,
  photo_height INT,
  category STRING,
  style STRING,
  custom_description STRING,
  created_time DATETIME
)
PARTITIONED BY (ds STRING)
LIFECYCLE 365;
```

## 同步策略

### 1. 全量同步（首次）

适用于初次接入MaxCompute时的全量数据迁移。

```bash
curl -X POST http://your-server/api/maxcompute/sync-now \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "tables": ["page_views", "user_events", "photo_records"]
  }'
```

### 2. 增量同步（日常）

每日同步前一天的数据。

```bash
curl -X POST http://your-server/api/maxcompute/sync-now \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "tables": ["page_views", "user_events", "photo_records"]
  }'
```

### 3. 定时同步配置

配置定时任务自动同步数据：

```bash
curl -X POST http://your-server/api/maxcompute/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "cronExpression": "0 2 * * *",  -- 每天凌晨2点执行
    "enabledTables": ["page_views", "user_events", "photo_records"]
  }'
```

## API接口

### 1. 立即同步数据

```
POST /api/maxcompute/sync-now
```

请求参数：
- `startDate`: 开始日期 (可选)
- `endDate`: 结束日期 (可选)  
- `tables`: 要同步的表名数组 (可选，默认同步所有表)

### 2. 获取同步统计

```
GET /api/maxcompute/stats
```

返回最近24小时的数据统计信息。

### 3. 配置定时任务

```
POST /api/maxcompute/schedule
```

请求参数：
- `cronExpression`: Cron表达式
- `enabledTables`: 启用的表名数组

### 4. 获取表结构

```
GET /api/maxcompute/schema
```

返回建议的MaxCompute表结构定义。

## 数据分析示例

### 1. 用户活跃度分析

```sql
SELECT 
  ds as date,
  COUNT(DISTINCT user_id) as dau  -- 日活跃用户数
FROM page_views 
WHERE ds >= '${bizdate}'
GROUP BY ds
ORDER BY ds DESC;
```

### 2. 功能使用分析

```sql
SELECT 
  category,
  style,
  COUNT(*) as usage_count,
  COUNT(DISTINCT user_id) as user_count
FROM photo_records
WHERE ds = '${bizdate}'
GROUP BY category, style
ORDER BY usage_count DESC
LIMIT 20;
```

### 3. 用户行为漏斗分析

```sql
WITH funnel AS (
  SELECT 'index' as step, COUNT(DISTINCT user_id) as users FROM page_views WHERE page_name = 'index' AND ds = '${bizdate}'
  UNION ALL
  SELECT 'upload' as step, COUNT(DISTINCT user_id) as users FROM page_views WHERE page_name = 'upload' AND ds = '${bizdate}'
  UNION ALL
  SELECT 'style-select' as step, COUNT(DISTINCT user_id) as users FROM page_views WHERE page_name = 'style-select' AND ds = '${bizdate}'
  UNION ALL
  SELECT 'result' as step, COUNT(DISTINCT user_id) as users FROM page_views WHERE page_name = 'result' AND ds = '${bizdate}'
)
SELECT * FROM funnel ORDER BY users DESC;
```

## 性能优化建议

### 1. 分区策略
- 按日期(ds)进行分区，便于数据管理和查询性能优化
- 设置合理的生命周期，自动清理过期数据

### 2. 同步频率
- 根据业务需求选择合适的同步频率
- 建议日常使用增量同步，减少数据传输量

### 3. 数据压缩
- 在传输过程中对数据进行压缩
- 利用MaxCompute的列式存储优势

## 故障排查

### 1. 同步失败
- 检查MaxCompute连接配置
- 确认AK/SK权限是否足够
- 查看MaxCompute配额是否充足

### 2. 性能问题
- 检查分区键选择是否合理
- 确认查询语句是否使用了分区裁剪
- 评估数据倾斜情况

### 3. 数据一致性
- 定期对比MySQL和MaxCompute数据量
- 建立数据校验机制
- 监控同步任务执行状态

## 安全考虑

- 使用RAM子账号进行MaxCompute访问
- 遵循最小权限原则
- 定期轮换AccessKey
- 对敏感数据进行脱敏处理

---

**文档版本**: 1.0  
**更新日期**: 2025-01-27  
**维护者**: 红色丝绒开发团队