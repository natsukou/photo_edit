# 阿里云APP认证配置指南

## 🔐 如何启用阿里云APP认证

### 步骤1：在API网关创建APP

1. 登录[阿里云API网关控制台](https://apigateway.console.aliyun.com/)
2. 点击左侧菜单 **"调用API"** → **"APP管理"**
3. 点击 **"创建APP"**
4. 填写：
   - **APP名称**：`photo-advice-app`
   - **描述**：AI拍照辅助应用
5. 创建成功后，记录：
   - **AppKey**：例如 `203976635`
   - **AppSecret**：例如 `KMzLxUJvyqgsKxPU...`（保密！）

---

### 步骤2：授权APP访问API

1. 在 **"分组管理"** 中，进入 `photo-advice-api` 分组
2. 点击 **"授权信息"** 标签
3. 点击 **"授权"** 按钮
4. 选择 `photo-advice-app`
5. 勾选 `ai-recognize` 和 `ai-advice` 两个API
6. 点击确定

---

### 步骤3：修改API认证方式

1. 在API列表中，编辑 `ai-recognize` 和 `ai-advice`
2. 将 **"安全认证"** 改为 **"阿里云APP"**
3. 保存并重新发布到线上环境

---

### 步骤4：配置前端

在 `js/api.js` 文件中，修改配置：

```javascript
aliyunApp: {
  enabled: true,  // 启用签名
  appKey: '203976635',  // 替换为您的AppKey
  appSecret: 'KMzLxUJvyqgsKxPU...'  // 替换为您的AppSecret
}
```

⚠️ **安全警告**：
- 不要在生产环境的前端代码中暴露 `AppSecret`
- 建议由后端API代理签名，前端只调用后端接口
- 或使用临时凭证（STS Token）

---

## 🔄 更安全的方案：后端代理签名

### 方案1：后端签名代理（推荐）

在ECS后端添加签名服务：

```javascript
// server/routes/signature.js
router.post('/sign-request', (req, res) => {
  const { method, path, headers, queryParams, body } = req.body;
  
  const signer = new APISignature(
    process.env.ALIYUN_APP_KEY,
    process.env.ALIYUN_APP_SECRET
  );
  
  const signedHeaders = signer.sign(method, path, headers, queryParams, body);
  res.json({ code: 0, data: signedHeaders });
});
```

前端调用：

```javascript
// 获取签名后的请求头
const signResult = await fetch('http://your-backend/api/sign-request', {
  method: 'POST',
  body: JSON.stringify({ method, path, headers, queryParams, body })
});
const signedHeaders = await signResult.json();

// 使用签名后的请求头调用API网关
fetch(apiGatewayUrl, { headers: signedHeaders.data });
```

---

### 方案2：使用STS临时凭证

通过后端颁发临时访问令牌，前端使用临时凭证签名。

---

## 🔍 签名验证

测试签名是否正确：

```bash
curl -X POST \
  https://b6cb40828efb4332baaef3da54b96514-cn-shanghai.alicloudapi.com/api/ai/recognize \
  -H "X-Ca-Key: YOUR_APP_KEY" \
  -H "X-Ca-Signature: CALCULATED_SIGNATURE" \
  -H "X-Ca-Timestamp: CURRENT_TIMESTAMP" \
  -H "X-Ca-Nonce: RANDOM_NONCE" \
  -H "X-Ca-Signature-Method: HmacSHA256" \
  -H "Content-Type: application/json" \
  -d '{"image":"base64..."}'
```

---

## 📚 参考文档

- [阿里云API网关签名机制](https://help.aliyun.com/document_detail/29475.html)
- [APP认证配置](https://help.aliyun.com/document_detail/29487.html)
