const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// 阿里云百炼API配置
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || 'sk-8bb7317eaf36424580fbfbe2ae3ff037';
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';

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

    // 移除base64前缀（如果有）
    let imageData = image;
    if (image.startsWith('data:image')) {
      imageData = image.split(',')[1];
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
    const startTime = Date.now();

    const response = await fetch(`${DASHSCOPE_BASE_URL}/services/aigc/multimodal-generation/generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      timeout: 30000 // 30秒超时
    });

    const duration = Date.now() - startTime;
    console.log(`API响应时间: ${duration}ms, 状态码: ${response.status}`);

    const data = await response.json();

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
    res.status(500).json({
      code: -1,
      message: '服务器错误',
      error: error.message
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

    const response = await fetch(`${DASHSCOPE_BASE_URL}/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      timeout: 30000
    });

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
