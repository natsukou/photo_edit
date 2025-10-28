-- ============================================
-- AI拍照辅助 - 数据库初始化脚本
-- ============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS photo_assistant DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE photo_assistant;

-- ============================================
-- 1. 用户表
-- ============================================
DROP TABLE IF EXISTS users;
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_openid (openid),
  INDEX idx_register_time (register_time),
  INDEX idx_source (source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 2. 照片记录表
-- ============================================
DROP TABLE IF EXISTS photo_records;
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
  INDEX idx_style (style),
  INDEX idx_created_time (created_time),
  INDEX idx_category_style (category, style)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='照片记录表';

-- ============================================
-- 3. 辅助线使用记录表
-- ============================================
DROP TABLE IF EXISTS guide_usage;
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
  INDEX idx_user_id (user_id),
  INDEX idx_downloaded (downloaded),
  FOREIGN KEY (photo_id) REFERENCES photo_records(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='辅助线使用记录';

-- ============================================
-- 4. 建议查看记录表
-- ============================================
DROP TABLE IF EXISTS advice_views;
CREATE TABLE advice_views (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  photo_id BIGINT NOT NULL COMMENT '照片记录ID',
  user_id VARCHAR(64) NOT NULL COMMENT '用户ID',
  advice_type VARCHAR(32) COMMENT '建议类型: composition/lighting/angle/postProcessing/props/tips',
  viewed TINYINT(1) DEFAULT 1 COMMENT '是否查看',
  view_duration INT COMMENT '查看时长(秒)',
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_photo_id (photo_id),
  INDEX idx_user_id (user_id),
  INDEX idx_advice_type (advice_type),
  FOREIGN KEY (photo_id) REFERENCES photo_records(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='建议查看记录';

-- ============================================
-- 5. 页面访问记录表
-- ============================================
DROP TABLE IF EXISTS page_views;
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
  INDEX idx_created_time (created_time),
  INDEX idx_device_type (device_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='页面访问记录';

-- ============================================
-- 6. 用户行为事件表
-- ============================================
DROP TABLE IF EXISTS user_events;
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
  INDEX idx_session_id (session_id),
  INDEX idx_event_type (event_type),
  INDEX idx_created_time (created_time),
  INDEX idx_page_name (page_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户行为事件表';

-- ============================================
-- 7. 反馈表
-- ============================================
DROP TABLE IF EXISTS feedback;
CREATE TABLE feedback (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(64) COMMENT '用户ID',
  photo_id BIGINT COMMENT '关联照片ID',
  feedback_type VARCHAR(32) COMMENT '反馈类型: bug/suggestion/praise/other',
  rating INT COMMENT '评分 1-5',
  content TEXT COMMENT '反馈内容',
  contact VARCHAR(128) COMMENT '联系方式',
  status VARCHAR(32) DEFAULT 'pending' COMMENT '状态: pending/processing/resolved/closed',
  handler VARCHAR(64) COMMENT '处理人',
  handle_note TEXT COMMENT '处理备注',
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_user_id (user_id),
  INDEX idx_feedback_type (feedback_type),
  INDEX idx_status (status),
  INDEX idx_created_time (created_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户反馈表';

-- ============================================
-- 插入测试数据
-- ============================================

-- 测试用户
INSERT INTO users (user_id, nickname, source, total_quota, used_quota) VALUES
('user_001', '摄影小白', 'h5', 50, 15),
('user_002', '创作者Alice', 'miniprogram', 100, 45),
('user_003', '摄影爱好者', 'h5', 50, 8);

-- 测试照片记录
INSERT INTO photo_records (user_id, category, style, photo_size, photo_width, photo_height) VALUES
('user_001', '人像', '日系小清新', 2048, 1920, 1080),
('user_001', '人像', '复古港风', 1856, 1920, 1080),
('user_002', '风光摄影', '大气磅礴', 3200, 3840, 2160),
('user_002', '美食', '日系小清新', 1500, 1920, 1080),
('user_003', '建筑', '极简主义', 2500, 1920, 1080);

-- 测试辅助线使用
INSERT INTO guide_usage (photo_id, user_id, grid_enabled, golden_enabled, downloaded) VALUES
(1, 'user_001', 1, 0, 1),
(2, 'user_001', 1, 1, 0),
(3, 'user_002', 1, 1, 1),
(4, 'user_002', 1, 0, 1),
(5, 'user_003', 0, 1, 0);

-- 测试页面访问
INSERT INTO page_views (user_id, session_id, page_name, device_type) VALUES
('user_001', 'session_001', 'index', 'mobile'),
('user_001', 'session_001', 'upload', 'mobile'),
('user_001', 'session_001', 'style-select', 'mobile'),
('user_001', 'session_001', 'result', 'mobile'),
('user_002', 'session_002', 'index', 'mobile');

-- ============================================
-- 创建分析视图
-- ============================================

-- 用户概览视图
CREATE OR REPLACE VIEW v_user_overview AS
SELECT 
  u.user_id,
  u.nickname,
  u.source,
  u.total_quota,
  u.used_quota,
  u.register_time,
  COUNT(DISTINCT p.id) as photo_count,
  SUM(CASE WHEN g.downloaded = 1 THEN 1 ELSE 0 END) as download_count
FROM users u
LEFT JOIN photo_records p ON u.user_id = p.user_id
LEFT JOIN guide_usage g ON p.id = g.photo_id
GROUP BY u.user_id;

-- 题材风格热度视图
CREATE OR REPLACE VIEW v_category_style_popularity AS
SELECT 
  category,
  style,
  COUNT(*) as usage_count,
  COUNT(DISTINCT user_id) as user_count,
  AVG(photo_size) as avg_size
FROM photo_records
GROUP BY category, style
ORDER BY usage_count DESC;

-- 辅助线使用统计视图
CREATE OR REPLACE VIEW v_guide_stats AS
SELECT 
  SUM(grid_enabled) as grid_count,
  SUM(golden_enabled) as golden_count,
  SUM(diagonal_enabled) as diagonal_count,
  SUM(center_enabled) as center_count,
  SUM(downloaded) as download_count,
  COUNT(*) as total_usage,
  ROUND(SUM(downloaded) * 100.0 / COUNT(*), 2) as download_rate
FROM guide_usage;

-- ============================================
-- 完成提示
-- ============================================
SELECT '数据库初始化完成！' as status;
SELECT '表数量:', COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'photo_assistant';
