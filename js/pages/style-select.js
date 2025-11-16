// 风格选择页面
const StyleSelectPage = {
  categories: ['人像摄影', '风光摄影', '建筑摄影', '宠物摄影', '美食摄影', '街拍摄影', '产品摄影', '静物摄影', '花卉摄影', '夜景摄影'],
  styles: ['日系小清新', '复古港风', '电影感', '胶片风', 'INS风', '暗黑系', '高级感', '莫兰迪色', '赛博朋克', '油画质感', '工业风', '文艺范', '少女感', '性冷淡风', '杂志大片', '纪实风格', '极简主义', '温暖治愈', '清冷高级', '国风古韵'],
  selectedCategory: '',
  selectedStyles: [],
  
  render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="page" data-page="style-select">
        <div class="accent-bar">
          ${['olive', 'gray-green', 'light-yellow', 'light-brown', 'slate', 'terracotta', 'mint'].map(color => 
            `<div class="accent-bar-segment" style="background-color: var(--color-${color});"></div>`
          ).join('')}
        </div>
        
        <div class="container style-select-container">
          ${App.globalData.currentImage ? `<img src="${App.globalData.currentImage}" class="small-preview" alt="预览">` : ''}
          
          <div class="section category-section">
            <h2 class="section-title">📸 选择题材</h2>
            <p class="section-desc">选择照片的拍摄题材</p>
            <div class="tag-list" id="categoryList"></div>
          </div>
          
          <div class="section style-section">
            <h2 class="section-title">🎨 选择风格</h2>
            <p class="section-desc">可多选，最多选择3个</p>
            <div class="tag-list" id="styleList"></div>
          </div>
          
          <div class="section">
            <h2 class="section-title">✍️ 自定义描述（可选）</h2>
            <p class="section-desc">例如：偏电影感的复古港风</p>
            <textarea id="customDesc" class="custom-input" placeholder="输入您想要的照片效果..." maxlength="100"></textarea>
            <div class="char-count"><span id="charCount">0</span>/100</div>
          </div>
          
          <div class="action-section">
            <button class="btn" id="confirmBtn">确认选择</button>
          </div>
        </div>
      </div>
    `;
    
    document.querySelector('[data-page="style-select"]').classList.remove('hidden');
    
    // 等待DOM渲染完成再填充标签（直接调用StyleSelectPage对象的方法）
    setTimeout(function() {
      StyleSelectPage.renderTags();
      
      const customDescEl = document.getElementById('customDesc');
      if (customDescEl) {
        customDescEl.addEventListener('input', (e) => {
          document.getElementById('charCount').textContent = e.target.value.length;
        });
      }
      
      // 绑定确认按钮事件
      const confirmBtn = document.getElementById('confirmBtn');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
          StyleSelectPage.confirm();
        });
        
        // 添加触摸事件支持
        confirmBtn.addEventListener('touchend', (e) => {
          e.preventDefault();
          StyleSelectPage.confirm();
        });
      }
    }, 10);
  },
  
  renderTags() {
    console.log('renderTags 开始执行');
    const categoryList = document.getElementById('categoryList');
    const styleList = document.getElementById('styleList');
    
    console.log('categoryList:', categoryList);
    console.log('styleList:', styleList);
    
    if (!categoryList || !styleList) {
      console.error('找不到标签容器！');
      return;
    }
    
    // 🔥 自动填充AI识别的结果
    if (App.globalData.aiRecognizedCategory && !this.selectedCategory) {
      this.selectedCategory = App.globalData.aiRecognizedCategory;
      console.log('✅ 自动选择AI识别的题材:', this.selectedCategory);
    }
    if (App.globalData.aiRecognizedStyle && this.selectedStyles.length === 0) {
      this.selectedStyles = [App.globalData.aiRecognizedStyle];
      console.log('✅ 自动选择AI识别的风格:', this.selectedStyles);
    }
    
    console.log('题材数量:', this.categories.length, '风格数量:', this.styles.length);
    
    // 渲染题材标签（不使用onclick，改用事件委托）
    const categoryHTML = this.categories.map(cat => 
      `<span class="tag ${this.selectedCategory === cat ? 'active' : ''}" data-category="${cat}">${cat}</span>`
    ).join('');
    
    // 渲染风格标签（不使用onclick，改用事件委托）
    const styleHTML = this.styles.map(style => 
      `<span class="tag ${this.selectedStyles.includes(style) ? 'active' : ''}" data-style="${style}">${style}</span>`
    ).join('');
    
    categoryList.innerHTML = categoryHTML;
    styleList.innerHTML = styleHTML;
    
    console.log('标签渲染完成 - 题材:', categoryList.children.length, '风格:', styleList.children.length);
    
    // 使用事件委托绑定点击事件（微信小程序兼容）
    this.bindTagEvents();
  },
  
  bindTagEvents() {
    const categoryList = document.getElementById('categoryList');
    const styleList = document.getElementById('styleList');
    
    if (categoryList) {
      // 移除旧的事件监听（如果有）
      categoryList.replaceWith(categoryList.cloneNode(true));
      const newCategoryList = document.getElementById('categoryList');
      
      newCategoryList.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag')) {
          const category = e.target.getAttribute('data-category');
          if (category) {
            this.selectCategory(category);
          }
        }
      });
      
      // 添加触摸事件支持（移动端）
      newCategoryList.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (e.target.classList.contains('tag')) {
          const category = e.target.getAttribute('data-category');
          if (category) {
            this.selectCategory(category);
          }
        }
      });
    }
    
    if (styleList) {
      // 移除旧的事件监听（如果有）
      styleList.replaceWith(styleList.cloneNode(true));
      const newStyleList = document.getElementById('styleList');
      
      newStyleList.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag')) {
          const style = e.target.getAttribute('data-style');
          if (style) {
            this.selectStyle(style);
          }
        }
      });
      
      // 添加触摸事件支持（移动端）
      newStyleList.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (e.target.classList.contains('tag')) {
          const style = e.target.getAttribute('data-style');
          if (style) {
            this.selectStyle(style);
          }
        }
      });
    }
  },
  
  selectCategory(category) {
    this.selectedCategory = category;
    this.renderTags();
  },
  
  selectStyle(style) {
    const index = this.selectedStyles.indexOf(style);
    if (index > -1) {
      this.selectedStyles.splice(index, 1);
    } else {
      if (this.selectedStyles.length >= 3) {
        Utils.toast('最多选择3个风格');
        return;
      }
      this.selectedStyles.push(style);
    }
    this.renderTags();
  },
  
  confirm() {
    if (!this.selectedCategory) {
      Utils.toast('请选择题材');
      return;
    }
    
    if (this.selectedStyles.length === 0 && !document.getElementById('customDesc').value) {
      Utils.toast('请选择风格或输入自定义描述');
      return;
    }
    
    let styleDesc = this.selectedStyles.join(' + ');
    const customDesc = document.getElementById('customDesc').value;
    if (customDesc) {
      styleDesc = styleDesc ? `${styleDesc}，${customDesc}` : customDesc;
    }
    
    App.globalData.currentCategory = this.selectedCategory;
    App.globalData.currentStyle = styleDesc;
    
    Router.navigate('result');
  }
};
