#!/bin/bash

# AI拍照辅助 Docker 启动脚本

echo "======================================"
echo "  AI拍照辅助 Docker部署"
echo "======================================"
echo ""

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装！"
    echo ""
    echo "请先安装Docker Desktop:"
    echo "  macOS: https://www.docker.com/products/docker-desktop"
    echo "  或使用Homebrew: brew install --cask docker"
    echo ""
    exit 1
fi

# 检查Docker是否运行
if ! docker info &> /dev/null; then
    echo "❌ Docker未运行！"
    echo ""
    echo "请启动Docker Desktop后再试。"
    echo ""
    exit 1
fi

echo "✓ Docker环境检查通过"
echo ""

# 停止并删除旧容器
echo "正在停止旧容器..."
docker-compose down 2>/dev/null || true

# 构建镜像
echo ""
echo "正在构建Docker镜像..."
docker-compose build

# 启动容器
echo ""
echo "正在启动容器..."
docker-compose up -d

# 等待服务启动
echo ""
echo "等待服务启动..."
sleep 3

# 检查容器状态
if docker ps | grep -q ai-photo-guide-h5; then
    echo ""
    echo "======================================"
    echo "  ✅ 部署成功！"
    echo "======================================"
    echo ""
    echo "访问地址: http://localhost:7860"
    echo "容器名称: ai-photo-guide-h5"
    echo ""
    echo "常用命令:"
    echo "  查看日志: docker-compose logs -f"
    echo "  停止服务: docker-compose down"
    echo "  重启服务: docker-compose restart"
    echo ""
else
    echo ""
    echo "❌ 启动失败！请查看日志:"
    echo "  docker-compose logs"
    echo ""
    exit 1
fi
