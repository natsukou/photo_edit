#!/bin/bash

set -euo pipefail

# 通用部署脚本模板

ECS_IP="${ECS_IP:-your-server.example.com}"
ECS_USER="${ECS_USER:-deploy}"
PROJECT_DIR="${PROJECT_DIR:-/srv/photo-edit}"
LOCAL_PROJECT_DIR="${LOCAL_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
LOCAL_ENV_FILE="${LOCAL_ENV_FILE:-${LOCAL_PROJECT_DIR}/server/.env}"

echo "======================================"
echo "🚀 开始部署到远程主机..."
echo "======================================"

if [ ! -f "${LOCAL_ENV_FILE}" ]; then
    echo "❌ 未找到本地环境文件: ${LOCAL_ENV_FILE}"
    echo "请先基于 server/.env.example 创建 .env，并仅在本地保管真实配置。"
    exit 1
fi

echo ""
echo "步骤1: 打包本地项目..."
cd "${LOCAL_PROJECT_DIR}"
tar -czf /tmp/photo_edit_server.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='*.log' \
    server/

echo "✅ 打包完成: /tmp/photo_edit_server.tar.gz"

echo ""
echo "步骤2: 上传到远程主机..."
scp /tmp/photo_edit_server.tar.gz "${LOCAL_ENV_FILE}" ${ECS_USER}@${ECS_IP}:/tmp/

echo ""
echo "步骤3: 在远程主机上部署..."
ssh ${ECS_USER}@${ECS_IP} "PROJECT_DIR='${PROJECT_DIR}' bash -s" <<'ENDSSH'
set -euo pipefail

echo "创建项目目录..."
mkdir -p "${PROJECT_DIR}"
cd "${PROJECT_DIR}"

echo "解压项目文件..."
tar -xzf /tmp/photo_edit_server.tar.gz
cd server

echo "安装项目依赖..."
npm install --production

echo "复制环境配置..."
cp /tmp/.env .env

echo "停止旧服务（如果存在）..."
pm2 delete photo-api 2>/dev/null || true

echo "启动新服务..."
pm2 start server.js --name photo-api
pm2 save || true

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
curl -s http://${ECS_IP}:3000/health | python3 -m json.tool || true
echo ""
echo "部署完成。请根据你的域名或网关地址自行做端到端验证。"
