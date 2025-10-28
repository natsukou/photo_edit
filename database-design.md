# 数据库设计文档

## 数据库概述

为AI拍照辅助H5应用设计的数据分析数据库，用于记录用户行为、使用数据和产品分析。

## 数据库选型建议

- **MySQL 8.0+** - 适合中小规模数据，支持完整SQL
- **PostgreSQL 14+** - 更强大的分析功能，支持JSON
- **MongoDB** - 如需灵活schema，适合快速迭代

## 表结构设计

### 1. 用户表 (users)

记录用户基本信息

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(64) UNIQUE NOT NULL COMMENT '用户唯一标识',
  openid VARCHAR(128) COMMENT '微信openid',
  nickname VARCHAR(128) COMMENT '用户昵称',
  avatar_url VARCHAR(512) COMMENT '头像URL',
  source VARCHAR(32) DEFAULT 'h5' COMMENT '来源: h5/miniprogram/app',
  register_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  last_login_time DATETIME COMMENT '最后登录时间',
  total_quota INT DEFAULT 50 COMMENT '总额度',
  used_quota INT DEFAULT 0 COMMENT '已使用额度',
  device_info JSON COMMENT '设备信息',
  INDEX idx_openid (openid),
  INDEX idx_register_time (register_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

### 2. 照片记录表 (photo_records)

记录每次照片分析的详细信息

```sql
CREATE TABLE photo_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(64) NOT NULL COMMENT '用户ID',
  photo_url VARCHAR(512) COMMENT '照片URL',
  photo_size INT COMMENT '照片大小(KB)',
  photo_width INT COMMENT '照片宽度',
  photo_height INT COMMENT '照片高度',
  category VARCHAR(32) COMMENT '题材分类',
  style VARCHAR(64) COMMENT '风格标签',
  custom_description TEXT COMMENT '用户自定义描述',
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_user_id (user_id),
  INDEX idx_category (category),
  INDEX idx_created_time (created_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='照片记录表';
```

### 3. 辅助线使用记录表 (guide_usage)

记录用户使用的辅助线类型

```sql
CREATE TABLE guide_usage (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  photo_id BIGINT NOT NULL COMMENT '照片记录ID',
  user_id VARCHAR(64) NOT NULL COMMENT '用户ID',
  grid_enabled TINYINT(1) DEFAULT 0 COMMENT '九宫格',
  golden_enabled TINYINT(1) DEFAULT 0 COMMENT '黄金分割',
  diagonal_enabled TINYINT(1) DEFAULT 0 COMMENT '对角线',
  center_enabled TINYINT(1) DEFAULT 0 COMMENT '中心十字',
  downloaded TINYINT(1) DEFAULT 0 COMMENT '是否下载',
  view_duration INT COMMENT '查看时长(秒)',
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_photo_id (photo_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='辅助线使用记录';
```

### 4. 建议查看记录表 (advice_views)

记录用户查看建议的行为

```sql
CREATE TABLE advice_views (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  photo_id BIGINT NOT NULL COMMENT '照片记录ID',
  user_id VARCHAR(64) NOT NULL COMMENT '用户ID',
  advice_type VARCHAR(32) COMMENT '建议类型: composition/lighting/angle/postProcessing/props/tips',
  viewed TINYINT(1) DEFAULT 1 COMMENT '是否查看',
  view_duration INT COMMENT '查看时长(秒)',
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_photo_id (photo_id),
  INDEX idx_advice_type (advice_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='建议查看记录';
```

### 5. 页面访问记录表 (page_views)

记录用户的页面访问路径

```sql
CREATE TABLE page_views (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(64) COMMENT '用户ID',
  session_id VARCHAR(64) COMMENT '会话ID',
  page_name VARCHAR(32) NOT NULL COMMENT '页面名称: index/upload/style-select/result',
  previous_page VARCHAR(32) COMMENT '上一页面',
  duration INT COMMENT '停留时长(秒)',
  device_type VARCHAR(32) COMMENT '设备类型: mobile/tablet/desktop',
  browser VARCHAR(64) COMMENT '浏览器',
  os VARCHAR(64) COMMENT '操作系统',
  screen_resolution VARCHAR(32) COMMENT '屏幕分辨率',
  referrer VARCHAR(512) COMMENT '来源页面',
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_session_id (session_id),
  INDEX idx_page_name (page_name),
  INDEX idx_created_time (created_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='页面访问记录';
```

### 6. 用户行为事件表 (user_events)

记录用户的详细操作事件

```sql
CREATE TABLE user_events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(64) COMMENT '用户ID',
  session_id VARCHAR(64) COMMENT '会话ID',
  event_type VARCHAR(64) NOT NULL COMMENT '事件类型: click/scroll/download/share等',
  event_target VARCHAR(128) COMMENT '事件目标: 按钮ID、元素类名等',
  event_data JSON COMMENT '事件详细数据',
  page_name VARCHAR(32) COMMENT '所在页面',
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_event_type (event_type),
  INDEX idx_created_time (created_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户行为事件表';
```

### 7. 反馈表 (feedback)

收集用户反馈

```sql
CREATE TABLE feedback (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(64) COMMENT '用户ID',
  photo_id BIGINT COMMENT '关联照片ID',
  feedback_type VARCHAR(32) COMMENT '反馈类型: bug/suggestion/other',
  rating INT COMMENT '评分 1-5',
  content TEXT COMMENT '反馈内容',
  contact VARCHAR(128) COMMENT '联系方式',
  status VARCHAR(32) DEFAULT 'pending' COMMENT '状态: pending/processing/resolved',
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_feedback_type (feedback_type),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户反馈表';
```

## 核心分析SQL示例

### 1. 用户活跃度分析

```sql
-- 日活跃用户数
SELECT 
  DATE(created_time) as date,
  COUNT(DISTINCT user_id) as dau
FROM page_views
WHERE created_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_time)
ORDER BY date DESC;

-- 用户留存率
SELECT 
  DATE(register_time) as cohort_date,
  COUNT(*) as new_users,
  SUM(CASE WHEN last_login_time >= DATE_ADD(register_time, INTERVAL 1 DAY) THEN 1 ELSE 0 END) as day1_retained,
  SUM(CASE WHEN last_login_time >= DATE_ADD(register_time, INTERVAL 7 DAY) THEN 1 ELSE 0 END) as day7_retained
FROM users
WHERE register_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(register_time);
```

### 2. 功能使用分析

```sql
-- 最受欢迎的题材和风格组合
SELECT 
  category,
  style,
  COUNT(*) as usage_count,
  COUNT(DISTINCT user_id) as user_count
FROM photo_records
WHERE created_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY category, style
ORDER BY usage_count DESC
LIMIT 20;

-- 辅助线使用率
SELECT 
  SUM(grid_enabled) as grid_count,
  SUM(golden_enabled) as golden_count,
  SUM(diagonal_enabled) as diagonal_count,
  SUM(center_enabled) as center_count,
  COUNT(*) as total_count
FROM guide_usage
WHERE created_time >= DATE_SUB(NOW(), INTERVAL 30 DAY);

-- 下载转化率
SELECT 
  COUNT(*) as total_views,
  SUM(downloaded) as total_downloads,
  ROUND(SUM(downloaded) * 100.0 / COUNT(*), 2) as download_rate
FROM guide_usage
WHERE created_time >= DATE_SUB(NOW(), INTERVAL 30 DAY);
```

### 3. 用户行为漏斗分析

```sql
-- 转化漏斗
SELECT 
  'index' as step,
  COUNT(DISTINCT user_id) as users
FROM page_views
WHERE page_name = 'index' AND created_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
UNION ALL
SELECT 
  'upload' as step,
  COUNT(DISTINCT user_id) as users
FROM page_views
WHERE page_name = 'upload' AND created_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
UNION ALL
SELECT 
  'style-select' as step,
  COUNT(DISTINCT user_id) as users
FROM page_views
WHERE page_name = 'style-select' AND created_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
UNION ALL
SELECT 
  'result' as step,
  COUNT(DISTINCT user_id) as users
FROM page_views
WHERE page_name = 'result' AND created_time >= DATE_SUB(NOW(), INTERVAL 7 DAY);
```

### 4. 用户画像分析

```sql
-- 用户使用频率分布
SELECT 
  CASE 
    WHEN used_quota = 0 THEN '未使用'
    WHEN used_quota BETWEEN 1 AND 5 THEN '轻度用户'
    WHEN used_quota BETWEEN 6 AND 20 THEN '中度用户'
    WHEN used_quota > 20 THEN '重度用户'
  END as user_type,
  COUNT(*) as user_count,
  AVG(used_quota) as avg_usage
FROM users
GROUP BY user_type;

-- 用户来源分析
SELECT 
  source,
  COUNT(*) as user_count,
  AVG(used_quota) as avg_usage,
  SUM(used_quota) as total_usage
FROM users
GROUP BY source;
```

### 5. 时间维度分析

```sql
-- 每小时使用量分布
SELECT 
  HOUR(created_time) as hour,
  COUNT(*) as photo_count
FROM photo_records
WHERE created_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY HOUR(created_time)
ORDER BY hour;

-- 周使用模式
SELECT 
  DAYOFWEEK(created_time) as day_of_week,
  COUNT(*) as photo_count
FROM photo_records
WHERE created_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DAYOFWEEK(created_time)
ORDER BY day_of_week;
```

## BI工具集成建议

### 推荐工具

1. **Metabase** - 开源免费，易于使用
2. **Superset** - Apache开源，功能强大
3. **Grafana** - 实时监控和分析
4. **DataGrip / DBeaver** - 数据查询工具

### 关键指标看板

**核心指标**
- DAU (日活跃用户数)
- MAU (月活跃用户数)
- 新增用户数
- 用户留存率 (Day1, Day7, Day30)

**使用指标**
- 照片分析次数
- 平均每用户使用次数
- 辅助线使用率
- 下载转化率

**转化指标**
- 各页面转化率
- 功能使用率
- 分享率
- 反馈提交率

## 数据埋点实现

### 前端埋点代码示例

```javascript
// 在 utils.js 中添加
const Analytics = {
  // 发送事件
  track(eventType, eventData) {
    const data = {
      user_id: App.globalData.userId || Utils.storage.get('userId'),
      session_id: this.getSessionId(),
      event_type: eventType,
      event_data: eventData,
      page_name: Router.currentPage,
      timestamp: new Date().toISOString()
    };
    
    // 发送到后端API
    this.send('/api/analytics/event', data);
  },
  
  // 页面浏览
  pageView(pageName, previousPage) {
    this.track('page_view', {
      page_name: pageName,
      previous_page: previousPage,
      device_type: this.getDeviceType(),
      browser: navigator.userAgent
    });
  },
  
  // 照片上传
  photoUpload(photoData) {
    this.track('photo_upload', {
      category: photoData.category,
      style: photoData.style,
      photo_size: photoData.size
    });
  },
  
  // 辅助线使用
  guideUsage(guides) {
    this.track('guide_usage', {
      grid: guides.grid,
      golden: guides.golden,
      diagonal: guides.diagonal,
      center: guides.center
    });
  },
  
  // 下载
  download() {
    this.track('download', {
      download_time: new Date().toISOString()
    });
  },
  
  getSessionId() {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  },
  
  getDeviceType() {
    const ua = navigator.userAgent;
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    if (/Tablet|iPad/.test(ua)) {
      return 'tablet';
    }
    return 'desktop';
  },
  
  send(url, data) {
    // 使用 sendBeacon 确保数据发送
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, JSON.stringify(data));
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(err => console.error('Analytics error:', err));
    }
  }
};
```

## 后端API设计

### 接口列表

```
POST /api/analytics/event        - 记录事件
POST /api/analytics/page_view    - 记录页面浏览
POST /api/analytics/photo_record - 记录照片分析
POST /api/analytics/guide_usage  - 记录辅助线使用
POST /api/analytics/feedback     - 提交反馈

GET  /api/analytics/dashboard    - 获取仪表板数据
GET  /api/analytics/users        - 获取用户数据
GET  /api/analytics/photos       - 获取照片数据
```

## 隐私和合规

- **数据脱敏**：敏感信息加密存储
- **用户同意**：首次使用时征得用户同意
- **数据删除**：提供数据删除功能
- **GDPR合规**：支持数据导出和删除请求

## 下一步实施计划

1. **Phase 1**：创建数据库表结构
2. **Phase 2**：实现前端埋点
3. **Phase 3**：开发后端API
4. **Phase 4**：集成BI工具
5. **Phase 5**：建立监控和告警

---

**文档版本**: 1.0
**更新日期**: 2025-10-27
**维护者**: Project Team
