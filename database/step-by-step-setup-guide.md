# DataWorks 手把手配置指南

## 📋 配置前准备

### 需要的账号信息
- 阿里云账号
- AccessKey ID 和 AccessKey Secret（RAM访问控制中创建）
- 预算准备：￥220/月（极致优化方案）

### 预计时间
- 第一次配置：2-3小时
- 后续调整：30分钟

---

## 🚀 Step 1: 开通阿里云服务（15分钟）

### 1.1 开通 MaxCompute

**操作步骤**：
1. 登录阿里云控制台：https://www.aliyun.com/
2. 搜索 "MaxCompute" → 点击进入产品页
3. 点击 "立即开通"
4. 选择地域：**华东2（上海）**（建议）
5. 计费方式：**按量付费**
6. 点击 "立即购买"

**预期结果**：开通成功，进入 MaxCompute 控制台

### 1.2 开通 DataWorks

**操作步骤**：
1. 搜索 "DataWorks" → 点击进入产品页
2. 点击 "免费开通"
3. 选择版本：**基础版**（免费）
4. 点击 "立即开通"

**预期结果**：开通成功，进入 DataWorks 控制台

### 1.3 创建 AccessKey（用于API调用）

**操作步骤**：
1. 控制台右上角 → 头像 → AccessKey管理
2. 点击 "创建AccessKey"
3. **重要**：保存 AccessKey ID 和 AccessKey Secret
   ```
   AccessKey ID: LTAI5t...（示例）
   AccessKey Secret: 2xY8k...（示例）
   ```
4. 妥善保管，不要泄露

---

## 🏗️ Step 2: 创建 MaxCompute 项目（10分钟）

### 2.1 创建项目

**操作步骤**：
1. 进入 MaxCompute 控制台
2. 点击 "项目管理" → "创建项目"
3. 填写项目信息：
   ```
   项目名称：photo_assistant_analytics
   项目显示名：AI拍照助手数据分析
   地域：华东2（上海）
   计费模式：按量付费
   ```
4. 点击 "确定"

**预期结果**：项目创建成功，状态为"正常"

### 2.2 记录项目信息

```yaml
项目名称: photo_assistant_analytics
项目ID: [系统自动生成]
地域: cn-shanghai
访问身份: [你的阿里云账号]
```

---

## 🔗 Step 3: 创建 DataWorks 工作空间并关联 MaxCompute（20分钟）

### 3.1 创建工作空间

**操作步骤**：
1. 进入 DataWorks 控制台：https://workbench.data.aliyun.com/
2. 点击 "创建工作空间"
3. 填写工作空间信息：
   ```
   工作空间名称：photo_assistant_workspace
   工作空间显示名：AI拍照助手工作空间
   模式：简单模式（开发即生产）
   地域：华东2（上海）
   ```
4. 点击 "下一步"

### 3.2 关联 MaxCompute 项目 ⭐ **重点**

**操作步骤**：
1. 在"引擎配置"步骤中：
2. **MaxCompute 引擎** 部分：
   - 勾选 "启用 MaxCompute"
   - **计算引擎实例显示名**：AI拍照数据计算
   - **选择 MaxCompute 项目**：
     - 方式A：选择已有项目
       ```
       从下拉列表中选择：photo_assistant_analytics
       ```
     - 方式B：自动创建新项目
       ```
       项目名称：photo_assistant_analytics（会自动创建）
       ```
3. **重要配置**：
   ```yaml
   访问身份: 阿里云主账号
   Quota组: default（默认）
   ```
4. 点击 "创建工作空间"

**预期结果**：
- 工作空间创建成功
- MaxCompute 项目已自动关联
- 可以在 DataWorks 中直接访问 MaxCompute

### 3.3 验证关联成功

**操作步骤**：
1. 进入 DataWorks 工作空间
2. 左侧菜单 → "数据开发"
3. 新建 "ODPS SQL" 节点
4. 执行测试SQL：
   ```sql
   SHOW TABLES;
   ```
5. 如果能正常执行，说明关联成功✅

---

## 🗄️ Step 4: 配置 MySQL 数据源（15分钟）

### 4.1 准备 MySQL 信息

**确认你的 MySQL 连接信息**：
```yaml
主机地址: localhost 或 你的MySQL服务器IP
端口: 3306
数据库名: photo_assistant
用户名: root
密码: [你的密码]
```

### 4.2 添加数据源

**操作步骤**：
1. DataWorks 控制台 → "数据集成" → "数据源管理"
2. 点击 "新增数据源"
3. 选择 "MySQL"
4. 填写配置信息：
   ```yaml
   数据源名称: photo_assistant_mysql
   数据源描述: AI拍照助手MySQL数据库
   JDBC URL: jdbc:mysql://[你的IP]:3306/photo_assistant
   用户名: root
   密码: [你的密码]
   ```
5. **网络配置**：
   - 如果MySQL在本地：需要配置"数据集成Agent"（见下文）
   - 如果MySQL在阿里云RDS：直接选择VPC网络

### 4.3 本地MySQL网络配置（重要）

**如果你的MySQL在本地电脑**，需要：

**方案A：使用公网IP（临时测试）**
```bash
# 1. 开启MySQL远程访问
mysql -u root -p
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY 'your_password';
FLUSH PRIVILEGES;

# 2. 配置防火墙开放3306端口
sudo ufw allow 3306  # Linux
# 或在路由器中设置端口转发

# 3. 获取公网IP
curl ifconfig.me

# 4. 在DataWorks中使用：jdbc:mysql://[公网IP]:3306/photo_assistant
```

**方案B：迁移到阿里云RDS（推荐生产环境）**
```yaml
1. 创建阿里云RDS MySQL实例
2. 导入数据：mysql -h [RDS地址] -u root -p photo_assistant < database/init.sql
3. 在DataWorks中配置RDS内网地址
```

### 4.4 测试连接

**操作步骤**：
1. 配置完成后，点击 "测试连接"
2. 如果提示"连接成功"✅，继续
3. 如果失败❌，检查：
   - MySQL是否运行
   - 网络是否通畅
   - 用户名密码是否正确
   - 防火墙是否开放

---

## 📊 Step 5: 创建 MaxCompute 表（30分钟）

### 5.1 创建数据开发流程

**操作步骤**：
1. DataWorks → "数据开发" → "业务流程"
2. 右键 "业务流程" → "新建业务流程"
3. 流程名称：`photo_assistant_etl`
4. 点击 "确定"

### 5.2 创建表（使用脚本）

**操作步骤**：
1. 右键 `photo_assistant_etl` → "新建" → "MaxCompute" → "表"
2. 点击 "DDL模式"
3. 复制以下SQL（极致优化方案表结构）：

```sql
-- ============================================
-- 核心表1: photo_records (小时级分区)
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
  hh STRING COMMENT '分区小时 HH',
  day_type STRING COMMENT '日期类型: weekday/weekend/holiday'
)
LIFECYCLE 90
COMMENT '照片记录表-精准时段同步';

-- ============================================
-- 核心表2: page_views (小时级分区)
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
  hh STRING COMMENT '分区小时 HH',
  day_type STRING COMMENT '日期类型: weekday/weekend/holiday'
)
LIFECYCLE 90
COMMENT '页面访问记录-精准时段同步';

-- ============================================
-- 核心表3: guide_usage (小时级分区)
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
  hh STRING COMMENT '分区小时 HH',
  day_type STRING COMMENT '日期类型: weekday/weekend/holiday'
)
LIFECYCLE 90
COMMENT '辅助线使用记录-精准时段同步';

-- ============================================
-- 辅助表1: users (T+1，天级分区)
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
```

4. 点击 "执行" → 等待执行完成
5. 重复上述步骤，创建其他表

### 5.3 验证表创建

```sql
-- 查看所有表
SHOW TABLES;

-- 查看表结构
DESC photo_records;
```

---

## 🔄 Step 6: 配置数据同步任务（45分钟）

### 6.1 创建工作日同步任务

**操作步骤**：
1. 右键 `photo_assistant_etl` → "新建" → "数据集成" → "离线同步"
2. 节点名称：`sync_weekday_photo_records`
3. 点击 "切换到脚本模式"
4. 粘贴配置：

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
        "where": "HOUR(created_time) BETWEEN 18 AND 22 AND DATE_FORMAT(created_time, '%Y-%m-%d %H') = DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 HOUR), '%Y-%m-%d %H')",
        "splitPk": "id",
        "table": "photo_records"
      },
      "name": "Reader",
      "category": "reader"
    },
    {
      "stepType": "odps",
      "parameter": {
        "partition": "ds=${bizdate},hh=${bizhour},day_type='weekday'",
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
      "concurrent": 2,
      "throttle": false
    },
    "errorLimit": {
      "record": "0"
    }
  }
}
```

5. 点击 "保存"

### 6.2 配置调度属性

**操作步骤**：
1. 点击任务右侧 "调度配置"
2. 填写调度信息：
   ```yaml
   调度类型: 周期调度
   调度周期: 小时
   Cron表达式: 0 0 18-22 * * 1-5
   生效日期: 立即生效
   依赖属性: 本节点自依赖
   参数:
     bizdate: ${bizdate}
     bizhour: ${hour}-1
   ```
3. 点击 "保存"

### 6.3 测试任务

**操作步骤**：
1. 点击 "运行"
2. 查看运行日志
3. 如果成功✅：
   ```sql
   -- 验证数据
   SELECT COUNT(*) FROM photo_records;
   ```
4. 如果失败❌，查看错误日志并修复

---

## ✅ Step 7: 验证配置（10分钟）

### 7.1 检查清单

```yaml
✅ MaxCompute 项目已创建
✅ DataWorks 工作空间已创建并关联 MaxCompute
✅ MySQL 数据源配置成功
✅ MaxCompute 表创建成功
✅ 同步任务配置成功
✅ 调度任务运行成功
```

### 7.2 测试查询

```sql
-- 1. 查看今日数据
SELECT COUNT(*) FROM photo_records
WHERE ds = TO_CHAR(GETDATE(), 'yyyymmdd');

-- 2. 查看用户活跃度
SELECT COUNT(DISTINCT user_id) FROM page_views
WHERE ds = TO_CHAR(GETDATE(), 'yyyymmdd');

-- 3. 查看小时趋势
SELECT hh, COUNT(*) FROM photo_records
WHERE ds = TO_CHAR(GETDATE(), 'yyyymmdd')
GROUP BY hh ORDER BY CAST(hh AS INT);
```

---

## 🎯 配置完成后的效果

### 数据同步时间表

**工作日（周一到周五）**：
- 18:00 - 同步17:00-18:00数据
- 19:00 - 同步18:00-19:00数据
- 20:00 - 同步19:00-20:00数据
- 21:00 - 同步20:00-21:00数据
- 22:00 - 同步21:00-22:00数据

**周末（周六、周日）**：
- 10:00, 11:00 - 上午时段
- 14:00-17:00 - 下午时段
- 19:00, 20:00 - 晚上时段

### 成本预算

```
每月成本: ￥220
每年成本: ￥2,640
节省比例: 58%（相比24小时方案）
```

---

## 🆘 常见问题

### Q1: MaxCompute 项目关联失败？

**解决方案**：
1. 确认 MaxCompute 项目和 DataWorks 在同一地域
2. 检查账号权限（是否为主账号）
3. 尝试删除工作空间重新创建

### Q2: MySQL 数据源连接失败？

**解决方案**：
1. 检查 MySQL 是否允许远程连接
2. 确认防火墙是否开放3306端口
3. 验证用户名密码是否正确
4. 尝试使用公网IP测试

### Q3: 同步任务失败？

**解决方案**：
1. 查看运行日志找到具体错误
2. 检查WHERE条件是否正确
3. 验证分区字段格式
4. 确认表结构匹配

---

## 📞 获取帮助

- 阿里云工单：https://workorder.console.aliyun.com/
- DataWorks文档：https://help.aliyun.com/product/72772.html
- MaxCompute文档：https://help.aliyun.com/product/27797.html

---

**配置完成！** 🎉

下一步：
1. ✅ 监控任务运行情况
2. ✅ 创建Quick BI仪表板
3. ✅ 配置告警规则
