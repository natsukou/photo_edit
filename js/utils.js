// 工具函数库

const Utils = {
  // 本地存储
  storage: {
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.error('存储失败:', e);
        return false;
      }
    },
    
    get(key, defaultValue = null) {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
      } catch (e) {
        console.error('读取失败:', e);
        return defaultValue;
      }
    },
    
    remove(key) {
      localStorage.removeItem(key);
    },
    
    clear() {
      localStorage.clear();
    }
  },
  
  // Toast提示
  toast(message, duration = 2000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: rgba(0, 0, 0, 0.8);
      color: #fff;
      padding: 12px 24px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 10000;
      animation: fadeIn 0.3s ease-in-out;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease-in-out';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, duration);
  },
  
  // 图片转Base64
  imageToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
  
  // 获取图片信息
  getImageInfo(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          src: src
        });
      };
      img.onerror = reject;
      img.src = src;
    });
  },
  
  // 下载图片（兼容微信小程序）
  downloadImage(canvas, filename = 'photo-guide.png') {
    try {
      // 检查是否在微信环境中
      const isWeChat = /micromessenger/i.test(navigator.userAgent);
      
      if (isWeChat) {
        // 微信环境：长按保存提示
        const dataURL = canvas.toDataURL('image/png');
        const img = new Image();
        img.src = dataURL;
        img.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          max-width: 90%;
          max-height: 90%;
          z-index: 10000;
          box-shadow: 0 0 20px rgba(0,0,0,0.5);
        `;
        
        const mask = document.createElement('div');
        mask.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        `;
        
        const tip = document.createElement('div');
        tip.textContent = '长按图片保存到相册';
        tip.style.cssText = `
          color: white;
          font-size: 16px;
          margin-top: 20px;
          padding: 12px 24px;
          background: rgba(0,0,0,0.6);
          border-radius: 4px;
        `;
        
        mask.appendChild(img);
        mask.appendChild(tip);
        document.body.appendChild(mask);
        
        // 点击遮罩关闭
        mask.addEventListener('click', () => {
          document.body.removeChild(mask);
        });
        
        this.toast('长按图片保存到相册');
      } else {
        // 普通浏览器：直接下载
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.toast('图片已保存');
      }
    } catch (error) {
      console.error('下载图片失败:', error);
      this.toast('保存失败，请重试');
    }
  },
  
  // URL参数解析
  getQueryParams() {
    const params = {};
    const search = window.location.search.substring(1);
    if (search) {
      search.split('&').forEach(param => {
        const [key, value] = param.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      });
    }
    return params;
  },
  
  // 格式化日期
  formatDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
};

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
  @keyframes fadeOut {
    from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    to { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
  }
`;
document.head.appendChild(style);
