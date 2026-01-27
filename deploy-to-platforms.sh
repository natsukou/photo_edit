#!/bin/bash

# 红色丝绒·摄影助手 - 多平台部署脚本
# 用于同时推送到 GitHub 和 ModelScope

set -e

echo "======================================"
echo "  红色丝绒·摄影助手 - 多平台部署"
echo "======================================"
echo ""

# 检查是否在git仓库中
if [ ! -d ".git" ]; then
    echo "❌ 错误：当前目录不是git仓库"
    echo "请先运行: git init"
    exit 1
fi

# 获取提交信息
read -p "请输入提交信息 (默认: update): " COMMIT_MSG
COMMIT_MSG=${COMMIT_MSG:-"update"}

echo ""
echo "📝 准备提交改动..."
echo ""

# 添加所有改动
git add .

# 显示将要提交的文件
echo "将要提交的文件："
git status --short

echo ""
read -p "是否继续提交？(y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "❌ 已取消"
    exit 0
fi

# 提交改动
git commit -m "$COMMIT_MSG" || echo "⚠️ 没有新的改动需要提交"

echo ""
echo "======================================"
echo "  选择推送目标"
echo "======================================"
echo "1. 仅推送到 GitHub"
echo "2. 仅推送到 ModelScope"
echo "3. 同时推送到两个平台"
echo ""
read -p "请选择 (1-3): " CHOICE

case $CHOICE in
    1)
        echo ""
        echo "🚀 正在推送到 GitHub..."
        if git remote | grep -q "^origin$"; then
            git push origin main || git push origin master
            echo "✅ GitHub 推送成功！"
        else
            echo "❌ 错误：未找到 origin 远程仓库"
            echo "请先添加 GitHub 远程仓库："
            echo "  git remote add origin https://github.com/YOUR_USERNAME/red-velvet-photography-assistant.git"
        fi
        ;;
    2)
        echo ""
        echo "🚀 正在推送到 ModelScope..."
        if git remote | grep -q "^modelscope$"; then
            git push modelscope main || git push modelscope master
            echo "✅ ModelScope 推送成功！"
            echo "📍 访问您的项目："
            echo "   https://modelscope.cn/studios/nakia9/photo_advice2"
        else
            echo "❌ 错误：未找到 modelscope 远程仓库"
            echo "请先添加 ModelScope 远程仓库："
            echo "  git remote add modelscope https://www.modelscope.cn/studios/nakia9/photo_advice2.git"
        fi
        ;;
    3)
        echo ""
        echo "🚀 正在推送到 GitHub..."
        if git remote | grep -q "^origin$"; then
            git push origin main || git push origin master
            echo "✅ GitHub 推送成功！"
        else
            echo "⚠️ 跳过 GitHub：未找到 origin 远程仓库"
        fi
        
        echo ""
        echo "🚀 正在推送到 ModelScope..."
        if git remote | grep -q "^modelscope$"; then
            git push modelscope main || git push modelscope master
            echo "✅ ModelScope 推送成功！"
            echo "📍 访问您的项目："
            echo "   https://modelscope.cn/studios/nakia9/photo_advice2"
        else
            echo "⚠️ 跳过 ModelScope：未找到 modelscope 远程仓库"
        fi
        ;;
    *)
        echo "❌ 无效的选择"
        exit 1
        ;;
esac

echo ""
echo "======================================"
echo "  部署完成！"
echo "======================================"
echo ""
echo "📚 有用的命令："
echo "  查看远程仓库: git remote -v"
echo "  添加 GitHub: git remote add origin YOUR_GITHUB_URL"
echo "  添加 ModelScope: git remote add modelscope YOUR_MODELSCOPE_URL"
echo ""
