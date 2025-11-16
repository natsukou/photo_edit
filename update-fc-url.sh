#!/bin/bash
# 更新前端配置中的函数计算URL

if [ -z "$1" ]; then
  echo "用法: bash update-fc-url.sh <函数计算URL>"
  echo ""
  echo "示例:"
  echo "  bash update-fc-url.sh https://xxxxx-xxxxx.cn-shanghai.fcapp.run"
  echo ""
  exit 1
fi

FC_URL="$1"

echo "🔧 更新前端配置..."
echo "函数计算URL: $FC_URL"

# 更新 js/api.js
sed -i.bak "s|https://REPLACE_WITH_YOUR_FC_URL|${FC_URL}|g" js/api.js

echo "✅ 配置已更新！"
echo ""
echo "📝 下一步："
echo "  1. 提交代码: git add js/api.js && git commit -m '更新函数计算URL'"
echo "  2. 推送到GitHub: git push github master"
echo "  3. 推送到ModelScope: git checkout modelscope-frontend-update && git cherry-pick HEAD~1 && git push origin modelscope-frontend-update:master"
echo ""
