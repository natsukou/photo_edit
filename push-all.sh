#!/bin/bash
# 自动推送到GitHub和ModelScope双仓库

echo "========================================="
echo "📤 推送到双远程仓库"
echo "========================================="
echo ""

# 获取commit信息
if [ -z "$1" ]; then
  echo "❌ 请提供commit信息"
  echo "用法: ./push-all.sh \"你的commit信息\""
  exit 1
fi

COMMIT_MSG="$1"

echo "1️⃣  添加文件到暂存区..."
git add -A

echo ""
echo "2️⃣  提交更改: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"

echo ""
echo "3️⃣  推送到 ModelScope..."
git push origin master

echo ""
echo "4️⃣  推送到 GitHub..."
git push github master

echo ""
echo "========================================="
echo "✅ 推送完成！"
echo "========================================="
echo ""
echo "📋 远程仓库状态："
echo "  ModelScope: http://www.modelscope.cn/studios/nakia9/photo_advice2"
echo "  GitHub: https://github.com/natsukou/photo_edit"
echo ""
