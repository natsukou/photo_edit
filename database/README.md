# 数据库快速开始指南

## 📋 目录结构

```
database/
├── README.md                    # 本文件 - 快速开始指南
├── init.sql                     # MySQL初始化脚本
├── dataworks-sync-guide.md      # 阿里云DataWorks同步指南
└── queries/                     # 常用查询SQL（即将创建）
```

## 🚀 快速开始（3分钟）

### 方式一：本地MySQL

#### Step 1: 确保MySQL已安装

```bash
# 检查MySQL是否安装
mysql --version

# 如未安装，macOS执行：
brew install mysql

# 或Windows下载安装包：
# https://dev.mysql.com/downloads/mysql/
```

#### Step 2: 导入数据库

```bash
# 进入项目目录
cd /Users/nakia/Downloads/project_h5

# 导入数据库（会提示输入密码）
mysql -u root -p < database/init.sql
```

#### Step 3: 验证安装

```bash
# 登录MySQL
mysql -u root -p

# 执行查询
USE photo_assistant;
SHOW TABLES;
SELECT * FROM v_user_overview;
```

### 方式二：使用Docker（推荐）

```bash
# 1. 启动MySQL容器
docker run --name photo-mysql \
  -e MYSQL_ROOT_PASSWORD=your_password \
  -e MYSQL_DATABASE=photo_assistant \
  -p 3306:3306 \
  -v $(pwd)/database:/docker-entrypoint-initdb.d \
  -d mysql:8.0

# 2. 等待MySQL启动（约30秒）
docker logs -f photo-mysql

# 3. 连接MySQL
docker exec -it photo-mysql mysql -uroot -p
```

## 📊 查看数据

### 方法一：命令行

```sql
-- 查看用户总览
SELECT * FROM v_user_overview;

-- 查看热门题材风格
SELECT * FROM v_category_style_popularity;

-- 查看辅助线统计
SELECT * FROM v_guide_stats;
```

### 方法二：图形化工具

**推荐工具**：

1. **MySQL Workbench** (官方免费)
   - 下载：https://dev.mysql.com/downloads/workbench/
   - 连接信息：Host=localhost, Port=3306, User=root

2. **DBeaver** (开源免费)
   - 下载：https://dbeaver.io/download/
   - 支持多种数据库

3. **DataGrip** (JetBrains付费)
   - 下载：https://www.jetbrains.com/datagrip/
   - 功能强大

### 方法三：VS Code插件

安装 **MySQL** 插件：
1. 打开VS Code
2. 搜索并安装 "MySQL" 插件
3. 配置连接信息
4. 直接在编辑器中查询

## 🔗 连接信息

### 本地MySQL

```
Host: localhost
Port: 3306
Database: photo_assistant
Username: root
Password: your_password
```

### Docker MySQL

```
Host: localhost (或 127.0.0.1)
Port: 3306
Database: photo_assistant
Username: root
Password: your_password
```

## 📈 核心功能查询

### 1. 查看今日数据

```sql
-- 今日新增用户
SELECT COUNT(*) as today_new_users
FROM users
WHERE DATE(register_time) = CURDATE();

-- 今日照片数
SELECT COUNT(*) as today_photos
FROM photo_records
WHERE DATE(created_time) = CURDATE();
```

### 2. 用户活跃度

```sql
-- 最近7天DAU
SELECT 
  DATE(created_time) as date,
  COUNT(DISTINCT user_id) as dau
FROM page_views
WHERE created_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY DATE(created_time)
ORDER BY date DESC;
```

### 3. 功能使用分析

```sql
-- 各辅助线使用率
SELECT 
  ROUND(SUM(grid_enabled) * 100.0 / COUNT(*), 2) as grid_rate,
  ROUND(SUM(golden_enabled) * 100.0 / COUNT(*), 2) as golden_rate,
  ROUND(SUM(diagonal_enabled) * 100.0 / COUNT(*), 2) as diagonal_rate,
  ROUND(SUM(center_enabled) * 100.0 / COUNT(*), 2) as center_rate
FROM guide_usage;
```

## 🌥️ 同步到阿里云

详细步骤请查看：[DataWorks同步指南](dataworks-sync-guide.md)

**简要流程**：
1. 开通阿里云DataWorks和MaxCompute
2. 配置MySQL数据源
3. 创建MaxCompute表
4. 配置数据同步任务
5. 调度定时执行

## 🛠️ 常用操作

### 备份数据库

```bash
# 备份所有数据
mysqldump -u root -p photo_assistant > backup_$(date +%Y%m%d).sql

# 只备份表结构
mysqldump -u root -p --no-data photo_assistant > schema.sql
```

### 恢复数据库

```bash
# 恢复数据
mysql -u root -p photo_assistant < backup_20251027.sql
```

### 清空测试数据

```sql
-- 清空所有数据（保留表结构）
TRUNCATE TABLE feedback;
TRUNCATE TABLE user_events;
TRUNCATE TABLE page_views;
TRUNCATE TABLE advice_views;
TRUNCATE TABLE guide_usage;
TRUNCATE TABLE photo_records;
TRUNCATE TABLE users;
```

## 📝 表说明

| 表名 | 说明 | 记录数预估 |
|------|------|-----------|
| users | 用户表 | 10万+ |
| photo_records | 照片记录 | 100万+ |
| guide_usage | 辅助线使用 | 100万+ |
| advice_views | 建议查看 | 500万+ |
| page_views | 页面访问 | 1000万+ |
| user_events | 行为事件 | 5000万+ |
| feedback | 用户反馈 | 1万+ |

## ⚙️ 性能优化建议

### 1. 索引优化

```sql
-- 查看索引使用情况
SHOW INDEX FROM photo_records;

-- 添加复合索引
CREATE INDEX idx_user_created ON photo_records(user_id, created_time);
```

### 2. 分区表（数据量大时）

```sql
-- 按月分区
ALTER TABLE page_views
PARTITION BY RANGE (YEAR(created_time)*100 + MONTH(created_time)) (
  PARTITION p202510 VALUES LESS THAN (202511),
  PARTITION p202511 VALUES LESS THAN (202512),
  PARTITION p202512 VALUES LESS THAN (202601)
);
```

### 3. 定期清理

```sql
-- 删除90天前的日志数据
DELETE FROM page_views 
WHERE created_time < DATE_SUB(CURDATE(), INTERVAL 90 DAY);

-- 删除180天前的事件数据
DELETE FROM user_events 
WHERE created_time < DATE_SUB(CURDATE(), INTERVAL 180 DAY);
```

## 🔍 故障排查

### 问题1: 无法连接MySQL

```bash
# 检查MySQL服务状态
# macOS
brew services list | grep mysql

# Linux
systemctl status mysql

# 启动MySQL
brew services start mysql  # macOS
systemctl start mysql      # Linux
```

### 问题2: 导入SQL失败

```bash
# 检查SQL文件编码
file -I database/init.sql

# 转换编码（如果需要）
iconv -f gb2312 -t utf-8 init.sql > init_utf8.sql
```

### 问题3: 权限不足

```sql
-- 赋予权限
GRANT ALL PRIVILEGES ON photo_assistant.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

## 📚 更多资源

- [MySQL官方文档](https://dev.mysql.com/doc/)
- [DataWorks文档](https://help.aliyun.com/product/72772.html)
- [SQL教程](https://www.w3schools.com/sql/)

## 🆘 获取帮助

- 项目问题：提交Issue到GitHub
- 技术支持：联系项目维护者
- 社区讨论：加入交流群

---

**快速开始完成！** 🎉

下一步：
1. ✅ 查看测试数据
2. ✅ 运行示例查询
3. ✅ 配置阿里云同步（可选）
4. ✅ 开始数据分析
