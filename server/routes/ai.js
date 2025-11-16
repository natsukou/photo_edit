const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const sharp = require('sharp');
const APISignature = require('../utils/api-signature');

// 阿里云百炼API配置
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || 'sk-8bb7317eaf36424580fbfbe2ae3ff037';
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';

// API网关配置
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'https://b6cb40828efb4332baaef3da54b96514-cn-shanghai.alicloudapi.com';
const ALIYUN_APP_KEY = process.env.ALIYUN_APP_KEY || '112266072';
const ALIYUN_APP_SECRET = process.env.ALIYUN_APP_SECRET || 'Kn5eYBngioFH8a5Pz4XApnMQ3ls62GV4';

// 判断是否使用API网关
const USE_API_GATEWAY = process.env.USE_API_GATEWAY === 'true' || false;

console.log('🔧 AI路由配置:');
console.log('  USE_API_GATEWAY:', USE_API_GATEWAY);
console.log('  API_GATEWAY_URL:', API_GATEWAY_URL);
console.log('  ALIYUN_APP_KEY:', ALIYUN_APP_KEY);
console.log('  DASHSCOPE_API_KEY:', DASHSCOPE_API_KEY ? DASHSCOPE_API_KEY.substring(0, 10) + '...' : 'undefined');

/**
 * 压缩图片以满足API限制（20MB base64）
 */
async function compressImage(base64Data) {
  try {
    // 移除data URL前缀
    let base64String = base64Data;
    if (base64Data.startsWith('data:')) {
      base64String = base64Data.split(',')[1];
    }
    
    // 转换为Buffer
    const imageBuffer = Buffer.from(base64String, 'base64');
    console.log('原始图片大小:', imageBuffer.length, 'bytes');
    
    // 使用sharp压缩图片，限制在800px宽度，质量80%
    const compressedBuffer = await sharp(imageBuffer)
      .resize({ width: 800, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    console.log('压缩后图片大小:', compressedBuffer.length, 'bytes');
    
    // 转换为base64
    const compressedBase64 = compressedBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${compressedBase64}`;
    
    // 检查是否超过阿里云限制（20MB）
    if (dataUrl.length > 20000000) {
      console.warn('⚠️ 压缩后仍然超过限制，尝试更大的压缩比例');
      // 更激进的压缩
      const moreCompressed = await sharp(imageBuffer)
        .resize({ width: 600, withoutEnlargement: true })
        .jpeg({ quality: 60 })
        .toBuffer();
      console.log('二次压缩后大小:', moreCompressed.length, 'bytes');
      return `data:image/jpeg;base64,${moreCompressed.toString('base64')}`;
    }
    
    return dataUrl;
  } catch (error) {
    console.error('图片压缩失败:', error);
    throw error;
  }
}

/**
 * 调用API网关（带签名）
 */
async function callAPIGateway(path, method, body) {
  const signer = new APISignature(ALIYUN_APP_KEY, ALIYUN_APP_SECRET);
  const bodyString = JSON.stringify(body);
  
  console.log('🔑 API网关调用信息:');
  console.log('  路径:', path);
  console.log('  方法:', method);
  console.log('  AppKey:', ALIYUN_APP_KEY);
  console.log('  AppSecret:', ALIYUN_APP_SECRET ? ALIYUN_APP_SECRET.substring(0, 10) + '...' : 'undefined');
  
  // 生成签名头
  const headers = signer.sign(
    method,
    path,
    { 'Content-Type': 'application/json' },
    {},
    bodyString
  );
  
  console.log('✅ 已生成API网关签名');
  console.log('  请求头:', JSON.stringify(headers, null, 2));
  
  // 调用API网关
  const fullUrl = `${API_GATEWAY_URL}${path}`;
  console.log('  完整URL:', fullUrl);
  
  const response = await fetch(fullUrl, {
    method,
    headers,
    body: bodyString,
    timeout: 30000
  });
  
  console.log('  响应状态码:', response.status);
  console.log('  响应头:', JSON.stringify([...response.headers.entries()], null, 2));
  
  return response;
}

/**
 * 直接调用阿里云API
 */
async function callDashScopeAPI(endpoint, body) {
  const response = await fetch(`${DASHSCOPE_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
    timeout: 30000
  });
  
  return response;
}

/**
 * POST /api/ai/recognize
 * 图片风格识别（代理阿里云通义千问视觉模型）
 */
router.post('/recognize', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        code: -1,
        message: '缺少图片数据'
      });
    }

    console.log('收到AI识别请求，图片大小:', image.length, '字符');

    // 压缩图片以满足API限制
    console.log('📊 开始压缩图片...');
    const compressedImage = await compressImage(image);
    console.log('✅ 图片压缩完成，压缩后大小:', compressedImage.length, '字符');

    // 移除base64前缀（如果有）
    let imageData = compressedImage;
    if (image.startsWith('data:image')) {
      // 保留完整的data URL格式，因为通义千问VL支持这种格式
      imageData = image;
      console.log('检测到data URL格式，保持原格式');
    } else {
      console.log('纯base64格式，添加data URL前缀');
      imageData = `data:image/jpeg;base64,${image}`;
    }

    // 调用阿里云API
    const requestBody = {
      model: 'qwen-vl-plus',
      input: {
        messages: [
          {
            role: 'user',
            content: [
              { image: imageData },
              { 
                text: '请识别这张照片的拍摄题材和风格特征，从以下题材中选择一个：人像摄影、风光摄影、建筑摄影、宠物摄影、美食摄影、街拍摄影、产品摄影、静物摄影、花卉摄影、夜景摄影。然后从以下风格中选择一个：日系小清新、复古港风、电影感、胶片风、INS风、暗黑系、高级感、莫兰迪色、赛博朋克、油画质感。请直接回答"题材: XXX, 风格: XXX"的格式。' 
              }
            ]
          }
        ]
      },
      parameters: {
        result_format: 'message'
      }
    };

    console.log('调用阿里云API...');
    console.log('请求体预览:', {
      model: requestBody.model,
      messages_count: requestBody.input.messages.length,
      content_items: requestBody.input.messages[0].content.length,
      image_format: imageData.startsWith('data:') ? 'data URL' : 'unknown',
      image_length: imageData.length
    });
    const startTime = Date.now();

    let response;
    if (USE_API_GATEWAY) {
      console.log('🔒 使用API网关模式（带签名）');
      response = await callAPIGateway('/api/ai/recognize', 'POST', requestBody);
    } else {
      console.log('🔓 直接调用阿里云API（无签名）');
      response = await callDashScopeAPI('/services/aigc/multimodal-generation/generation', requestBody);
    }

    const duration = Date.now() - startTime;
    console.log(`API响应时间: ${duration}ms, 状态码: ${response.status}`);
    
    // 读取响应数据
    let data;
    const responseText = await response.text();
    console.log('响应文本:', responseText.substring(0, 500));
    
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('响应解析失败:', parseError);
      throw new Error('响应格式无效: ' + responseText.substring(0, 200));
    }

    if (response.ok && data.output && data.output.choices && data.output.choices.length > 0) {
      const content = data.output.choices[0].message.content;
      console.log('AI识别结果:', content);

      // 解析识别结果
      const result = parseRecognitionResult(content);
      
      // 记录费用信息
      if (data.usage) {
        const totalTokens = (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0);
        const cost = (totalTokens / 1000 * 0.04).toFixed(4);
        console.log(`Token消耗: 输入=${data.usage.input_tokens}, 输出=${data.usage.output_tokens}, 预估费用: ¥${cost}`);
      }

      res.json({
        code: 0,
        message: 'success',
        data: {
          category: result.category,
          style: result.style,
          confidence: result.confidence,
          raw_response: content,
          duration_ms: duration
        }
      });
    } else if (data.code) {
      console.error('阿里云API错误:', data.code, data.message);
      res.status(500).json({
        code: -1,
        message: `AI识别失败: ${data.message}`,
        error_code: data.code
      });
    } else {
      console.error('API返回数据格式异常:', data);
      res.status(500).json({
        code: -1,
        message: 'API返回数据格式异常'
      });
    }
  } catch (error) {
    console.error('AI识别错误:', error);
    console.error('错误堆栈:', error.stack);
    console.error('错误详情:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    res.status(500).json({
      code: -1,
      message: '服务器错误: ' + error.message,
      error: error.message,
      error_stack: error.stack
    });
  }
});

/**
 * 解析AI识别结果
 */
function parseRecognitionResult(content) {
  const categories = ['人像摄影', '风光摄影', '建筑摄影', '宠物摄影', '美食摄影', '街拍摄影', '产品摄影', '静物摄影', '花卉摄影', '夜景摄影'];
  const styles = ['日系小清新', '复古港风', '电影感', '胶片风', 'INS风', '暗黑系', '高级感', '莫兰迪色', '赛博朋克', '油画质感'];

  let category = '人像摄影';
  let style = '日系小清新';
  let confidence = 85;

  // 尝试从内容中提取题材和风格
  categories.forEach(cat => {
    if (content.includes(cat)) category = cat;
  });

  styles.forEach(sty => {
    if (content.includes(sty)) style = sty;
  });

  return { category, style, confidence };
}

/**
 * GET /api/ai/status
 * 检查AI服务状态
 */
router.get('/status', async (req, res) => {
  try {
    // 测试API连接
    const response = await fetch(`${DASHSCOPE_BASE_URL}/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        input: {
          messages: [{ role: 'user', content: 'ping' }]
        }
      }),
      timeout: 5000
    });

    const available = response.ok;

    res.json({
      code: 0,
      message: 'success',
      data: {
        available,
        api_key_configured: !!DASHSCOPE_API_KEY,
        api_key_prefix: DASHSCOPE_API_KEY ? DASHSCOPE_API_KEY.substring(0, 10) + '...' : null
      }
    });
  } catch (error) {
    res.json({
      code: 0,
      message: 'success',
      data: {
        available: false,
        error: error.message
      }
    });
  }
});

/**
 * POST /api/ai/advice
 * 生成拍摄建议（代理阿里云通义千问文本模型）
 */
router.post('/advice', async (req, res) => {
  try {
    const { category, style, imageUrl } = req.body;

    if (!category || !style) {
      return res.status(400).json({
        code: -1,
        message: '缺少题材或风格参数'
      });
    }

    console.log('收到AI建议请求:', category, style);

    const prompt = `你是一位专业摄影师。用户拍摄了一张${category}，想要${style}风格的效果。请提供5条简洁实用的拍摄建议，每条建议不超过25字。直接返回建议列表，格式为：1. XXX
2. XXX
3. XXX
4. XXX
5. XXX`;

    const requestBody = {
      model: 'qwen-turbo',
      input: {
        messages: [
          { role: 'user', content: prompt }
        ]
      },
      parameters: {
        result_format: 'message'
      }
    };

    console.log('调用阿里云AI生成建议...');
    const startTime = Date.now();

    let response;
    if (USE_API_GATEWAY) {
      console.log('🔒 使用API网关模式（带签名）');
      response = await callAPIGateway('/api/ai/advice', 'POST', requestBody);
    } else {
      console.log('🔓 直接调用阿里云API（无签名）');
      response = await callDashScopeAPI('/services/aigc/text-generation/generation', requestBody);
    }

    const duration = Date.now() - startTime;
    const data = await response.json();

    if (response.ok && data.output && data.output.choices) {
      const content = data.output.choices[0].message.content;
      console.log('AI建议生成成功:', content.substring(0, 100));

      // 解析建议列表
      const adviceList = content.split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 0)
        .slice(0, 5);

      if (data.usage) {
        const totalTokens = (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0);
        const cost = (totalTokens / 1000 * 0.008).toFixed(4);
        console.log(`Token消耗: ${totalTokens}, 预估费用: ¥${cost}`);
      }

      res.json({
        code: 0,
        message: 'success',
        data: adviceList,
        duration_ms: duration
      });
    } else {
      console.error('阿里云API错误:', data);
      res.status(500).json({
        code: -1,
        message: 'AI生成建议失败',
        error: data.message
      });
    }
  } catch (error) {
    console.error('AI生成建议错误:', error);
    res.status(500).json({
      code: -1,
      message: '服务器错误',
      error: error.message
    });
  }
});

module.exports = router;
