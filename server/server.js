const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection } = require('./config/database');

// 引入路由
const usersRouter = require('./routes/users');
const photosRouter = require('./routes/photos');
const analyticsRouter = require('./routes/analytics');
const feedbackRouter = require('./routes/feedback');
const aiRouter = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// 中间件配置
// ============================================

// 安全相关
app.use(helmet());

// CORS配置
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:8080', 'http://127.0.0.1:8080'];

app.use(cors({
  origin: function (origin, callback) {
    // 允许没有origin的请求（如移动端、Postman等）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// 请求体解析
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 日志
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 限制每个IP 1000次请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

// ============================================
// 路由注册
// ============================================

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API路由
app.use('/api/users', usersRouter);
app.use('/api/photos', photosRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/ai', aiRouter);

// 404处理
app.use((req, res) => {
  res.status(404).json({
    code: -1,
    message: '接口不存在',
    path: req.path
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(err.status || 500).json({
    code: -1,
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ============================================
// 启动服务器
// ============================================

async function startServer() {
  try {
    // 测试数据库连接
    console.log('正在连接数据库...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('⚠️  数据库连接失败，但服务器仍会启动');
      console.error('请检查 .env 配置文件中的数据库配置');
    }

    // 启动HTTP服务器
    app.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════════');
      console.log('🚀 AI拍照辅助后端服务启动成功！');
      console.log('═══════════════════════════════════════════════');
      console.log(`📍 服务地址: http://localhost:${PORT}`);
      console.log(`📊 健康检查: http://localhost:${PORT}/health`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📝 日志级别: ${process.env.LOG_LEVEL || 'info'}`);
      console.log('═══════════════════════════════════════════════');
      console.log('');
      console.log('API接口列表:');
      console.log('  用户管理:');
      console.log(`    POST   /api/users/login              - 用户登录/注册`);
      console.log(`    GET    /api/users/:user_id           - 获取用户信息`);
      console.log(`    POST   /api/users/:user_id/consume-quota - 消费配额`);
      console.log('');
      console.log('  照片管理:');
      console.log(`    POST   /api/photos                   - 创建照片记录`);
      console.log(`    GET    /api/photos/user/:user_id     - 获取用户照片`);
      console.log(`    GET    /api/photos/popular           - 获取热门题材`);
      console.log(`    POST   /api/photos/:photo_id/guide-usage - 记录辅助线使用`);
      console.log(`    POST   /api/photos/:photo_id/download - 更新下载状态`);
      console.log('');
      console.log('  数据分析:');
      console.log(`    POST   /api/analytics/page-view      - 记录页面访问`);
      console.log(`    POST   /api/analytics/page-views-batch - 批量记录页面访问`);
      console.log(`    POST   /api/analytics/event          - 记录用户事件`);
      console.log(`    POST   /api/analytics/events-batch   - 批量记录用户事件`);
      console.log(`    GET    /api/analytics/dau            - 获取今日DAU`);
      console.log('');
      console.log('  反馈管理:');
      console.log(`    POST   /api/feedback                 - 创建反馈`);
      console.log(`    GET    /api/feedback/pending         - 获取待处理反馈`);
      console.log(`    PUT    /api/feedback/:feedback_id    - 更新反馈状态`);
      console.log('');
      console.log('  AI识别服务:');
      console.log(`    POST   /api/ai/recognize             - 图片风格识别`);
      console.log(`    GET    /api/ai/status                - AI服务状态`);
      console.log('');
      console.log('═══════════════════════════════════════════════');
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});

// 启动
startServer();

module.exports = app;
