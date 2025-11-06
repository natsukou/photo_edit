#!/bin/bash
# 部署到阿里云函数计算脚本

echo "========================================="
echo "🚀 部署到阿里云函数计算"
echo "========================================="
echo ""

# 检查是否安装了 Serverless Devs
if ! command -v s &> /dev/null; then
    echo "❌ 未安装 Serverless Devs CLI"
    echo ""
    echo "请先安装："
    echo "  npm install -g @serverless-devs/s"
    echo ""
    exit 1
fi

# 进入server目录
cd "$(dirname "$0")"

# 安装依赖
echo "📦 安装依赖..."
npm install

# 加载环境变量
if [ -f .env.fc ]; then
    export $(cat .env.fc | grep -v '^#' | xargs)
fi

# 部署到函数计算
echo ""
echo "🚀 部署到函数计算..."
s deploy -y

echo ""
echo "========================================="
echo "✅ 部署完成！"
echo "========================================="
echo ""
echo "接下来的步骤："
echo "  1. 复制函数计算的HTTPS URL"
echo "  2. 更新前端js/api.js中的baseURL"
echo "  3. 推送代码到GitHub和ModelScope"
echo ""
