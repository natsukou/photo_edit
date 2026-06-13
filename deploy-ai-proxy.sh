#!/bin/bash

# AI代理接口部署脚本
# 用途：将AI图片识别后端代理部署到ECS

echo "========================================="
echo "🚀 AI代理接口部署脚本"
echo "========================================="
echo ""

# 服务器信息
SERVER_HOST="${SERVER_HOST:-your-server.example.com}"
SERVER_USER="${SERVER_USER:-deploy}"
PROJECT_PATH="${PROJECT_PATH:-/srv/photo-edit}"
API_KEY="${DASHSCOPE_API_KEY:-your-dashscope-api-key}"

echo "📋 部署配置："
echo "  服务器: ${SERVER_USER}@${SERVER_HOST}"
echo "  项目路径: ${PROJECT_PATH}"
echo "  API Key 已配置: $([ "${API_KEY}" != "your-dashscope-api-key" ] && echo "yes" || echo "no")"
echo ""

# SSH连接并执行部署
ssh ${SERVER_USER}@${SERVER_HOST} bash << ENDSSH

set -e  # 遇到错误立即退出

cd ${PROJECT_PATH}

echo "=== 1. 拉取最新代码 ==="
git pull origin master

echo ""
echo "=== 2. 安装依赖 ==="
cd server
npm install

echo ""
echo "=== 3. 配置阿里云API Key ==="
if [ "${API_KEY}" = "your-dashscope-api-key" ]; then
  echo "❌ 请先在本机导出 DASHSCOPE_API_KEY 后再运行脚本"
  exit 1
fi

# 备份现有.env
if [ -f .env ]; then
  cp .env .env.backup.\$(date +%Y%m%d_%H%M%S)
  echo "✅ 已备份 .env 文件"
fi

# 添加或更新DASHSCOPE_API_KEY
if grep -q "^DASHSCOPE_API_KEY=" .env 2>/dev/null; then
  # 更新现有配置
  sed -i "s/^DASHSCOPE_API_KEY=.*/DASHSCOPE_API_KEY=${API_KEY}/" .env
  echo "✅ 已更新 DASHSCOPE_API_KEY"
else
  # 添加新配置
  echo "" >> .env
  echo "# 阿里云百炼API配置" >> .env
  echo "DASHSCOPE_API_KEY=${API_KEY}" >> .env
  echo "✅ 已添加 DASHSCOPE_API_KEY 到 .env"
fi

echo ""
echo "=== 4. 重启服务 ==="
pm2 restart photo-advice-server 2>/dev/null || pm2 start server.js --name photo-advice-server

echo ""
echo "=== 5. 检查服务状态 ==="
pm2 status

echo ""
echo "=== 6. 查看最新日志 ==="
pm2 logs photo-advice-server --lines 20 --nostream

echo ""
echo "=== 7. 测试AI接口 ==="
sleep 2
curl -X GET http://localhost:3000/api/ai/status -H "Content-Type: application/json"

echo ""
echo ""
echo "✅ 部署完成！"

ENDSSH

echo ""
echo "========================================="
echo "✅ 部署脚本执行完成"
echo "========================================="
echo ""
echo "📝 接下来的步骤："
echo "  1. 打开你的测试页面或本地页面"
echo "  2. 上传一张图片测试AI识别"
echo "  3. 检查后端代理是否正常工作"
echo ""
