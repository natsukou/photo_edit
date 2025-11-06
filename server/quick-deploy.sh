#!/bin/bash

# 快速部署脚本 - 直接在ECS上执行所有操作

echo "======================================"
echo "🚀 快速部署到ECS"
echo "======================================"

# 1. 打包并上传
echo ""
echo "步骤1: 打包项目..."
cd /Users/nakia/Downloads/photo_advice2
tar -czf /tmp/server.tar.gz --exclude='node_modules' --exclude='.git' server/
echo "✅ 打包完成"

echo ""
echo "步骤2: 上传到ECS..."
echo "请输入ECS密码: Photo2025"
scp /tmp/server.tar.gz root@139.224.199.2:/tmp/

if [ $? -ne 0 ]; then
    echo "❌ 上传失败"
    exit 1
fi

echo "✅ 上传成功"

# 2. 在ECS上部署
echo ""
echo "步骤3: 部署并启动服务..."
echo "请输入ECS密码: Photo2025"

ssh root@139.224.199.2 << 'ENDSSH'
#!/bin/bash
set -e

echo "======================================"
echo "在ECS上执行部署..."
echo "======================================"

# 解压
cd /root
rm -rf photo_advice2
mkdir -p photo_advice2
cd photo_advice2
tar -xzf /tmp/server.tar.gz
cd server

echo "✅ 项目解压完成"

# 安装依赖
echo ""
echo "安装Node.js和PM2..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

echo "Node.js版本: $(node -v)"
echo "npm版本: $(npm -v)"
echo "✅ 环境准备完成"

# 安装项目依赖
echo ""
echo "安装项目依赖..."
npm install --production

echo "✅ 依赖安装完成"

# 创建.env配置（尝试两个密码）
echo ""
echo "创建环境配置..."

# 首先尝试 Photo2025
cat > .env << 'EOF'
PORT=3000
NODE_ENV=production
DB_HOST=rm-uf62s2huxvrsu78oc.mysql.rds.aliyuncs.com
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Photo2025
DB_NAME=photo_assistant
ALLOWED_ORIGINS=http://localhost:8080,https://modelscope.cn
LOG_LEVEL=info
EOF

echo "测试数据库连接 (密码1: Photo2025)..."
if node -e "
const mysql = require('mysql2/promise');
(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'rm-uf62s2huxvrsu78oc.mysql.rds.aliyuncs.com',
      port: 3306,
      user: 'root',
      password: 'Photo2025',
      database: 'photo_assistant'
    });
    console.log('✅ 数据库连接成功 (Photo2025)');
    await conn.end();
    process.exit(0);
  } catch (err) {
    console.log('❌ 密码1失败，尝试密码2...');
    process.exit(1);
  }
})();
" 2>/dev/null; then
    echo "使用密码: Photo2025"
else
    # 尝试第二个密码
    cat > .env << 'EOF'
PORT=3000
NODE_ENV=production
DB_HOST=rm-uf62s2huxvrsu78oc.mysql.rds.aliyuncs.com
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Photo2025!@#
DB_NAME=photo_assistant
ALLOWED_ORIGINS=http://localhost:8080,https://modelscope.cn
LOG_LEVEL=info
EOF
    
    if node -e "
const mysql = require('mysql2/promise');
(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'rm-uf62s2huxvrsu78oc.mysql.rds.aliyuncs.com',
      port: 3306,
      user: 'root',
      password: 'Photo2025!@#',
      database: 'photo_assistant'
    });
    console.log('✅ 数据库连接成功 (Photo2025!@#)');
    await conn.end();
    process.exit(0);
  } catch (err) {
    console.log('❌ 两个密码都失败！');
    console.log('错误:', err.message);
    process.exit(1);
  }
})();
" 2>/dev/null; then
        echo "使用密码: Photo2025!@#"
    else
        echo "❌ 数据库连接失败，请检查密码！"
        exit 1
    fi
fi

# 初始化数据库表
echo ""
echo "初始化数据库表..."
node scripts/init-database.js || echo "⚠️  表可能已存在"

# 启动服务
echo ""
echo "启动服务..."
pm2 delete photo-api 2>/dev/null || true
pm2 start server.js --name photo-api
pm2 save
pm2 startup | tail -1 | bash || true

echo ""
echo "======================================"
echo "✅ 部署完成！"
echo "======================================"
pm2 status
echo ""
echo "查看实时日志:"
pm2 logs photo-api --lines 30 --nostream

ENDSSH

# 测试API
echo ""
echo "======================================"
echo "测试API连接..."
echo "======================================"
sleep 3

echo ""
echo "1. 健康检查:"
curl -s http://139.224.199.2:3000/health | python3 -m json.tool

echo ""
echo "2. 用户登录测试:"
curl -s -X POST http://139.224.199.2:3000/api/users/login \
     -H "Content-Type: application/json" \
     -d '{"nickname":"测试用户"}' | python3 -m json.tool

echo ""
echo "======================================"
echo "🎉 部署完成！"
echo "======================================"
echo ""
echo "前端应用: https://modelscope.cn/studios/nakia9/photo_advice2/summary"
echo "后端API: http://139.224.199.2:3000"
echo ""

# 清理
rm /tmp/server.tar.gz

