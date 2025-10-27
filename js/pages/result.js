// 结果页面
const ResultPage = {
  canvas: null,
  ctx: null,
  currentTab: 0,
  guides: { grid: true, golden: false, diagonal: false, center: false },
  
  render() {
    console.log('ResultPage.render 被调用');
    console.log('App.globalData:', App.globalData);
    
    const category = App.globalData.currentCategory;
    const style = App.globalData.currentStyle;
    const imageUrl = App.globalData.currentImage;
    
    console.log('category:', category);
    console.log('style:', style);
    console.log('imageUrl:', imageUrl ? imageUrl.substring(0, 50) + '...' : 'null');
    
    const sampleUrl = SampleImages.getSampleImage(category, style.split(' ')[0]);
    console.log('sampleUrl:', sampleUrl);
    
    App.consumeQuota();
    
    const app = document.getElementById('app');
    console.log('app 元素:', app);
    app.innerHTML = `
      <div class="page" data-page="result">
        <div class="container result-container">
          <div class="info-card">
            <div class="info-item">
              <span class="info-label">题材：</span>
              <span class="info-value">${category}</span>
            </div>
            <div class="info-item">
              <span class="info-label">风格：</span>
              <span class="info-value">${style}</span>
            </div>
          </div>
          
          <div class="comparison-section">
            <h2 class="section-title">📐 构图分析</h2>
            <div class="tab-bar">
              <div class="tab-item active" onclick="ResultPage.switchTab(0)">原图</div>
              <div class="tab-item" onclick="ResultPage.switchTab(1)">辅助线</div>
              <div class="tab-item" onclick="ResultPage.switchTab(2)">参考样例</div>
            </div>
            
            <div class="image-container" id="tabContent0" style="display: block">
              <img src="${imageUrl}" style="width: 100%; height: auto;">
            </div>
            
            <div class="image-container" id="tabContent1" style="display: none">
              <canvas id="guideCanvas" style="width: 100%; background: #000;"></canvas>
              <div class="guide-controls">
                <label class="guide-option"><input type="checkbox" checked onchange="ResultPage.toggleGuide('grid', this.checked)"> 九宫格</label>
                <label class="guide-option"><input type="checkbox" onchange="ResultPage.toggleGuide('golden', this.checked)"> 黄金分割</label>
                <label class="guide-option"><input type="checkbox" onchange="ResultPage.toggleGuide('diagonal', this.checked)"> 对角线</label>
                <label class="guide-option"><input type="checkbox" onchange="ResultPage.toggleGuide('center', this.checked)"> 中心十字</label>
              </div>
            </div>
            
            <div class="image-container" id="tabContent2" style="display: none">
              <img src="${sampleUrl}" style="width: 100%; height: auto;" onerror="this.src='https://via.placeholder.com/600x800'">
              <p class="reference-caption">${category} - ${style}</p>
            </div>
          </div>
          
          <div class="advice-section">
            <h2 class="section-title">💡 拍摄建议</h2>
            <div class="advice-list">
              <div class="advice-item">
                <div class="advice-number">1</div>
                <div class="advice-content">
                  <h3 class="advice-title">构图建议</h3>
                  <p class="advice-desc">建议将主体放在九宫格的交叉点上，利用三分法构图使画面更加平衡。当前主体位置略偏中心，缺少视觉张力。</p>
                </div>
              </div>
              <div class="advice-item">
                <div class="advice-number">2</div>
                <div class="advice-content">
                  <h3 class="advice-title">光线处理</h3>
                  <p class="advice-desc">目标风格需要柔和的自然光。建议选择清晨或傍晚的黄金时段拍摄，避免正午的强烈直射光。可以利用侧逆光营造层次感。</p>
                </div>
              </div>
              <div class="advice-item">
                <div class="advice-number">3</div>
                <div class="advice-content">
                  <h3 class="advice-title">拍摄角度</h3>
                  <p class="advice-desc">可以尝试稍低的拍摄角度，突出主体的立体感。同时注意背景的简洁性，避免杂乱元素分散注意力。</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="action-section">
            <button class="btn" onclick="ResultPage.saveImage()">保存辅助线图</button>
            <button class="btn btn-secondary" onclick="ResultPage.showModal()">返回首页</button>
          </div>
        </div>
        
        <div class="modal hidden" id="quotaModal">
          <div class="modal-mask" onclick="ResultPage.closeModal()"></div>
          <div class="modal-content">
            <div class="modal-header">
              <h3 class="modal-title">🎉 获取更多额度</h3>
              <span class="modal-close" onclick="ResultPage.closeModal()">×</span>
            </div>
            <div class="modal-body">
              <p>扫码添加微信，获取更多免费图片额度！</p>
              <div class="qrcode-container">
                <img src="images/wechat-qrcode.jpg" alt="微信二维码" onerror="this.src='https://via.placeholder.com/200x200?text=QR+Code'" style="width: 200px; height: 200px; border: 2px solid #000; object-fit: contain;">
                <p style="font-size: 12px; color: #666; margin-top: 8px;">长按保存二维码</p>
              </div>
              <div class="contact-info">
                <span>💬 微信号：</span>
                <strong>GreeNakia</strong>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" onclick="ResultPage.closeModal()">稍后再说</button>
              <button class="btn" onclick="ResultPage.backToHome()">返回首页</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.querySelector('[data-page="result"]').classList.remove('hidden');
    console.log('ResultPage DOM 渲染完成');
    setTimeout(() => {
      console.log('尝试初始化Canvas...');
      ResultPage.initCanvas();
    }, 100);
  },
  
  switchTab(tab) {
    this.currentTab = tab;
    for (let i = 0; i < 3; i++) {
      const el = document.getElementById(`tabContent${i}`);
      if (el) el.style.display = i === tab ? 'block' : 'none';
    }
    document.querySelectorAll('.tab-item').forEach((item, index) => {
      item.classList.toggle('active', index === tab);
    });
    
    if (tab === 1 && !this.canvas) {
      setTimeout(() => ResultPage.initCanvas(), 100);
    }
  },
  
  initCanvas() {
    const canvas = document.getElementById('guideCanvas');
    if (!canvas) return;
    
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.style.height = 'auto';
      
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.drawGuides();
    };
    img.src = App.globalData.currentImage;
  },
  
  drawGuides() {
    if (!this.ctx || !this.canvas) return;
    
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, w, h);
      
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      if (this.guides.grid) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.moveTo(w/3, 0); ctx.lineTo(w/3, h);
        ctx.moveTo(w*2/3, 0); ctx.lineTo(w*2/3, h);
        ctx.moveTo(0, h/3); ctx.lineTo(w, h/3);
        ctx.moveTo(0, h*2/3); ctx.lineTo(w, h*2/3);
        ctx.stroke();
      }
      
      if (this.guides.golden) {
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.beginPath();
        const r = 0.618;
        ctx.moveTo(w*r, 0); ctx.lineTo(w*r, h);
        ctx.moveTo(w*(1-r), 0); ctx.lineTo(w*(1-r), h);
        ctx.moveTo(0, h*r); ctx.lineTo(w, h*r);
        ctx.moveTo(0, h*(1-r)); ctx.lineTo(w, h*(1-r));
        ctx.stroke();
      }
      
      if (this.guides.diagonal) {
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(w, h);
        ctx.moveTo(w, 0); ctx.lineTo(0, h);
        ctx.stroke();
      }
      
      if (this.guides.center) {
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.8)';
        ctx.beginPath();
        ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h);
        ctx.moveTo(0, h/2); ctx.lineTo(w, h/2);
        ctx.stroke();
      }
    };
    img.src = App.globalData.currentImage;
  },
  
  toggleGuide(type, checked) {
    this.guides[type] = checked;
    this.drawGuides();
  },
  
  saveImage() {
    if (!this.canvas) {
      Utils.toast('请先切换到辅助线标签页');
      return;
    }
    Utils.downloadImage(this.canvas, 'photo-guide.png');
    Utils.toast('图片已保存');
  },
  
  showModal() {
    document.getElementById('quotaModal').classList.remove('hidden');
  },
  
  closeModal() {
    document.getElementById('quotaModal').classList.add('hidden');
  },
  
  backToHome() {
    this.closeModal();
    Router.reLaunch('index');
  }
};
