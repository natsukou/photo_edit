// 在ECS上运行此脚本来更新CORS配置
// 用法: node update-cors.js

const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server.js');

console.log('📝 读取 server.js...');
let content = fs.readFileSync(serverFile, 'utf8');

console.log('🔧 更新 CORS 配置...');

// 定义新的CORS配置
const newCorsConfig = `// CORS配置
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // 允许没有origin的请求（如移动端、Postman等）
    if (!origin) return callback(null, true);
    
    // 检查是否在允许列表中
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // 允许开发环境
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // 允许ModelScope域名（*.modelscope.cn 和 *.ms.show）
    if (origin.includes('modelscope.cn') || origin.includes('.ms.show') || origin.includes('dsw-')) {
      return callback(null, true);
    }
    
    // 其他情况拒绝
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Ca-Key', 'X-Ca-Signature', 'X-Ca-Timestamp', 'X-Ca-Nonce', 'X-Ca-Signature-Method']
}));`;

// 替换旧的CORS配置
const oldPattern = /\/\/ CORS配置[\s\S]*?app\.use\(cors\({[\s\S]*?\}\)\);/;
content = content.replace(oldPattern, newCorsConfig);

// 备份原文件
const backupFile = `${serverFile}.backup.${Date.now()}`;
console.log(`💾 备份原文件到: ${backupFile}`);
fs.copyFileSync(serverFile, backupFile);

// 写入新内容
console.log('💾 写入更新后的配置...');
fs.writeFileSync(serverFile, content, 'utf8');

console.log('✅ CORS配置更新完成！');
console.log('');
console.log('📌 下一步: 重启PM2服务');
console.log('   pm2 restart photo-advice-server');
