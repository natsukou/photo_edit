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
            <div class="tab-bar" id="tabBar">
              <div class="tab-item active" data-tab="0">原图</div>
              <div class="tab-item" data-tab="1">辅助线</div>
              <div class="tab-item" data-tab="2">参考样例</div>
            </div>
            
            <div class="image-container" id="tabContent0" style="display: block">
              <img src="${imageUrl}" style="width: 100%; height: auto;">
            </div>
            
            <div class="image-container" id="tabContent1" style="display: none">
              <canvas id="guideCanvas" style="width: 100%; background: #000;"></canvas>
              <div class="guide-controls">
                <label class="guide-option"><input type="checkbox" checked data-guide="grid"> 九宫格</label>
                <label class="guide-option"><input type="checkbox" data-guide="golden"> 黄金分割</label>
                <label class="guide-option"><input type="checkbox" data-guide="diagonal"> 对角线</label>
                <label class="guide-option"><input type="checkbox" data-guide="center"> 中心十字</label>
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
            <button class="btn" id="saveBtn">保存辅助线图</button>
            <button class="btn btn-secondary" id="showModalBtn">返回首页</button>
          </div>
        </div>
        
        <div class="modal hidden" id="quotaModal">
          <div class="modal-mask" id="modalMask"></div>
          <div class="modal-content">
            <div class="modal-header">
              <h3 class="modal-title">🎉 获取更多额度</h3>
              <span class="modal-close" id="modalClose">×</span>
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
              <button class="btn btn-secondary" id="laterBtn">稍后再说</button>
              <button class="btn" id="backHomeBtn">返回首页</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.querySelector('[data-page="result"]').classList.remove('hidden');
    console.log('ResultPage DOM 渲染完成');
    
    // 绑定事件（微信小程序兼容）
    setTimeout(() => {
      console.log('尝试初始化Canvas...');
      ResultPage.initCanvas();
      ResultPage.bindEvents();
    }, 100);
  },
  
  bindEvents() {
    // Tab切换
    const tabBar = document.getElementById('tabBar');
    if (tabBar) {
      tabBar.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-item')) {
          const tab = parseInt(e.target.getAttribute('data-tab'));
          this.switchTab(tab);
        }
      });
      
      tabBar.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (e.target.classList.contains('tab-item')) {
          const tab = parseInt(e.target.getAttribute('data-tab'));
          this.switchTab(tab);
        }
      });
    }
    
    // 辅助线控制
    const guideControls = document.querySelector('.guide-controls');
    if (guideControls) {
      guideControls.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
          const guideType = e.target.getAttribute('data-guide');
          if (guideType) {
            this.toggleGuide(guideType, e.target.checked);
          }
        }
      });
    }
    
    // 保存按钮
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveImage();
      });
      
      saveBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.saveImage();
      });
    }
    
    // 显示弹窗按钮
    const showModalBtn = document.getElementById('showModalBtn');
    if (showModalBtn) {
      showModalBtn.addEventListener('click', () => {
        this.showModal();
      });
      
      showModalBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.showModal();
      });
    }
    
    // 关闭弹窗
    const modalMask = document.getElementById('modalMask');
    const modalClose = document.getElementById('modalClose');
    const laterBtn = document.getElementById('laterBtn');
    
    [modalMask, modalClose, laterBtn].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          this.closeModal();
        });
        
        btn.addEventListener('touchend', (e) => {
          e.preventDefault();
          this.closeModal();
        });
      }
    });
    
    // 返回首页按钮
    const backHomeBtn = document.getElementById('backHomeBtn');
    if (backHomeBtn) {
      backHomeBtn.addEventListener('click', () => {
        this.backToHome();
      });
      
      backHomeBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.backToHome();
      });
    }
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
      
      // 大幅增加线宽，确保在高像素图片上清晰可见
      const baseLineWidth = Math.max(12, Math.min(w, h) / 100); // 最小12px，更粗
      ctx.lineWidth = baseLineWidth;
      
      // 使用更大间隔的虚线
      const dashLength = baseLineWidth * 6; // 虚线段长度增加
      const gapLength = baseLineWidth * 5; // 间隔长度增加
      ctx.setLineDash([dashLength, gapLength]);
      
      // 强化阴影效果
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      
      if (this.guides.grid) {
        // 九宫格使用亮白色，完全不透明
        ctx.strokeStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(w/3, 0); ctx.lineTo(w/3, h);
        ctx.moveTo(w*2/3, 0); ctx.lineTo(w*2/3, h);
        ctx.moveTo(0, h/3); ctx.lineTo(w, h/3);
        ctx.moveTo(0, h*2/3); ctx.lineTo(w, h*2/3);
        ctx.stroke();
        
        // 在交叉点绘制更大的圆圈标记
        ctx.fillStyle = '#FFFFFF';
        const dotSize = baseLineWidth * 2;
        [[w/3, h/3], [w/3, h*2/3], [w*2/3, h/3], [w*2/3, h*2/3]].forEach(([x, y]) => {
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      
      if (this.guides.golden) {
        // 黄金分割线使用鲜艳的金黄色
        ctx.strokeStyle = '#FFD700';
        ctx.beginPath();
        const r = 0.618;
        ctx.moveTo(w*r, 0); ctx.lineTo(w*r, h);
        ctx.moveTo(w*(1-r), 0); ctx.lineTo(w*(1-r), h);
        ctx.moveTo(0, h*r); ctx.lineTo(w, h*r);
        ctx.moveTo(0, h*(1-r)); ctx.lineTo(w, h*(1-r));
        ctx.stroke();
      }
      
      if (this.guides.diagonal) {
        // 对角线使用鲜艳的青色
        ctx.strokeStyle = '#00FFFF';
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(w, h);
        ctx.moveTo(w, 0); ctx.lineTo(0, h);
        ctx.stroke();
      }
      
      if (this.guides.center) {
        // 中心十字使用鲜艳的洋红色
        ctx.strokeStyle = '#FF00FF';
        ctx.beginPath();
        ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h);
        ctx.moveTo(0, h/2); ctx.lineTo(w, h/2);
        ctx.stroke();
        
        // 在中心点绘制更大的圆形标记
        ctx.fillStyle = '#FF00FF';
        const centerDotSize = baseLineWidth * 2.5;
        ctx.beginPath();
        ctx.arc(w/2, h/2, centerDotSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // 重置阴影和虚线设置
      ctx.shadowBlur = 0;
      ctx.setLineDash([]);
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
