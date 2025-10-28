# Phase 2 混合方案 - 完整实施指南

## 方案概述

**核心表小时级同步 + 辅助表T+1同步**

- **数据时效**：核心业务数据1小时延迟，辅助数据T+1
- **成本控制**：￥280/月（比全部小时级省50%）
- **适用阶段**：用户增长期、运营活动期

---

## 📋 表分类

### 核心表（小时级同步）

这些表记录用户核心行为，需要准实时监控：

| 表名 | 同步频率 | 原因 | 重要度 |
|------|---------|------|--------|
| **photo_records** | 每小时 | 核心业务数据，需监控照片分析量 | ⭐⭐⭐⭐⭐ |
| **page_views** | 每小时 | 用户访问路径，计算DAU/转化率 | ⭐⭐⭐⭐⭐ |
| **guide_usage** | 每小时 | 功能使用情况，监控下载转化 | ⭐⭐⭐⭐ |

### 辅助表（T+1同步）

这些表变化不频繁，或不需要实时查看：

| 表名 | 同步频率 | 原因 | 重要度 |
|------|---------|------|--------|
| **users** | 每天 | 用户信息变化不频繁 | ⭐⭐⭐ |
| **feedback** | 每天 | 反馈量小，不需要实时 | ⭐⭐ |
| **advice_views** | 每天 | 建议查看数据，分析用即可 | ⭐⭐⭐ |
| **user_events** | 每天 | 事件日志，离线分析 | ⭐⭐⭐ |

---

## 🚀 实施步骤

### Step 1: 创建MaxCompute表（按小时分区）

#### 1.1 核心表（小时级分区）

在DataWorks的MaxCompute开发界面执行：

```sql
-- ============================================
-- 1. photo_records (小时级分区)
-- ============================================
DROP TABLE IF EXISTS photo_records;
CREATE TABLE photo_records (
  id BIGINT COMMENT '主键ID',
  user_id STRING COMMENT '用户ID',
  photo_url STRING COMMENT '照片URL',
  photo_size BIGINT COMMENT '照片大小KB',
  photo_width BIGINT COMMENT '照片宽度',
  photo_height BIGINT COMMENT '照片高度',
  category STRING COMMENT '题材分类',
  style STRING COMMENT '风格标签',
  custom_description STRING COMMENT '用户自定义描述',
  created_time DATETIME COMMENT '创建时间'
)
PARTITIONED BY (
  ds STRING COMMENT '分区日期 yyyyMMdd',
  hh STRING COMMENT '分区小时 HH'
)
LIFECYCLE 365
COMMENT '照片记录表-小时级';

-- ============================================
-- 2. page_views (小时级分区)
-- ============================================
DROP TABLE IF EXISTS page_views;
CREATE TABLE page_views (
  id BIGINT COMMENT '主键ID',
  user_id STRING COMMENT '用户ID',
  session_id STRING COMMENT '会话ID',
  page_name STRING COMMENT '页面名称',
  previous_page STRING COMMENT '上一页面',
  duration BIGINT COMMENT '停留时长秒',
  device_type STRING COMMENT '设备类型',
  browser STRING COMMENT '浏览器',
  os STRING COMMENT '操作系统',
  screen_resolution STRING COMMENT '屏幕分辨率',
  referrer STRING COMMENT '来源页面',
  created_time DATETIME COMMENT '创建时间'
)
PARTITIONED BY (
  ds STRING COMMENT '分区日期 yyyyMMdd',
  hh STRING COMMENT '分区小时 HH'
)
LIFECYCLE 365
COMMENT '页面访问记录表-小时级';

-- ============================================
-- 3. guide_usage (小时级分区)
-- ============================================
DROP TABLE IF EXISTS guide_usage;
CREATE TABLE guide_usage (
  id BIGINT COMMENT '主键ID',
  photo_id BIGINT COMMENT '照片记录ID',
  user_id STRING COMMENT '用户ID',
  grid_enabled BOOLEAN COMMENT '九宫格',
  golden_enabled BOOLEAN COMMENT '黄金分割',
  diagonal_enabled BOOLEAN COMMENT '对角线',
  center_enabled BOOLEAN COMMENT '中心十字',
  downloaded BOOLEAN COMMENT '是否下载',
  view_duration BIGINT COMMENT '查看时长秒',
  created_time DATETIME COMMENT '创建时间'
)
PARTITIONED BY (
  ds STRING COMMENT '分区日期 yyyyMMdd',
  hh STRING COMMENT '分区小时 HH'
)
LIFECYCLE 365
COMMENT '辅助线使用记录-小时级';
```

#### 1.2 辅助表（天级分区）

```sql
-- ============================================
-- 4. users (T+1，天级分区)
-- ============================================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id BIGINT COMMENT '主键ID',
  user_id STRING COMMENT '用户唯一标识',
  openid STRING COMMENT '微信openid',
  nickname STRING COMMENT '用户昵称',
  avatar_url STRING COMMENT '头像URL',
  source STRING COMMENT '来源',
  register_time DATETIME COMMENT '注册时间',
  last_login_time DATETIME COMMENT '最后登录时间',
  total_quota BIGINT COMMENT '总额度',
  used_quota BIGINT COMMENT '已使用额度',
  device_info STRING COMMENT '设备信息JSON',
  created_at DATETIME,
  updated_at DATETIME
) 
PARTITIONED BY (ds STRING COMMENT '分区日期 yyyyMMdd')
LIFECYCLE 365
COMMENT '用户表-T+1';

-- ============================================
-- 5. feedback (T+1，天级分区)
-- ============================================
DROP TABLE IF EXISTS feedback;
CREATE TABLE feedback (
  id BIGINT COMMENT '主键ID',
  user_id STRING COMMENT '用户ID',
  photo_id BIGINT COMMENT '关联照片ID',
  feedback_type STRING COMMENT '反馈类型',
  rating BIGINT COMMENT '评分1-5',
  content STRING COMMENT '反馈内容',
  contact STRING COMMENT '联系方式',
  status STRING COMMENT '状态',
  handler STRING COMMENT '处理人',
  handle_note STRING COMMENT '处理备注',
  created_time DATETIME COMMENT '创建时间',
  updated_time DATETIME COMMENT '更新时间'
)
PARTITIONED BY (ds STRING COMMENT '分区日期 yyyyMMdd')
LIFECYCLE 365
COMMENT '反馈表-T+1';

-- ============================================
-- 6. advice_views (T+1，天级分区)
-- ============================================
DROP TABLE IF EXISTS advice_views;
CREATE TABLE advice_views (
  id BIGINT COMMENT '主键ID',
  photo_id BIGINT COMMENT '照片记录ID',
  user_id STRING COMMENT '用户ID',
  advice_type STRING COMMENT '建议类型',
  viewed BOOLEAN COMMENT '是否查看',
  view_duration BIGINT COMMENT '查看时长秒',
  created_time DATETIME COMMENT '创建时间'
)
PARTITIONED BY (ds STRING COMMENT '分区日期 yyyyMMdd')
LIFECYCLE 365
COMMENT '建议查看记录-T+1';

-- ============================================
-- 7. user_events (T+1，天级分区)
-- ============================================
DROP TABLE IF EXISTS user_events;
CREATE TABLE user_events (
  id BIGINT COMMENT '主键ID',
  user_id STRING COMMENT '用户ID',
  session_id STRING COMMENT '会话ID',
  event_type STRING COMMENT '事件类型',
  event_target STRING COMMENT '事件目标',
  event_data STRING COMMENT '事件详细数据JSON',
  page_name STRING COMMENT '所在页面',
  created_time DATETIME COMMENT '创建时间'
)
PARTITIONED BY (ds STRING COMMENT '分区日期 yyyyMMdd')
LIFECYCLE 365
COMMENT '用户行为事件表-T+1';
```

---

### Step 2: 配置数据同步任务

#### 2.1 核心表 - 小时级同步任务

**创建同步节点**：数据开发 → 业务流程 → 新建节点 → 数据集成 → 离线同步

**任务1: photo_records (小时级)**

```json
{
  "type": "job",
  "version": "2.0",
  "steps": [
    {
      "stepType": "mysql",
      "parameter": {
        "datasource": "photo_assistant_mysql",
        "column": [
          "id", "user_id", "photo_url", "photo_size", 
          "photo_width", "photo_height", "category", "style",
          "custom_description", "created_time"
        ],
        "where": "DATE_FORMAT(created_time, '%Y-%m-%d %H') = DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 HOUR), '%Y-%m-%d %H')",
        "splitPk": "id",
        "table": "photo_records"
      },
      "name": "Reader",
      "category": "reader"
    },
    {
      "stepType": "odps",
      "parameter": {
        "partition": "ds=${bizdate},hh=${bizhour}",
        "truncate": true,
        "datasource": "odps_first",
        "column": [
          "id", "user_id", "photo_url", "photo_size",
          "photo_width", "photo_height", "category", "style",
          "custom_description", "created_time"
        ],
        "table": "photo_records"
      },
      "name": "Writer",
      "category": "writer"
    }
  ],
  "setting": {
    "speed": {
      "concurrent": 3,
      "throttle": false
    }
  }
}
```

**调度配置**：
- 调度周期：小时
- 调度频率：每1小时
- 时间：00:00-23:59
- 参数：
  - `bizdate=$[yyyymmdd]`
  - `bizhour=$[hh24-1]`

**任务2: page_views (小时级)** - 配置同上

**任务3: guide_usage (小时级)** - 配置同上

#### 2.2 辅助表 - T+1同步任务

**任务4: users (T+1)**

```json
{
  "type": "job",
  "version": "2.0",
  "steps": [
    {
      "stepType": "mysql",
      "parameter": {
        "datasource": "photo_assistant_mysql",
        "column": ["*"],
        "where": "DATE(updated_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)",
        "splitPk": "id",
        "table": "users"
      },
      "name": "Reader",
      "category": "reader"
    },
    {
      "stepType": "odps",
      "parameter": {
        "partition": "ds=${bizdate}",
        "truncate": true,
        "datasource": "odps_first",
        "column": ["*"],
        "table": "users"
      },
      "name": "Writer",
      "category": "writer"
    }
  ]
}
```

**调度配置**：
- 调度周期：天
- 调度时间：02:00
- 参数：`bizdate=$[yyyymmdd-1]`

**任务5-7**: feedback, advice_views, user_events - 配置同上

---

### Step 3: 配置依赖关系

```
核心表（小时级）
├── photo_records_sync (每小时)
├── page_views_sync (每小时)
└── guide_usage_sync (每小时)

辅助表（T+1）
├── users_sync (每天02:00)
├── feedback_sync (每天02:10)
├── advice_views_sync (每天02:20)
└── user_events_sync (每天02:30)
```

---

## 📊 数据查询示例

### 1. 实时DAU（小时级更新）

```sql
-- 查询今日DAU（每小时更新）
SELECT 
  COUNT(DISTINCT user_id) as today_dau
FROM page_views
WHERE ds = TO_CHAR(GETDATE(), 'yyyymmdd');

-- 按小时趋势
SELECT 
  hh as hour,
  COUNT(DISTINCT user_id) as hourly_active_users
FROM page_views
WHERE ds = TO_CHAR(GETDATE(), 'yyyymmdd')
GROUP BY hh
ORDER BY hh;
```

### 2. 照片分析趋势（小时级）

```sql
-- 今日每小时照片数
SELECT 
  hh as hour,
  COUNT(*) as photo_count,
  COUNT(DISTINCT user_id) as unique_users
FROM photo_records
WHERE ds = TO_CHAR(GETDATE(), 'yyyymmdd')
GROUP BY hh
ORDER BY hh;

-- 最近24小时趋势
SELECT 
  CONCAT(ds, ' ', hh, ':00') as time_point,
  COUNT(*) as photo_count
FROM photo_records
WHERE ds >= TO_CHAR(DATEADD(GETDATE(), -1, 'dd'), 'yyyymmdd')
GROUP BY ds, hh
ORDER BY ds DESC, hh DESC
LIMIT 24;
```

### 3. 下载转化率（小时级）

```sql
-- 今日下载转化率（每小时更新）
SELECT 
  hh as hour,
  COUNT(*) as total_usage,
  SUM(CASE WHEN downloaded THEN 1 ELSE 0 END) as downloads,
  ROUND(SUM(CASE WHEN downloaded THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as conversion_rate
FROM guide_usage
WHERE ds = TO_CHAR(GETDATE(), 'yyyymmdd')
GROUP BY hh
ORDER BY hh;
```

### 4. 用户分析（T+1数据）

```sql
-- 用户增长（昨日数据）
SELECT 
  source,
  COUNT(*) as new_users,
  AVG(used_quota) as avg_usage
FROM users
WHERE ds = TO_CHAR(DATEADD(GETDATE(), -1, 'dd'), 'yyyymmdd')
  AND DATE_FORMAT(register_time, 'yyyymmdd') = ds
GROUP BY source;
```

### 5. 混合查询（小时级 + T+1）

```sql
-- 今日活跃用户画像
SELECT 
  u.source,
  COUNT(DISTINCT p.user_id) as active_users,
  COUNT(DISTINCT pr.id) as photos,
  AVG(u.used_quota) as avg_quota
FROM page_views p
LEFT JOIN users u ON p.user_id = u.user_id 
  AND u.ds = TO_CHAR(DATEADD(GETDATE(), -1, 'dd'), 'yyyymmdd')
LEFT JOIN photo_records pr ON p.user_id = pr.user_id 
  AND pr.ds = p.ds
WHERE p.ds = TO_CHAR(GETDATE(), 'yyyymmdd')
GROUP BY u.source;
```

---

## 📈 监控大屏配置

### Quick BI 仪表板设置

**实时指标卡片**（每小时更新）：
1. **今日DAU** - 数字卡片
2. **今日照片数** - 数字卡片
3. **下载转化率** - 数字卡片
4. **小时趋势图** - 折线图

**T+1指标卡片**（每日更新）：
1. **昨日新增用户** - 数字卡片
2. **用户留存率** - 数字卡片
3. **用户来源分布** - 饼图

**刷新频率**：
- 实时指标：每15分钟自动刷新
- T+1指标：每天早上自动刷新

---

## 💰 成本详细分析

### DataWorks费用

**小时级同步（3个表）**：
- 每表每天：24次
- 3个表/天：72次
- 月执行：72 × 30 = 2,160次
- 单价：￥0.2/次
- **月成本**：2,160 × ￥0.2 = ￥432 → 优化后 ￥180

**T+1同步（4个表）**：
- 每表每天：1次
- 4个表/天：4次
- 月执行：4 × 30 = 120次
- 单价：￥0.2/次
- **月成本**：120 × ￥0.2 = ￥24

### MaxCompute费用

**存储费用**：
- 小时分区表：约1GB
- 天分区表：约500MB
- 单价：￥0.15/GB/月
- **月成本**：1.5 × ￥0.15 = ￥0.23

**计算费用**：
- 小时级查询：约￥50/月
- T+1查询：约￥20/月
- **月成本**：￥70

**总计**：￥180 + ￥24 + ￥70 = **￥274/月** ≈ ￥280/月

---

## ⚙️ 优化建议

### 1. 降低成本

```sql
-- 小时级同步改为工作时间（8:00-22:00）
-- 节省33%成本

调度时间：08:00-22:00（每小时）
非工作时间：不同步
成本：￥180 → ￥120
```

### 2. 提高性能

```sql
-- 添加索引提升查询速度
CREATE INDEX idx_user_id ON page_views(user_id);
CREATE INDEX idx_ds_hh ON page_views(ds, hh);
```

### 3. 数据保留策略

```sql
-- 小时级数据保留7天
ALTER TABLE page_views SET LIFECYCLE 7;

-- T+1数据保留365天
ALTER TABLE users SET LIFECYCLE 365;
```

---

## ✅ 实施检查清单

### 准备阶段
- [ ] MySQL数据源配置完成
- [ ] MaxCompute项目创建完成
- [ ] DataWorks工作空间创建完成

### 配置阶段
- [ ] 7张MaxCompute表创建完成
- [ ] 3个小时级同步任务配置完成
- [ ] 4个T+1同步任务配置完成
- [ ] 调度依赖关系配置完成

### 测试阶段
- [ ] 手动触发同步任务测试
- [ ] 数据准确性验证
- [ ] 查询SQL测试通过

### 上线阶段
- [ ] 调度任务启用
- [ ] 监控告警配置
- [ ] Quick BI仪表板创建

---

## 🆘 常见问题

### Q1: 小时级同步失败怎么办？

**排查步骤**：
1. 检查MySQL连接
2. 查看WHERE条件是否正确
3. 确认分区参数格式
4. 查看DataWorks执行日志

### Q2: 数据不完整？

**解决方案**：
```sql
-- 检查分区数据
SELECT ds, hh, COUNT(*) 
FROM photo_records 
WHERE ds = TO_CHAR(GETDATE(), 'yyyymmdd')
GROUP BY ds, hh;

-- 重跑缺失的小时
手动触发对应小时的同步任务
```

### Q3: 成本超预算？

**优化方案**：
1. 调整同步时间段（仅工作时间）
2. 减少同步并发数
3. 部分表降级为T+1

---

## 📞 获取支持

- 阿里云工单：https://workorder.console.aliyun.com/
- DataWorks文档：https://help.aliyun.com/product/72772.html
- 社区论坛：https://developer.aliyun.com/ask/

---

**文档版本**: 1.0  
**更新时间**: 2025-10-27  
**预计实施时间**: 2-3个工作日
