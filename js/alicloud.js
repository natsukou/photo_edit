// 阿里云百炼API封装

const AliCloud = {
  apiKey: 'sk-8bb7317eaf36424580fbfbe2ae3ff037',
  baseURL: 'https://dashscope.aliyuncs.com/api/v1',
  
  // 图片识别风格
  async recognizeStyle(base64Image) {
    try {
      const response = await fetch(`${this.baseURL}/services/aigc/multimodal-generation/generation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'qwen-vl-plus',
          input: {
            messages: [
              {
                role: 'user',
                content: [
                  { image: base64Image },
                  { text: '请识别这张照片的拍摄题材和风格特征，从以下题材中选择：人像摄影、风光摄影、建筑摄影、宠物摄影、美食摄影、街拍摄影、产品摄影、静物摄影、花卉摄影、夜景摄影。风格特征包括：日系小清新、复古港风、电影感、胶片风、INS风、暗黑系、高级感、莫兰迪色、赛博朋克、油画质感等。' }
                ]
              }
            ]
          }
        })
      });
      
      const data = await response.json();
      if (data.output && data.output.choices) {
        return this.parseRecognitionResult(data.output.choices[0].message.content);
      }
      throw new Error('识别失败');
    } catch (error) {
      console.error('API调用失败:', error);
      return null;
    }
  },
  
  // 解析识别结果
  parseRecognitionResult(content) {
    // 简单解析，实际应用中需要更复杂的NLP处理
    const categories = ['人像摄影', '风光摄影', '建筑摄影', '宠物摄影', '美食摄影', '街拍摄影', '产品摄影', '静物摄影', '花卉摄影', '夜景摄影'];
    const styles = ['日系小清新', '复古港风', '电影感', '胶片风', 'INS风', '暗黑系', '高级感', '莫兰迪色', '赛博朋克', '油画质感'];
    
    let category = '人像摄影';
    let style = '日系小清新';
    
    categories.forEach(cat => {
      if (content.includes(cat)) category = cat;
    });
    
    styles.forEach(sty => {
      if (content.includes(sty)) style = sty;
    });
    
    return { category, style, confidence: 85 };
  },
  
  // 生成拍摄建议
  async generateAdvice(category, style, base64Image) {
    try {
      const response = await fetch(`${this.baseURL}/services/aigc/text-generation/generation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'qwen-turbo',
          input: {
            messages: [
              {
                role: 'user',
                content: `作为摄影指导专家，请为用户提供${category}类型、${style}风格的拍摄建议。请从以下3个方面给出具体建议：1.构图建议 2.光线处理 3.拍摄角度。每条建议要具体、实用，适合摄影新手理解和执行。`
              }
            ]
          },
          parameters: {
            max_tokens: 500
          }
        })
      });
      
      const data = await response.json();
      if (data.output && data.output.choices) {
        return this.parseAdviceResult(data.output.choices[0].message.content);
      }
      return this.getMockAdvice();
    } catch (error) {
      console.error('生成建议失败:', error);
      return this.getMockAdvice();
    }
  },
  
  // 解析建议结果
  parseAdviceResult(content) {
    // 简单分段解析
    const sections = content.split(/\d+\.|【|】/).filter(s => s.trim());
    return [
      {
        title: '构图建议',
        description: sections[0] || '建议将主体放在九宫格的交叉点上，利用三分法构图使画面更加平衡。'
      },
      {
        title: '光线处理',
        description: sections[1] || '选择柔和的自然光，避免正午的强烈直射光。可以利用侧逆光营造层次感。'
      },
      {
        title: '拍摄角度',
        description: sections[2] || '尝试不同的拍摄角度，如低角度或高角度，为画面增添视觉冲击力。'
      }
    ];
  },
  
  // 模拟数据
  getMockAdvice() {
    return [
      {
        title: '构图建议',
        description: '建议将主体放在九宫格的交叉点上，利用三分法构图使画面更加平衡。当前主体位置略偏中心，缺少视觉张力。'
      },
      {
        title: '光线处理',
        description: '目标风格需要柔和的自然光。建议选择清晨或傍晚的黄金时段拍摄，避免正午的强烈直射光。可以利用侧逆光营造层次感。'
      },
      {
        title: '拍摄角度',
        description: '可以尝试稍低的拍摄角度，突出主体的立体感。同时注意背景的简洁性，避免杂乱元素分散注意力。'
      }
    ];
  }
};
