/**
 * 阿里云API网关签名工具
 * 用于生成阿里云APP认证所需的签名
 */

class APISignature {
  constructor(appKey, appSecret) {
    this.appKey = appKey;
    this.appSecret = appSecret;
  }

  /**
   * 生成签名
   * @param {string} method - HTTP方法（GET/POST等）
   * @param {string} path - 请求路径
   * @param {object} headers - 请求头
   * @param {object} queryParams - URL参数
   * @param {string} body - 请求体
   * @returns {object} - 包含签名的请求头
   */
  sign(method, path, headers = {}, queryParams = {}, body = '') {
    const timestamp = new Date().toUTCString();
    const nonce = this.generateNonce();

    // 构建签名字符串
    const signString = this.buildSignString(
      method,
      headers['Content-Type'] || 'application/json',
      headers['Accept'] || '*/*',
      timestamp,
      nonce,
      path,
      queryParams,
      body
    );

    // 使用HMAC-SHA256计算签名
    const signature = this.hmacSHA256(signString, this.appSecret);

    // 返回包含签名的请求头
    return {
      ...headers,
      'X-Ca-Key': this.appKey,
      'X-Ca-Signature': signature,
      'X-Ca-Timestamp': timestamp,
      'X-Ca-Nonce': nonce,
      'X-Ca-Signature-Method': 'HmacSHA256'
    };
  }

  /**
   * 构建待签名字符串
   */
  buildSignString(method, contentType, accept, timestamp, nonce, path, queryParams, body) {
    const lines = [];
    
    // HTTP Method
    lines.push(method.toUpperCase());
    
    // Accept
    lines.push(accept);
    
    // Content-MD5（可选，通常为空）
    lines.push('');
    
    // Content-Type
    lines.push(contentType);
    
    // Date（使用X-Ca-Timestamp代替）
    lines.push('');
    
    // Headers（X-Ca-开头的自定义头，按字典序排序）
    const caHeaders = [];
    caHeaders.push(`X-Ca-Nonce:${nonce}`);
    caHeaders.push(`X-Ca-Timestamp:${timestamp}`);
    lines.push(caHeaders.join('\n'));
    
    // URL Path + Query String
    const queryString = this.buildQueryString(queryParams);
    lines.push(queryString ? `${path}?${queryString}` : path);
    
    return lines.join('\n');
  }

  /**
   * 构建查询字符串（按字典序排序）
   */
  buildQueryString(params) {
    if (!params || Object.keys(params).length === 0) {
      return '';
    }
    
    const sorted = Object.keys(params).sort();
    const pairs = sorted.map(key => `${key}=${encodeURIComponent(params[key])}`);
    return pairs.join('&');
  }

  /**
   * HMAC-SHA256签名
   */
  hmacSHA256(message, secret) {
    // 浏览器环境使用Web Crypto API
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      return this.hmacSHA256Browser(message, secret);
    }
    
    // Node.js环境使用crypto模块
    if (typeof require !== 'undefined') {
      const crypto = require('crypto');
      return crypto
        .createHmac('sha256', secret)
        .update(message, 'utf8')
        .digest('base64');
    }
    
    throw new Error('不支持的环境：无法生成签名');
  }

  /**
   * 浏览器环境的HMAC-SHA256（异步）
   * 注意：这个方法返回Promise，需要改造调用方式
   */
  async hmacSHA256Browser(message, secret) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    return this.arrayBufferToBase64(signature);
  }

  /**
   * ArrayBuffer转Base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * 生成随机Nonce
   */
  generateNonce() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APISignature;
}
