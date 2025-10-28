# 阿里云DataWorks数据同步方案

## 方案概述

将本地MySQL数据同步到阿里云MaxCompute（原ODPS），在DataWorks中进行数据分析和可视化。

## 架构流程

```
本地MySQL → DataWorks数据集成 → MaxCompute → DataWorks数据开发 → Quick BI可视化
```

## 步骤一：准备阿里云环境

### 1.1 开通服务

登录阿里云控制台，开通以下服务：

- **MaxCompute** - 大数据计算服务
- **DataWorks** - 数据开发平台
- **Quick BI** - 数据可视化（可选）

### 1.2 创建MaxCompute项目

```sql
-- 在MaxCompute中创建项目
-- 项目名称：photo_assistant_analytics
-- 地域：根据实际选择（建议：华东2-上海）
```

### 1.3 在DataWorks创建工作空间

- 工作空间名称：photo_assistant_workspace
- 模式：标准模式（开发环境 + 生产环境）
- MaxCompute项目：关联上面创建的项目

## 步骤二：配置数据源

### 2.1 添加MySQL数据源

在DataWorks控制台：

**数据集成 → 数据源 → 新增数据源 → MySQL**

配置信息：
```json
{
  "数据源名称": "photo_assistant_mysql",
  "数据源类型": "MySQL",
  "JDBC URL": "jdbc:mysql://your-mysql-host:3306/photo_assistant",
  "用户名": "your_username",
  "密码": "your_password",
  "网络类型": "经典网络/VPC"
}
```

**重要提示**：
- 如果MySQL在本地，需要配置DataWorks的数据集成Agent
- 如果MySQL在阿里云RDS，可直接连接
- 建议使用只读账号，权限仅限SELECT

### 2.2 测试连接

点击"测试连接"，确保DataWorks能正常访问MySQL数据库。

## 步骤三：创建MaxCompute表

### 3.1 在DataWorks中创建MaxCompute表

**数据开发 → 业务流程 → 新建业务流程 → 新建MaxCompute表**

```sql
-- ============================================
-- 1. 用户表 (ODPS)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
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
LIFECYCLE 365;

-- ============================================
-- 2. 照片记录表 (ODPS)
-- ============================================
CREATE TABLE IF NOT EXISTS photo_records (
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
PARTITIONED BY (ds STRING COMMENT '分区日期 yyyyMMdd')
LIFECYCLE 365;

-- ============================================
-- 3. 辅助线使用记录表 (ODPS)
-- ============================================
CREATE TABLE IF NOT EXISTS guide_usage (
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
PARTITIONED BY (ds STRING COMMENT '分区日期 yyyyMMdd')
LIFECYCLE 365;

-- ============================================
-- 4. 建议查看记录表 (ODPS)
-- ============================================
CREATE TABLE IF NOT EXISTS advice_views (
  id BIGINT COMMENT '主键ID',
  photo_id BIGINT COMMENT '照片记录ID',
  user_id STRING COMMENT '用户ID',
  advice_type STRING COMMENT '建议类型',
  viewed BOOLEAN COMMENT '是否查看',
  view_duration BIGINT COMMENT '查看时长秒',
  created_time DATETIME COMMENT '创建时间'
)
PARTITIONED BY (ds STRING COMMENT '分区日期 yyyyMMdd')
LIFECYCLE 365;

-- ============================================
-- 5. 页面访问记录表 (ODPS)
-- ============================================
CREATE TABLE IF NOT EXISTS page_views (
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
PARTITIONED BY (ds STRING COMMENT '分区日期 yyyyMMdd')
LIFECYCLE 365;

-- ============================================
-- 6. 用户行为事件表 (ODPS)
-- ============================================
CREATE TABLE IF NOT EXISTS user_events (
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
LIFECYCLE 365;

-- ============================================
-- 7. 反馈表 (ODPS)
-- ============================================
CREATE TABLE IF NOT EXISTS feedback (
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
LIFECYCLE 365;
```

## 步骤四：配置数据同步任务

### 4.1 创建离线同步节点

**数据开发 → 业务流程 → 新建节点 → 数据集成 → 离线同步**

### 4.2 配置同步任务（以users表为例）

**同步配置（向导模式）**：

- **来源类型**：MySQL
- **数据源**：photo_assistant_mysql
- **表**：users
- **数据过滤**：WHERE DATE(created_at) = '$[yyyymmdd-1]' （增量同步）
- **切分键**：id

- **目标类型**：MaxCompute
- **表**：users
- **分区**：ds=${bizdate}
- **清理规则**：写入前清理已有数据

**脚本模式配置示例**：

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
          "id",
          "user_id",
          "openid",
          "nickname",
          "avatar_url",
          "source",
          "register_time",
          "last_login_time",
          "total_quota",
          "used_quota",
          "device_info",
          "created_at",
          "updated_at"
        ],
        "where": "DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)",
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
        "column": [
          "id",
          "user_id",
          "openid",
          "nickname",
          "avatar_url",
          "source",
          "register_time",
          "last_login_time",
          "total_quota",
          "used_quota",
          "device_info",
          "created_at",
          "updated_at"
        ],
        "table": "users"
      },
      "name": "Writer",
      "category": "writer"
    }
  ],
  "setting": {
    "errorLimit": {
      "record": "0"
    },
    "speed": {
      "throttle": false,
      "concurrent": 2,
      "dmu": 1
    }
  },
  "order": {
    "hops": [
      {
        "from": "Reader",
        "to": "Writer"
      }
    ]
  }
}
```

### 4.3 配置调度依赖

**调度配置**：
- 调度周期：每天
- 生效日期：立即生效
- 调度时间：02:00
- 参数：bizdate=$[yyyymmdd-1]

## 步骤五：创建分析SQL

### 5.1 在DataWorks创建ODPS SQL节点

**数据开发 → 新建节点 → MaxCompute → ODPS SQL**

### 5.2 常用分析SQL

```sql
-- ============================================
-- 1. 日活跃用户数 (DAU)
-- ============================================
SELECT 
  ds as date,
  COUNT(DISTINCT user_id) as dau
FROM page_views
WHERE ds >= TO_CHAR(DATEADD(GETDATE(), -30, 'dd'), 'yyyymmdd')
GROUP BY ds
ORDER BY ds DESC;

-- ============================================
-- 2. 题材风格热度Top20
-- ============================================
SELECT 
  category,
  style,
  COUNT(*) as usage_count,
  COUNT(DISTINCT user_id) as user_count
FROM photo_records
WHERE ds >= TO_CHAR(DATEADD(GETDATE(), -30, 'dd'), 'yyyymmdd')
GROUP BY category, style
ORDER BY usage_count DESC
LIMIT 20;

-- ============================================
-- 3. 辅助线使用统计
-- ============================================
SELECT 
  SUM(CASE WHEN grid_enabled THEN 1 ELSE 0 END) as grid_count,
  SUM(CASE WHEN golden_enabled THEN 1 ELSE 0 END) as golden_count,
  SUM(CASE WHEN diagonal_enabled THEN 1 ELSE 0 END) as diagonal_count,
  SUM(CASE WHEN center_enabled THEN 1 ELSE 0 END) as center_count,
  COUNT(*) as total_count,
  ROUND(SUM(CASE WHEN downloaded THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as download_rate
FROM guide_usage
WHERE ds >= TO_CHAR(DATEADD(GETDATE(), -30, 'dd'), 'yyyymmdd');

-- ============================================
-- 4. 用户漏斗分析
-- ============================================
SELECT 
  'index' as step,
  COUNT(DISTINCT user_id) as users,
  1.0 as conversion_rate
FROM page_views
WHERE page_name = 'index' 
  AND ds = TO_CHAR(DATEADD(GETDATE(), -1, 'dd'), 'yyyymmdd')

UNION ALL

SELECT 
  'upload' as step,
  COUNT(DISTINCT user_id) as users,
  ROUND(COUNT(DISTINCT user_id) * 1.0 / 
    (SELECT COUNT(DISTINCT user_id) FROM page_views 
     WHERE page_name = 'index' AND ds = TO_CHAR(DATEADD(GETDATE(), -1, 'dd'), 'yyyymmdd')), 4) as conversion_rate
FROM page_views
WHERE page_name = 'upload' 
  AND ds = TO_CHAR(DATEADD(GETDATE(), -1, 'dd'), 'yyyymmdd')

UNION ALL

SELECT 
  'result' as step,
  COUNT(DISTINCT user_id) as users,
  ROUND(COUNT(DISTINCT user_id) * 1.0 / 
    (SELECT COUNT(DISTINCT user_id) FROM page_views 
     WHERE page_name = 'index' AND ds = TO_CHAR(DATEADD(GETDATE(), -1, 'dd'), 'yyyymmdd')), 4) as conversion_rate
FROM page_views
WHERE page_name = 'result' 
  AND ds = TO_CHAR(DATEADD(GETDATE(), -1, 'dd'), 'yyyymmdd');
```

## 步骤六：Quick BI可视化（可选）

### 6.1 创建数据集

- 数据源：选择MaxCompute项目
- 添加表：users, photo_records, guide_usage等

### 6.2 创建仪表板

**核心指标卡片**：
- DAU/MAU
- 照片分析次数
- 下载转化率
- 用户满意度

**图表类型**：
- 折线图：DAU趋势
- 柱状图：题材分布
- 饼图：风格占比
- 漏斗图：转化漏斗
- 热力图：使用时段分布

## 本地MySQL连接方式

### macOS/Linux

```bash
# 1. 安装MySQL客户端
brew install mysql-client  # macOS
# 或
sudo apt install mysql-client  # Ubuntu

# 2. 连接MySQL
mysql -h localhost -u root -p

# 3. 导入初始化脚本
mysql -u root -p < database/init.sql

# 4. 查询数据
mysql -u root -p photo_assistant
```

### Windows

```cmd
# 1. 下载MySQL Workbench或使用命令行

# 2. 连接MySQL
mysql -h localhost -u root -p

# 3. 导入初始化脚本
mysql -u root -p < database\init.sql
```

### 通过代码连接

**Node.js示例**：
```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'photo_assistant',
  waitForConnections: true,
  connectionLimit: 10
});

// 查询示例
async function getUserStats() {
  const [rows] = await pool.query(`
    SELECT * FROM v_user_overview
  `);
  console.log(rows);
}
```

## 常见问题

### Q1: DataWorks无法连接本地MySQL？

**解决方案**：
1. 配置DataWorks数据集成Agent
2. 或将MySQL迁移到阿里云RDS
3. 或使用公网IP + 安全组配置

### Q2: 数据同步失败？

**检查清单**：
- MySQL数据源配置正确
- 网络连通性
- 权限配置（SELECT权限）
- 分区字段格式正确

### Q3: 如何实现实时同步？

**方案**：
- 使用DataWorks实时同步（Flink）
- 或使用Canal + DataHub
- 或使用DTS数据传输服务

## 成本估算

**DataWorks**：
- 开发版：免费
- 标准版：￥5000/月起

**MaxCompute**：
- 存储：￥0.15/GB/月
- 计算：按量付费

**Quick BI**：
- 高级版：￥39900/年

## 下一步

1. ✅ 本地执行 `database/init.sql` 创建表
2. ✅ 登录阿里云DataWorks控制台
3. ✅ 按照本文档配置数据源和同步任务
4. ✅ 创建分析SQL和可视化仪表板
5. ✅ 配置告警和监控

---

**文档版本**: 1.0  
**更新时间**: 2025-10-27  
**技术支持**: DataWorks官方文档 https://help.aliyun.com/product/72772.html
