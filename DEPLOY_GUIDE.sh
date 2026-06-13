#!/bin/bash
# AI代理接口手动部署指南
# 请复制以下命令到ECS服务器执行

cat << 'INSTRUCTIONS'

========================================
🚀 AI代理接口部署指南
========================================

请SSH登录到ECS服务器，然后执行以下命令：

ssh deploy@your-server.example.com

登录后执行：

cd /srv/photo-edit
git pull origin master
cd server
npm install
cp .env.example .env

# 编辑 .env，填写真实配置
# DASHSCOPE_API_KEY=YOUR_DASHSCOPE_API_KEY
# DB_HOST=YOUR_DB_HOST
# DB_PASSWORD=YOUR_DB_PASSWORD

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
   curl http://localhost:3000/api/ai/status

2. 打开测试页面：
   http://localhost:3000/test-ali-api.html

3. 上传图片测试AI识别

========================================

INSTRUCTIONS
