# 使用官方 Nginx 作为基础镜像
FROM nginx:alpine

# 设置工作目录
WORKDIR /usr/share/nginx/html

# 删除默认的 nginx 静态文件
RUN rm -rf /usr/share/nginx/html/*

# 复制项目文件到容器
COPY index.html /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
COPY images/ /usr/share/nginx/html/images/
COPY package.json /usr/share/nginx/html/
COPY README.md /usr/share/nginx/html/

# 创建自定义 nginx 配置
RUN echo 'server { \
    listen 7860; \
    listen [::]:7860; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    # 禁用缓存，方便开发 \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ { \
        expires -1; \
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"; \
    } \
    # 启用 gzip 压缩 \
    gzip on; \
    gzip_vary on; \
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json; \
}' > /etc/nginx/conf.d/default.conf

# 暴露端口 7860
EXPOSE 7860

# 启动 nginx
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
