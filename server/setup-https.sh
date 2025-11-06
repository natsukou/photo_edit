#!/bin/bash

# ECS HTTPS配置脚本
# 使用Nginx反向代理 + Let's Encrypt免费证书

echo "======================================"
echo "配置ECS HTTPS支持"
echo "======================================"

# 1. 安装Nginx和Certbot
echo "步骤1: 安装Nginx和Certbot..."
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

# 2. 配置Nginx反向代理
echo "步骤2: 配置Nginx..."
cat > /etc/nginx/sites-available/photo-api << 'EOF'
server {
    listen 80;
    server_name 139.224.199.2;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS配置
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/photo-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
nginx -t

# 重启Nginx
systemctl restart nginx
systemctl enable nginx

echo ""
echo "======================================"
echo "✅ HTTP配置完成！"
echo "======================================"
echo ""
echo "测试访问："
echo "  http://139.224.199.2/health"
echo ""
echo "注意：由于没有域名，暂时无法配置HTTPS证书"
echo "建议：购买域名后使用 certbot 配置免费证书"
echo ""
