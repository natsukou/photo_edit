#!/bin/bash

# ECS服务器部署脚本

echo "======================================"
echo "AI拍照辅助 - ECS服务器部署"
echo "======================================"
echo ""

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
   echo "请使用root用户或sudo运行此脚本"
   exit 1
fi

# 1. 安装Node.js
echo "1. 安装Node.js..."
curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
apt-get install -y nodejs

# 2. 安装PM2
echo "2. 安装PM2进程管理器..."
npm install -g pm2

# 3. 安装依赖
echo "3. 安装项目依赖..."
npm install

# 4. 配置环境变量
if [ ! -f .env ]; then
    echo "4. 配置环境变量..."
    cat > .env << EOF
PORT=3000
NODE_ENV=production

# RDS MySQL配置（修改为你的RDS信息）
DB_HOST=rm-xxxxx.mysql.rds.aliyuncs.com
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_rds_password
DB_NAME=photo_assistant

# CORS配置（允许ModelScope域名）
ALLOWED_ORIGINS=https://www.modelscope.cn,https://modelscope.cn

LOG_LEVEL=info
EOF
    echo "请编辑 .env 文件，填入正确的RDS配置"
    exit 1
fi

# 5. 初始化数据库
echo "5. 初始化数据库..."
npm run init-db

# 6. 启动服务
echo "6. 启动后端服务..."
pm2 start server.js --name photo-api
pm2 save
pm2 startup

echo ""
echo "======================================"
echo "部署完成！"
echo "======================================"
echo "服务状态: pm2 status"
echo "查看日志: pm2 logs photo-api"
echo "重启服务: pm2 restart photo-api"
echo ""
echo "后端API地址: http://your-ecs-ip:3000"
echo "健康检查: http://your-ecs-ip:3000/health"
echo ""
