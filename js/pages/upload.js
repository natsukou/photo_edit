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
          
          <div class="upload-area" id="uploadArea" onclick="document.getElementById('fileInput').click()">
            <div class="upload-icon">📷</div>
            <div class="upload-text">点击上传照片</div>
            <div class="upload-tips">支持 JPG / PNG / HEIC / PDF / TIFF</div>
            <input type="file" id="fileInput" accept="image/*,.heic,.pdf,.tiff" style="display: none;" onchange="UploadPage.handleFileSelect(event)">
          </div>
          
          <div class="image-preview hidden" id="imagePreview">
            <img id="previewImg" src="" alt="预览图">
            <div class="image-actions">
              <button class="btn btn-secondary" onclick="document.getElementById('fileInput').click()">重新选择</button>
              <button class="btn" onclick="UploadPage.analyzeImage()">开始分析</button>
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
    
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('loadingSection').classList.remove('hidden');
    
    setTimeout(() => {
      Router.navigate('style-select');
    }, 2000);
  }
};
