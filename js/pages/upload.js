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
    
    const reader = new FileReader();
    reader.onload = (event) => {
      this.imageUrl = event.target.result;
      App.globalData.currentImage = this.imageUrl;
      
      document.getElementById('uploadArea').classList.add('hidden');
      document.getElementById('imagePreview').classList.remove('hidden');
      document.getElementById('previewImg').src = this.imageUrl;
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
      // 🔥 直接调用阿里云API识别图片风格（方案1）
      console.log('开始调用AI识别接口...');
      console.log('图片URL长度:', this.imageUrl.length);
      console.log('图片URL前缀:', this.imageUrl.substring(0, 100));
      
      const result = await AliCloud.recognizeStyle(this.imageUrl);
      
      console.log('AI识别响应:', result);
      
      if (result && result.category) {
        // 🔥 AI识别成功，消费配额
        await App.consumeQuota();
        console.log('✅ 配额已消耗，剩余:', App.getRemainingQuota());
        
        // 🔥 AI识别成功，消费配额
        await App.consumeQuota();
        console.log('✅ 配额已消耗，剩余:', App.getRemainingQuota());
        
        // 保存AI识别结果
        App.globalData.aiRecognizedCategory = result.category;
        App.globalData.aiRecognizedStyle = result.style;
        App.globalData.aiConfidence = result.confidence || 85;
        
        console.log('AI识别成功:', result);
        
        // 跳转到风格选择页（可以预填AI识别的结果）
        Router.navigate('style-select');
      } else {
        // AI识别失败，仍然跳转，让用户手动选择
        console.warn('AI识别失败，跳转到手动选择');
        Utils.toast('AI识别失败，请手动选择风格');
        Router.navigate('style-select');
      }
    } catch (error) {
      console.error('AI分析错误:', error);
      console.error('错误详情:', error.message);
      console.error('错误堆栈:', error.stack);
      Utils.toast('分析失败: ' + (error.message || '请重试'));
      document.getElementById('loadingSection').classList.add('hidden');
      document.getElementById('imagePreview').classList.remove('hidden');
    }
  }
};
