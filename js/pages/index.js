// 首页
const IndexPage = {
  render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="page" data-page="index">
        <div class="accent-bar">
          <div class="accent-bar-segment" style="background-color: var(--color-gray-green);"></div>
          <div class="accent-bar-segment" style="background-color: var(--color-light-yellow);"></div>
          <div class="accent-bar-segment" style="background-color: var(--color-terracotta);"></div>
          <div class="accent-bar-segment" style="background-color: var(--color-slate);"></div>
          <div class="accent-bar-segment" style="background-color: var(--color-olive);"></div>
          <div class="accent-bar-segment" style="background-color: var(--color-mint);"></div>
        </div>
        
        <div class="container index-container">
          <div class="header">
            <h1 class="title">📸 AI拍照辅助</h1>
            <p class="subtitle">INTELLIGENT PHOTOGRAPHY GUIDE</p>
            <div class="quota-info">
              <span class="quota-label">剩余额度：</span>
              <span class="quota-value">${App.getRemainingQuota()} 张</span>
            </div>
          </div>
          
          <div class="features">
            <div class="feature-card">
              <div class="feature-icon">🎯</div>
              <div class="feature-title">智能识别</div>
              <div class="feature-desc">AI自动识别照片风格</div>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📐</div>
              <div class="feature-title">构图辅助</div>
              <div class="feature-desc">九宫格 / 黄金分割线</div>
            </div>
            <div class="feature-card">
              <div class="feature-icon">💡</div>
              <div class="feature-title">专业建议</div>
              <div class="feature-desc">个性化拍摄指导</div>
            </div>
          </div>
          
          <div class="start-section">
            <button class="btn btn-start" id="startBtn">
              开始分析照片
            </button>
            <p class="tips">支持 JPG / PNG / HEIC / PDF / TIFF</p>
          </div>
          
          <div class="steps-section">
            <h2 class="steps-title">使用步骤</h2>
            <div class="step-item">
              <div class="step-number">1</div>
              <div class="step-content">
                <div class="step-text">上传照片</div>
                <div class="step-desc">选择您想要优化的照片</div>
              </div>
            </div>
            <div class="step-item">
              <div class="step-number">2</div>
              <div class="step-content">
                <div class="step-text">选择风格</div>
                <div class="step-desc">AI识别或手动选择目标风格</div>
              </div>
            </div>
            <div class="step-item">
              <div class="step-number">3</div>
              <div class="step-content">
                <div class="step-text">获取建议</div>
                <div class="step-desc">查看构图辅助线和拍摄建议</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.querySelector('[data-page="index"]').classList.remove('hidden');
    
    // 绑定开始按钮事件（微信小程序兼容）
    setTimeout(() => {
      const startBtn = document.getElementById('startBtn');
      if (startBtn) {
        startBtn.addEventListener('click', () => {
          Router.navigate('upload');
        });
        
        startBtn.addEventListener('touchend', (e) => {
          e.preventDefault();
          Router.navigate('upload');
        });
      }
    }, 10);
  }
};
