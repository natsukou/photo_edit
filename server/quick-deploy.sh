#!/bin/bash

set -euo pipefail

# 快速部署脚本模板
# 使用前请先通过环境变量传入真实主机、目录和配置文件位置

REMOTE_HOST="${REMOTE_HOST:-your-server.example.com}"
REMOTE_USER="${REMOTE_USER:-deploy}"
REMOTE_PROJECT_DIR="${REMOTE_PROJECT_DIR:-/srv/photo-edit}"
LOCAL_PROJECT_DIR="${LOCAL_PROJECT_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
LOCAL_ENV_FILE="${LOCAL_ENV_FILE:-${LOCAL_PROJECT_DIR}/server/.env}"
ARCHIVE_PATH="/tmp/photo_edit_server.tar.gz"

if [ ! -f "${LOCAL_ENV_FILE}" ]; then
  echo "缺少本地环境文件: ${LOCAL_ENV_FILE}"
  echo "请先基于 server/.env.example 创建 .env，并仅在本地保存真实密钥。"
  exit 1
fi

echo "======================================"
echo "部署后端到远程主机"
echo "======================================"
echo "目标: ${REMOTE_USER}@${REMOTE_HOST}"
echo "目录: ${REMOTE_PROJECT_DIR}"

tar -czf "${ARCHIVE_PATH}" \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='*.log' \
  -C "${LOCAL_PROJECT_DIR}" server

scp "${ARCHIVE_PATH}" "${LOCAL_ENV_FILE}" "${REMOTE_USER}@${REMOTE_HOST}:/tmp/"

ssh "${REMOTE_USER}@${REMOTE_HOST}" "REMOTE_PROJECT_DIR='${REMOTE_PROJECT_DIR}' bash -s" <<'ENDSSH'
set -euo pipefail

mkdir -p "${REMOTE_PROJECT_DIR}"
cd "${REMOTE_PROJECT_DIR}"

tar -xzf /tmp/photo_edit_server.tar.gz
cp /tmp/.env server/.env
cd server

npm install --production
pm2 restart photo-advice-server 2>/dev/null || pm2 start server.js --name photo-advice-server
pm2 save || true

echo "部署完成，可执行以下命令检查服务："
echo "  curl http://localhost:3000/health"
echo "  curl http://localhost:3000/api/ai/status"
ENDSSH

rm -f "${ARCHIVE_PATH}"
echo "部署脚本执行完成。"
