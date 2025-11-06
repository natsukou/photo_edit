#!/bin/bash
# AI代理接口手动部署指南
# 请复制以下命令到ECS服务器执行

cat << 'INSTRUCTIONS'

========================================
🚀 AI代理接口部署指南
========================================

请SSH登录到ECS服务器，然后执行以下命令：

ssh root@139.224.199.2

登录后执行：

cd /root/photo_advice2
git pull origin master
cd server
npm install

# 配置API Key（如果.env文件中没有）
echo "" >> .env
echo "# 阿里云百炼API配置" >> .env
echo "DASHSCOPE_API_KEY=sk-8bb7317eaf36424580fbfbe2ae3ff037" >> .env

# 重启服务
pm2 restart photo-advice-server

# 检查状态
pm2 status
pm2 logs photo-advice-server --lines 30

# 测试AI接口
curl -X GET http://localhost:3000/api/ai/status

========================================
✅ 部署完成后测试
========================================

1. 测试AI服务状态：
   curl http://139.224.199.2:3000/api/ai/status

2. 打开测试页面：
   http://139.224.199.2:3000/test-ali-api.html

3. 上传图片测试AI识别

========================================

INSTRUCTIONS
