#!/bin/bash

# 更新ECS上的CORS配置
# 使用方法: bash update-ecs-cors.sh

ECS_HOST="139.224.199.2"
ECS_USER="root"
SERVER_DIR="/root/server"

echo "🚀 开始更新ECS服务器CORS配置..."
echo ""

# 使用SSH执行远程命令
ssh ${ECS_USER}@${ECS_HOST} << 'ENDSSH'

cd /root/server

echo "=== 1. 备份当前server.js ==="
cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S)
echo "✓ 备份完成"

echo ""
echo "=== 2. 更新CORS配置 ==="

# 创建新的CORS配置
cat > /tmp/cors_config.txt << 'EOF'
// CORS配置
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
}));
EOF

# 使用sed替换CORS配置（从"// CORS配置"到下一个空行）
sed -i '/^\/\/ CORS配置$/,/^app\.use(cors({$/,/^}));$/c\
// CORS配置\
const allowedOrigins = process.env.ALLOWED_ORIGINS \\\n\
  ? process.env.ALLOWED_ORIGINS.split(\x27,\x27) \\\n\
  : [\x27http://localhost:8080\x27, \x27http://127.0.0.1:8080\x27, \x27http://localhost:3000\x27, \x27http://127.0.0.1:3000\x27];\\\n\
\\\n\
app.use(cors({\\\n\
  origin: function (origin, callback) {\\\n\
    if (!origin) return callback(null, true);\\\n\
    if (allowedOrigins.indexOf(origin) !== -1) {\\\n\
      return callback(null, true);\\\n\
    }\\\n\
    if (process.env.NODE_ENV === \x27development\x27) {\\\n\
      return callback(null, true);\\\n\
    }\\\n\
    if (origin.includes(\x27modelscope.cn\x27) || origin.includes(\x27.ms.show\x27) || origin.includes(\x27dsw-\x27)) {\\\n\
      return callback(null, true);\\\n\
    }\\\n\
    callback(new Error(\x27Not allowed by CORS\x27));\\\n\
  },\\\n\
  credentials: true,\\\n\
  methods: [\x27GET\x27, \x27POST\x27, \x27PUT\x27, \x27DELETE\x27, \x27OPTIONS\x27],\\\n\
  allowedHeaders: [\x27Content-Type\x27, \x27Authorization\x27, \x27X-Ca-Key\x27, \x27X-Ca-Signature\x27, \x27X-Ca-Timestamp\x27, \x27X-Ca-Nonce\x27, \x27X-Ca-Signature-Method\x27]\\\n\
}));
' server.js

echo "✓ CORS配置已更新"

echo ""
echo "=== 3. 重启PM2服务 ==="
pm2 restart photo-advice-server
echo "✓ 服务已重启"

echo ""
echo "=== 4. 查看服务状态 ==="
pm2 list

echo ""
echo "=== 5. 查看最新日志（10行）==="
pm2 logs photo-advice-server --lines 10 --nostream

ENDSSH

echo ""
echo "✅ 更新完成！"
echo ""
echo "📝 下一步测试："
echo "1. 访问 ModelScope 应用"
echo "2. 打开浏览器控制台（F12）"
echo "3. 上传图片并点击分析"
echo "4. 查看控制台日志"
