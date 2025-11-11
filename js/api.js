// API 基础配置
const API_CONFIG = {
  // 生产环境使用API网关HTTPS地址，本地开发使用localhost
  baseURL: (function() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    console.log('当前域名:', hostname);
    console.log('当前协议:', protocol);
    console.log('是否包含modelscope:', hostname.includes('modelscope'));
    
    // ModelScope环境使用阿里云API网关HTTPS地址
    if (hostname.includes('modelscope') || hostname.includes('dsw-') || hostname.includes('.ms.show')) {
      console.log('✅ 使用API网关HTTPS地址');
      return 'https://b6cb40828efb4332baaef3da54b96514-cn-shanghai.alicloudapi.com/api';
    }
    
    // 非localhost环境使用ECS HTTP地址（如其他测试环境）
    if (hostname !== 'localhost') {
      console.log('使用ECS后端地址: http://139.224.199.2:3000/api');
      return 'http://139.224.199.2:3000/api';
    }
    
    console.log('使用本地后端地址: http://localhost:3000/api');
    return 'http://localhost:3000/api';
  })(),
  timeout: 30000  // 增加超时时间到30秒，因为AI识别需要较长时间
};

// API 工具类
const API = {
  // ============================================
  // 用户相关 API
  // ============================================
  
  /**
   * 用户登录/注册
   */
  async userLogin(userData) {
    const deviceInfo = this._getDeviceInfo();
    const payload = {
      user_id: Utils.storage.get('user_id'),
      nickname: userData.nickname || '摄影爱好者',
      avatar_url: userData.avatar_url || '',
      source: 'h5',
      device_info: deviceInfo
    };

    try {
      const response = await this._request('POST', '/users/login', payload);
      if (response.code === 0) {
        // 保存用户信息
        Utils.storage.set('user_id', response.data.user_id);
        Utils.storage.set('remainingQuota', response.data.remaining_quota);
        return response.data;
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('用户登录失败:', error);
      // 降级到本地存储
      return this._fallbackUserLogin();
    }
  },

  /**
   * 获取用户信息
   */
  async getUserInfo(user_id) {
    try {
      const response = await this._request('GET', `/users/${user_id}`);
      if (response.code === 0) {
        return response.data;
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  },

  /**
   * 消费配额
   */
  async consumeQuota(user_id) {
    try {
      const response = await this._request('POST', `/users/${user_id}/consume-quota`);
      if (response.code === 0) {
        Utils.storage.set('remainingQuota', response.data.remaining_quota);
        return response.data;
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('消费配额失败:', error);
      // 降级到本地扣减
      const quota = App.getRemainingQuota();
      App.consumeQuota();
      return { remaining_quota: quota - 1 };
    }
  },

  // ============================================
  // 照片相关 API
  // ============================================

  /**
   * 创建照片记录
   */
  async createPhotoRecord(photoData) {
    const user_id = Utils.storage.get('user_id');
    const payload = {
      user_id,
      photo_url: photoData.photo_url || '',
      photo_size: photoData.photo_size || 0,
      photo_width: photoData.photo_width || 0,
      photo_height: photoData.photo_height || 0,
      category: photoData.category || '',
      style: photoData.style || '',
      custom_description: photoData.custom_description || ''
    };

    try {
      const response = await this._request('POST', '/photos', payload);
      if (response.code === 0) {
        // 保存photo_id到本地
        Utils.storage.set('current_photo_id', response.data.photo_id);
        return response.data;
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('创建照片记录失败:', error);
      return { photo_id: Date.now() }; // 降级方案
    }
  },

  /**
   * 记录辅助线使用
   */
  async recordGuideUsage(guideData) {
    const user_id = Utils.storage.get('user_id');
    const photo_id = Utils.storage.get('current_photo_id');
    
    if (!photo_id) return;

    const payload = {
      user_id,
      ...guideData
    };

    try {
      const response = await this._request('POST', `/photos/${photo_id}/guide-usage`, payload);
      return response.data;
    } catch (error) {
      console.error('记录辅助线使用失败:', error);
    }
  },

  /**
   * 更新下载状态
   */
  async recordDownload() {
    const user_id = Utils.storage.get('user_id');
    const photo_id = Utils.storage.get('current_photo_id');
    
    if (!photo_id) return;

    try {
      await this._request('POST', `/photos/${photo_id}/download`, { user_id });
    } catch (error) {
      console.error('记录下载失败:', error);
    }
  },

  /**
   * 获取热门题材和风格
   */
  async getPopularStyles() {
    try {
      const response = await this._request('GET', '/photos/popular?limit=20');
      if (response.code === 0) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('获取热门题材失败:', error);
      return [];
    }
  },

  // ============================================
  // 分析相关 API
  // ============================================

  /**
   * 记录页面访问
   */
  async recordPageView(pageData) {
    const user_id = Utils.storage.get('user_id');
    const session_id = this._getSessionId();
    const deviceInfo = this._getDeviceInfo();

    const payload = {
      user_id,
      session_id,
      page_name: pageData.page_name,
      previous_page: pageData.previous_page || '',
      duration: pageData.duration || 0,
      device_type: deviceInfo.device_type,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      screen_resolution: deviceInfo.screen_resolution,
      referrer: document.referrer
    };

    try {
      await this._request('POST', '/analytics/page-view', payload);
    } catch (error) {
      console.error('记录页面访问失败:', error);
    }
  },

  /**
   * 记录用户事件
   */
  async recordEvent(eventData) {
    const user_id = Utils.storage.get('user_id');
    const session_id = this._getSessionId();
    const currentPage = Router.currentPage || 'index';

    const payload = {
      user_id,
      session_id,
      event_type: eventData.event_type,
      event_target: eventData.event_target || '',
      event_data: eventData.event_data || {},
      page_name: currentPage
    };

    try {
      await this._request('POST', '/analytics/event', payload);
    } catch (error) {
      console.error('记录用户事件失败:', error);
    }
  },

  // ============================================
  // 反馈相关 API
  // ============================================

  /**
   * 提交反馈
   */
  async submitFeedback(feedbackData) {
    const user_id = Utils.storage.get('user_id');
    const photo_id = Utils.storage.get('current_photo_id');

    const payload = {
      user_id,
      photo_id: photo_id || null,
      feedback_type: feedbackData.feedback_type || 'suggestion',
      rating: feedbackData.rating || 5,
      content: feedbackData.content,
      contact: feedbackData.contact || ''
    };

    try {
      const response = await this._request('POST', '/feedback', payload);
      return response.code === 0;
    } catch (error) {
      console.error('提交反馈失败:', error);
      return false;
    }
  },

  // ============================================
  // 辅助方法
  // ============================================

  /**
   * 发送HTTP请求
   */
  async _request(method, url, data = null) {
    const fullUrl = `${API_CONFIG.baseURL}${url}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      if (method === 'GET') {
        const params = new URLSearchParams(data);
        fullUrl = `${fullUrl}?${params}`;
      } else {
        options.body = JSON.stringify(data);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    options.signal = controller.signal;

    try {
      const response = await fetch(fullUrl, options);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('请求超时');
      }
      throw error;
    }
  },

  /**
   * 获取或创建Session ID
   */
  _getSessionId() {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  },

  /**
   * 获取设备信息
   */
  _getDeviceInfo() {
    const ua = navigator.userAgent;
    return {
      device_type: this._getDeviceType(),
      browser: this._getBrowser(ua),
      os: this._getOS(ua),
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      user_agent: ua
    };
  },

  _getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  },

  _getBrowser(ua) {
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('MSIE') || ua.includes('Trident')) return 'IE';
    return 'Unknown';
  },

  _getOS(ua) {
    if (ua.includes('Win')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Unknown';
  },

  /**
   * 降级方案：本地用户登录
   */
  _fallbackUserLogin() {
    let user_id = Utils.storage.get('user_id');
    if (!user_id) {
      user_id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      Utils.storage.set('user_id', user_id);
    }
    
    let quota = Utils.storage.get('remainingQuota');
    if (quota === null) {
      quota = 20;
      Utils.storage.set('remainingQuota', quota);
    }

    return {
      user_id,
      nickname: '摄影爱好者',
      total_quota: 50,
      used_quota: 50 - quota,
      remaining_quota: quota
    };
  }
};

// 页面可见性变化时记录页面停留时长
let pageEnterTime = Date.now();
let previousPage = '';

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    const duration = Math.floor((Date.now() - pageEnterTime) / 1000);
    const currentPage = Router.currentPage || 'index';
    
    API.recordPageView({
      page_name: currentPage,
      previous_page: previousPage,
      duration
    });
  } else {
    pageEnterTime = Date.now();
  }
});

// 页面卸载时记录
window.addEventListener('beforeunload', () => {
  const duration = Math.floor((Date.now() - pageEnterTime) / 1000);
  const currentPage = Router.currentPage || 'index';
  
  // 使用 sendBeacon 确保数据发送
  const data = JSON.stringify({
    user_id: Utils.storage.get('user_id'),
    session_id: API._getSessionId(),
    page_name: currentPage,
    previous_page: previousPage,
    duration,
    ...API._getDeviceInfo()
  });
  
  navigator.sendBeacon(`${API_CONFIG.baseURL}/analytics/page-view`, data);
});
