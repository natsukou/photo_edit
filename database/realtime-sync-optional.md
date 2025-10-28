# DataWorks 实时数据同步方案（可选）

## 方案概述

使用DataWorks实时同步（基于Flink）或DTS数据传输服务，实现秒级数据同步。

## ⚠️ 重要提示

**实时同步适用场景**：
- 实时大屏展示
- 核心业务监控
- 异常告警系统
- 高频交易场景

**不推荐场景**：
- 日常数据分析
- 报表统计
- 历史数据查询

## 方案对比

### 方案A：DataWorks实时同步 + Flink

**特点**：
- 延迟：秒级（1-5秒）
- 成本：高（约￥2000/月）
- 复杂度：高
- 稳定性：优秀

### 方案B：DTS数据传输服务

**特点**：
- 延迟：秒级（<3秒）
- 成本：中（约￥800/月）
- 复杂度：低
- 稳定性：极好

### 方案C：Canal + DataHub

**特点**：
- 延迟：秒级（1-2秒）
- 成本：中（约￥600/月）
- 复杂度：中
- 稳定性：好

## 推荐方案：DTS数据传输服务

### 配置步骤

#### 1. 开通DTS服务

登录阿里云控制台 → 数据传输服务DTS → 创建迁移/同步任务

#### 2. 配置源库（MySQL）

```json
{
  "数据库类型": "MySQL",
  "实例类型": "自建数据库",
  "主机名或IP": "your-mysql-host",
  "端口": 3306,
  "数据库账号": "dts_user",
  "数据库密码": "your_password",
  "数据库名": "photo_assistant"
}
```

**MySQL需要配置**：
```sql
-- 创建DTS专用账号
CREATE USER 'dts_user'@'%' IDENTIFIED BY 'your_password';
GRANT SELECT, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'dts_user'@'%';
FLUSH PRIVILEGES;

-- 开启binlog
-- 编辑 my.cnf
[mysqld]
log-bin=mysql-bin
binlog_format=ROW
server-id=1
```

#### 3. 配置目标库（MaxCompute）

```json
{
  "目标类型": "MaxCompute",
  "项目名称": "photo_assistant_analytics",
  "AccessKey": "your_access_key",
  "SecretKey": "your_secret_key"
}
```

#### 4. 选择同步对象

```
photo_assistant.users → photo_assistant_analytics.users
photo_assistant.photo_records → photo_assistant_analytics.photo_records
photo_assistant.guide_usage → photo_assistant_analytics.guide_usage
```

#### 5. 启动同步任务

- 结构迁移：✅
- 全量数据初始化：✅
- 增量数据同步：✅

### MaxCompute表结构（实时）

```sql
-- 实时表不需要分区
CREATE TABLE IF NOT EXISTS users_realtime (
  id BIGINT,
  user_id STRING,
  nickname STRING,
  source STRING,
  total_quota BIGINT,
  used_quota BIGINT,
  register_time DATETIME,
  last_login_time DATETIME,
  PRIMARY KEY (id)
) NOT CLUSTERED;

-- 查询最新数据
SELECT * FROM users_realtime ORDER BY last_login_time DESC LIMIT 10;
```

## 实时查询示例

### 1. 实时DAU

```sql
-- 今日实时活跃用户
SELECT 
  COUNT(DISTINCT user_id) as realtime_dau
FROM page_views_realtime
WHERE TO_CHAR(created_time, 'yyyymmdd') = TO_CHAR(GETDATE(), 'yyyymmdd');
```

### 2. 实时照片数

```sql
-- 最近1小时新增照片
SELECT 
  COUNT(*) as last_hour_photos
FROM photo_records_realtime
WHERE created_time >= DATEADD(GETDATE(), -1, 'hh');
```

### 3. 实时转化漏斗

```sql
-- 实时转化率
WITH funnel AS (
  SELECT 
    page_name,
    COUNT(DISTINCT user_id) as users
  FROM page_views_realtime
  WHERE TO_CHAR(created_time, 'yyyymmdd') = TO_CHAR(GETDATE(), 'yyyymmdd')
  GROUP BY page_name
)
SELECT 
  page_name,
  users,
  ROUND(users * 100.0 / MAX(users) OVER(), 2) as conversion_rate
FROM funnel;
```

## 成本详细分析

### DTS费用

**数据同步链路费用**：
- 基础链路：￥600/月/链路
- 7个表 = 7个链路
- **月成本**：￥4200/月 😱

**优化方案**：
- 只同步3个核心表
- **优化后**：￥1800/月

### MaxCompute费用

**实时计算费用**：
- 比离线计算贵10倍
- **月成本**：约￥2000/月

**总计**：约￥3800/月

## 💡 推荐的实际方案

### 三层数据架构（最佳实践）

```
┌─────────────────────────────────────┐
│  Layer 1: 实时层（秒级）            │
│  - 核心指标监控（DAU、转化率）       │
│  - 异常告警                         │
│  成本：￥800/月                     │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  Layer 2: 小时级（准实时）           │
│  - 运营数据分析                     │
│  - 用户行为分析                     │
│  成本：￥280/月                     │
└─────────────────────────────────────┐
           ↓
┌─────────────────────────────────────┐
│  Layer 3: T+1（离线）               │
│  - 历史数据分析                     │
│  - 复杂报表生成                     │
│  成本：￥100/月                     │
└─────────────────────────────────────┘

总成本：￥1180/月
```

### 具体配置

**实时层（3个核心指标）**：
- 当前在线用户数
- 今日DAU
- 今日转化率

**小时级（3个核心表）**：
- photo_records
- page_views
- guide_usage

**T+1（4个辅助表）**：
- users
- feedback
- advice_views
- user_events

## 实施建议

### 初期（前3个月）

```
✅ 使用：T+1离线同步
💰 成本：￥100/月
📊 满足：日常分析需求
```

### 成长期（3-6个月）

```
✅ 使用：T+1 + 小时级混合
💰 成本：￥280/月
📊 满足：运营监控需求
```

### 成熟期（6个月后）

```
✅ 使用：三层架构
💰 成本：￥1180/月
📊 满足：全方位数据需求
```

## 替代方案：前端埋点 + 日志服务

### 更低成本的实时方案

**使用阿里云SLS（日志服务）**：

```javascript
// 前端直接发送到SLS
const SLS = {
  send(event) {
    fetch('https://your-project.cn-shanghai.log.aliyuncs.com/logstores/user_events/track', {
      method: 'POST',
      headers: {
        'x-log-apiversion': '0.6.0',
        'x-log-signaturemethod': 'hmac-sha1'
      },
      body: JSON.stringify(event)
    });
  }
};

// 实时查询（SQL）
SELECT 
  COUNT(DISTINCT user_id) as realtime_dau
FROM user_events
WHERE __time__ > NOW() - INTERVAL 5 MINUTE;
```

**成本**：
- SLS费用：￥50/月
- 查询费用：￥20/月
- **总计**：￥70/月 ✅ 极低

## 总结建议

### 对于你的项目

**推荐方案**：**T+1 离线同步** ✅

**理由**：
1. 项目初期，数据量不大
2. 主要用于数据分析和报表
3. 成本最低（￥100/月）
4. 满足95%的需求

**未来扩展**：
- 用户增长后，考虑加入小时级同步
- 重要活动时，临时开启实时监控
- 通过前端埋点实现关键指标实时展示

---

**文档版本**: 1.0  
**更新时间**: 2025-10-27
