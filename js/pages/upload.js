// 上传页面
const UploadPage = {
  imageUrl: null,
  
  render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="page" data-page="upload">
        <div class="accent-bar">
          <div class="accent-bar-segment" style="background-color: var(--color-gray-black);"></div>
          <div class="accent-bar-segment" style="background-color: var(--color-light-brown);"></div>
          <div class="accent-bar-segment" style="background-color: var(--color-slate);"></div>
          <div class="accent-bar-segment" style="background-color: var(--color-terracotta);"></div>
          <div class="accent-bar-segment" style="background-color: var(--color-mint);"></div>
        </div>
        
        <div class="container upload-container">
          <h1 class="title">上传照片</h1>
          <p class="subtitle">UPLOAD YOUR PHOTO</p>
          
          <div class="upload-area" id="uploadArea">
            <div class="upload-icon">📷</div>
            <div class="upload-text">点击上传照片</div>
            <div class="upload-tips">支持 JPG / PNG / HEIC / PDF / TIFF</div>
            <input type="file" id="fileInput" accept="image/*,.heic,.pdf,.tiff" style="display: none;">
          </div>
          
          <div class="image-preview hidden" id="imagePreview">
            <img id="previewImg" src="" alt="预览图">
            <div class="image-actions">
              <button class="btn btn-secondary" id="reSelectBtn">重新选择</button>
              <button class="btn" id="analyzeBtn">开始分析</button>
            </div>
          </div>
          
          <div class="loading-section hidden" id="loadingSection">
            <div class="spinner"></div>
            <p class="loading-text">AI正在识别照片风格...</p>
          </div>
        </div>
      </div>
    `;
    
    document.querySelector('[data-page="upload"]').classList.remove('hidden');
    
    // 绑定事件（微信小程序兼容）
    setTimeout(() => {
      const uploadArea = document.getElementById('uploadArea');
      const fileInput = document.getElementById('fileInput');
      const reSelectBtn = document.getElementById('reSelectBtn');
      const analyzeBtn = document.getElementById('analyzeBtn');
      
      if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => {
          fileInput.click();
        });
        
        uploadArea.addEventListener('touchend', (e) => {
          e.preventDefault();
          fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => {
          UploadPage.handleFileSelect(e);
        });
      }
      
      if (reSelectBtn && fileInput) {
        reSelectBtn.addEventListener('click', () => {
          fileInput.click();
        });
        
        reSelectBtn.addEventListener('touchend', (e) => {
          e.preventDefault();
          fileInput.click();
        });
      }
      
      if (analyzeBtn) {
        analyzeBtn.addEventListener('click', () => {
          UploadPage.analyzeImage();
        });
        
        analyzeBtn.addEventListener('touchend', (e) => {
          e.preventDefault();
          UploadPage.analyzeImage();
        });
      }
    }, 10);
  },
  
  handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // 🔥 压缩图片以避免请求体过大
    this.compressImage(file, (compressedDataUrl) => {
      this.imageUrl = compressedDataUrl;
      App.globalData.currentImage = this.imageUrl;
      
      document.getElementById('uploadArea').classList.add('hidden');
      document.getElementById('imagePreview').classList.remove('hidden');
      document.getElementById('previewImg').src = this.imageUrl;
    });
  },
  
  // 🔥 新增：压缩图片方法
  compressImage(file, callback) {
    // 检查文件大小，小于 10MB 的图片不压缩直接返回
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size < maxSize) {
      console.log('图片小于 10MB，跳过压缩:', file.size);
      const reader = new FileReader();
      reader.onload = (event) => {
        callback(event.target.result);
      };
      reader.readAsDataURL(file);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // 计算压缩后的尺寸（最大宽度 1500px）
        let width = img.width;
        let height = img.height;
        const maxWidth = 1500;
        
        if (width > maxWidth) {
          height = Math.round(height * maxWidth / width);
          width = maxWidth;
        }
        
        // 创建 canvas 进行压缩
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // 转换为 JPEG，质量 0.85（提高质量）
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        console.log('图片压缩完成:', {
          original: file.size,
          compressed: Math.round(compressedDataUrl.length * 0.75), // base64 约为原图 1.33 倍
          width,
          height
        });
        
        callback(compressedDataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  },
  
  async analyzeImage() {
    if (!this.imageUrl) return;
    
    // 🔥 检查配额
    const quota = App.getRemainingQuota();
    console.log('当前配额:', quota);
    
    if (quota <= 0) {
      Utils.toast('今日配额已用完，请明天再来！');
      return;
    }
    
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('loadingSection').classList.remove('hidden');
    
    try {
      // 🔥 调用后端代理接口识别图片风格
      console.log('🚀 开始调用后端AI识别接口...');
      console.log('图片URL长度:', this.imageUrl.length);
      console.log('图片URL前缀:', this.imageUrl.substring(0, 100));
      
      // 调用后端代理接口
      const response = await API._request('POST', '/ai/recognize', {
        image: this.imageUrl
      });
      
      console.log('✅ AI识别响应:', response);
      
      if (response.code === 0 && response.data) {
        // 🔥 AI识别成功，消费配额
        await App.consumeQuota();
        console.log('✅ 配额已消耗，剩余:', App.getRemainingQuota());
        
        // 保存AI识别结果
        App.globalData.aiRecognizedCategory = response.data.category;
        App.globalData.aiRecognizedStyle = response.data.style;
        App.globalData.aiConfidence = response.data.confidence || 85;
        
        console.log('✅ AI识别成功:', {
          category: response.data.category,
          style: response.data.style,
          confidence: response.data.confidence
        });
        
        Utils.toast('✨ AI识别成功', 1500);
      } else {
        // 🔥 AI识别失败，静默失败，不显示Toast
        console.warn('⚠️ AI识别失败，静默跳转到手动选择');
      }
      
      // 无论成功失败，都跳转到风格选择页
      Router.navigate('style-select');
    } catch (error) {
      console.error('AI分析错误:', error);
      console.error('错误详情:', error.message);
      console.error('错误堆栈:', error.stack);
      
      // 🔥 更友好的错误提示
      let errorMsg = '分析失败，请重试';
      if (error.message.includes('400')) {
        errorMsg = '图片太大，请尝试上传更小的图片';
      } else if (error.message.includes('timeout') || error.message.includes('超时')) {
        errorMsg = '请求超时，请稍后重试';
      } else if (error.message.includes('Failed to fetch')) {
        errorMsg = '网络连接失败，请检查网络';
      }
      
      Utils.toast(errorMsg);
      document.getElementById('loadingSection').classList.add('hidden');
      document.getElementById('imagePreview').classList.remove('hidden');
    }
  }
};
