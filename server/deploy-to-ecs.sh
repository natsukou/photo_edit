#!/bin/bash

# 完整部署脚本 - 从本地上传到ECS并部署

ECS_IP="139.224.199.2"
ECS_USER="root"
PROJECT_DIR="/root/photo_advice2"

echo "======================================"
echo "🚀 开始部署到ECS..."
echo "======================================"

# 1. 打包本地server目录
echo ""
echo "步骤1: 打包本地项目..."
cd /Users/nakia/Downloads/photo_advice2
tar -czf /tmp/photo_advice2_server.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='*.log' \
    server/

echo "✅ 打包完成: /tmp/photo_advice2_server.tar.gz"

# 2. 上传到ECS
echo ""
echo "步骤2: 上传到ECS (密码: Photo2025)..."
scp /tmp/photo_advice2_server.tar.gz ${ECS_USER}@${ECS_IP}:/tmp/

if [ $? -ne 0 ]; then
    echo "❌ 上传失败，请检查网络连接和密码"
    exit 1
fi

echo "✅ 上传成功"

# 3. 在ECS上解压并部署
echo ""
echo "步骤3: 在ECS上部署..."
ssh ${ECS_USER}@${ECS_IP} << 'ENDSSH'
set -e

echo "创建项目目录..."
mkdir -p /root/photo_advice2
cd /root/photo_advice2

echo "解压项目文件..."
tar -xzf /tmp/photo_advice2_server.tar.gz
cd server

echo "安装Node.js (如果未安装)..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

echo "安装PM2 (如果未安装)..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

echo "安装项目依赖..."
npm install

echo "创建.env配置文件..."
cat > .env << 'EOF'
# 服务器配置
PORT=3000
NODE_ENV=production

# MySQL数据库配置（RDS内网地址）
DB_HOST=rm-uf62s2huxvrsu78oc.mysql.rds.aliyuncs.com
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Photo2025!@#
DB_NAME=photo_assistant

# CORS配置（允许ModelScope访问）
ALLOWED_ORIGINS=http://localhost:8080,https://modelscope.cn

# 日志级别
LOG_LEVEL=info
EOF

echo "初始化数据库表结构..."
node scripts/init-database.js || echo "数据库初始化失败，可能表已存在"

echo "停止旧服务（如果存在）..."
pm2 delete photo-api 2>/dev/null || true

echo "启动新服务..."
pm2 start server.js --name photo-api
pm2 save
pm2 startup | tail -1 | bash

echo ""
echo "======================================"
echo "✅ 部署完成！"
echo "======================================"
pm2 status
echo ""
echo "查看日志: pm2 logs photo-api --lines 30"

ENDSSH

echo ""
echo "======================================"
echo "🎉 部署成功！"
echo "======================================"
echo ""
echo "测试API连接:"
sleep 3
curl -s http://139.224.199.2:3000/health | python3 -m json.tool

echo ""
echo "测试用户登录API:"
curl -s -X POST http://139.224.199.2:3000/api/users/login \
     -H "Content-Type: application/json" \
     -d '{"nickname":"测试用户"}' | python3 -m json.tool

# 清理临时文件
rm /tmp/photo_advice2_server.tar.gz

echo ""
echo "======================================"
echo "部署完成！现在可以使用H5应用了"
echo "======================================"
