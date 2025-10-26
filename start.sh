#!/bin/bash

# AI拍照辅助 H5版本 - 启动脚本

echo "======================================"
echo "  AI拍照辅助 H5版本"
echo "======================================"
echo ""

# 检查Python
if command -v python3 &> /dev/null; then
    echo "✓ 找到 Python3"
    echo ""
    echo "启动本地服务器..."
    echo "访问地址: http://localhost:8080"
    echo ""
    echo "按 Ctrl+C 停止服务器"
    echo "--------------------------------------"
    python3 -m http.server 8080
else
    echo "✗ 未找到 Python3"
    echo ""
    echo "请安装 Python3 或使用其他方式启动："
    echo "1. 直接用浏览器打开 index.html"
    echo "2. 使用 Node.js: npx http-server -p 8080"
    echo ""
fi
