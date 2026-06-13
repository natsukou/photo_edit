#!/bin/bash

set -euo pipefail

# 上传本地 .env 到远程服务器并重启服务

ECS_IP="${ECS_IP:-your-server.example.com}"
ECS_USER="${ECS_USER:-deploy}"
REMOTE_ENV_PATH="${REMOTE_ENV_PATH:-/srv/photo-edit/server/.env}"
LOCAL_ENV_FILE="${LOCAL_ENV_FILE:-$(cd "$(dirname "$0")" && pwd)/.env}"

if [ ! -f "${LOCAL_ENV_FILE}" ]; then
    echo "❌ 未找到本地环境文件: ${LOCAL_ENV_FILE}"
    exit 1
fi

echo "正在上传本地 .env 到远程服务器..."
echo ""

echo "步骤1: 上传新的 .env 配置..."
scp "${LOCAL_ENV_FILE}" ${ECS_USER}@${ECS_IP}:${REMOTE_ENV_PATH}

echo "✅ .env 文件上传成功"

echo ""
echo "步骤2: 重启后端服务..."
ssh ${ECS_USER}@${ECS_IP} "cd \$(dirname ${REMOTE_ENV_PATH}) && pm2 restart photo-api && pm2 logs photo-api --lines 20 --nostream"

echo ""
echo "步骤3: 验证服务状态..."
ssh ${ECS_USER}@${ECS_IP} "pm2 status"

echo ""
echo "========================================="
echo "✅ 配置修复完成！"
echo "========================================="
echo ""
echo "现在请在远程主机或经过网关的正式域名上自行验证接口。"
