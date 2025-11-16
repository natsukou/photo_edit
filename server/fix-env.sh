#!/bin/bash

# 修复ECS上的.env配置
# 使用方法: ./fix-env.sh

ECS_IP="139.224.199.2"
ECS_USER="root"

echo "正在连接到ECS并修复.env配置..."
echo "请在提示时输入ECS密码: Photo2025"
echo ""

# 创建临时的正确.env文件
cat > /tmp/photo_advice2.env << 'EOF'
# 服务器配置
PORT=3000
NODE_ENV=production

# MySQL数据库配置（RDS内网地址）
DB_HOST=rm-uf62s2huxvrsu78oc.mysql.rds.aliyuncs.com
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Photo2025
DB_NAME=photo_assistant

# CORS配置（允许ModelScope访问）
ALLOWED_ORIGINS=http://localhost:8080,https://modelscope.cn

# 日志级别
LOG_LEVEL=info
EOF

echo "步骤1: 上传新的.env配置到ECS..."
scp /tmp/photo_advice2.env ${ECS_USER}@${ECS_IP}:/root/photo_advice2/server/.env

if [ $? -eq 0 ]; then
    echo "✅ .env文件上传成功"
    
    echo ""
    echo "步骤2: 重启后端服务..."
    ssh ${ECS_USER}@${ECS_IP} "cd /root/photo_advice2/server && pm2 restart photo-api && pm2 logs photo-api --lines 20 --nostream"
    
    echo ""
    echo "步骤3: 验证服务状态..."
    ssh ${ECS_USER}@${ECS_IP} "pm2 status"
    
    echo ""
    echo "========================================="
    echo "✅ 配置修复完成！"
    echo "========================================="
    echo ""
    echo "现在测试API连接："
    sleep 2
    curl -X POST http://139.224.199.2:3000/api/users/login \
         -H "Content-Type: application/json" \
         -d '{"nickname":"测试用户"}' \
         2>/dev/null | python3 -m json.tool
    
    echo ""
    echo "如果看到user_id返回，说明数据库连接成功！"
else
    echo "❌ .env文件上传失败，请检查网络连接"
    exit 1
fi

# 清理临时文件
rm /tmp/photo_advice2.env
