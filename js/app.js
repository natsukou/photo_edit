// 全局应用状态
const App = {
  globalData: {
    remainingQuota: 20,
    currentImage: null,
    currentCategory: '',
    currentStyle: '',
    // 🔥 AI识别结果
    aiRecognizedCategory: null,
    aiRecognizedStyle: null,
    aiConfidence: null
  },
  
  async initUser() {
    // 尝试从服务器登录
    try {
      const user = await API.userLogin({
        nickname: '摄影爱好者'
      });
      console.log('用户登录成功:', user);
    } catch (error) {
      console.log('用户登录失败，使用本地模式');
    }
  },
  
  async loadQuota() {
    console.log('📊 开始加载配额...');
    
    // 检查是否需要重置每日配额
    const lastResetDate = Utils.storage.get('lastResetDate');
    const today = new Date().toDateString();
    
    console.log('  上次重置日期:', lastResetDate);
    console.log('  今天日期:', today);
    
    // 如果是新的一天，重置配额为20
    if (lastResetDate !== today) {
      console.log('🎉 检测到新的一天，重置配额为20');
      this.globalData.remainingQuota = 20;
      Utils.storage.set('remainingQuota', 20);
      Utils.storage.set('lastResetDate', today);
      
      // 尝试更新服务器端配额
      const user_id = Utils.storage.get('user_id');
      if (user_id) {
        try {
          await API._request('POST', `/users/${user_id}/reset-quota`);
          console.log('✅ 服务器配额重置成功');
        } catch (error) {
          console.log('⚠️ 服务器重置配额失败，使用本地重置');
        }
      }
      
      // 🔥 重置后刷新首页显示
      this.refreshQuotaDisplay();
      return;
    }
    
    // 先从本地存储加载配额（避免显示-1）
    const localQuota = Utils.storage.get('remainingQuota');
    console.log('  本地存储的配额:', localQuota);
    
    if (localQuota !== null && localQuota >= 0) {
      this.globalData.remainingQuota = localQuota;
    } else {
      // 首次使用，初始化为20
      console.log('📝 首次使用，初始化配额为20');
      this.globalData.remainingQuota = 20;
      Utils.storage.set('remainingQuota', 20);
      Utils.storage.set('lastResetDate', today);
    }
    
    // 尝试从服务器获取用户信息（异步同步）
    const user_id = Utils.storage.get('user_id');
    if (user_id) {
      try {
        const userInfo = await API.getUserInfo(user_id);
        if (userInfo && typeof userInfo.remaining_quota === 'number' && userInfo.remaining_quota >= 0) {
          console.log('✅ 从服务器同步配额:', userInfo.remaining_quota);
          this.globalData.remainingQuota = userInfo.remaining_quota;
          Utils.storage.set('remainingQuota', userInfo.remaining_quota);
          this.refreshQuotaDisplay();
        }
      } catch (error) {
        console.log('⚠️ 从服务器获取配额失败，使用本地配额');
      }
    }
    
    console.log('✅ 配额加载完成:', this.globalData.remainingQuota);
  },
  
  // 🔥 刷新首页的配额显示
  refreshQuotaDisplay() {
    const quotaValueEl = document.querySelector('.quota-value');
    if (quotaValueEl) {
      quotaValueEl.textContent = `${this.globalData.remainingQuota} 张`;
      console.log('🔄 已刷新页面配额显示:', this.globalData.remainingQuota);
    }
  },
  
  async consumeQuota() {
    const currentQuota = this.globalData.remainingQuota;
    console.log('🔍 开始消费配额，当前配额:', currentQuota);
    
    if (currentQuota <= 0) {
      console.warn('⚠️ 配额不足，无法消费');
      return false;
    }
    
    // 先本地扣减，确保配额立即减少
    this.globalData.remainingQuota = currentQuota - 1;
    Utils.storage.set('remainingQuota', this.globalData.remainingQuota);
    console.log('✅ 本地配额已扣减:', this.globalData.remainingQuota);
    
    // 尝试同步到服务器（失败不影响本地配额）
    const user_id = Utils.storage.get('user_id');
    if (user_id) {
      try {
        const result = await API.consumeQuota(user_id);
        // 如果服务器返回的配额有效，使用服务器的数据
        if (result && typeof result.remaining_quota === 'number' && result.remaining_quota >= 0) {
          this.globalData.remainingQuota = result.remaining_quota;
          Utils.storage.set('remainingQuota', result.remaining_quota);
          console.log('✅ 同步服务器配额成功:', result.remaining_quota);
        }
      } catch (error) {
        console.log('⚠️ 服务器同步失败，使用本地配额');
      }
    }
    
    return true;
  },
  
  getRemainingQuota() {
    return this.globalData.remainingQuota;
  },
  
  // 🔥 刷新首页的配额显示
  refreshQuotaDisplay() {
    const quotaValueEl = document.querySelector('.quota-value');
    if (quotaValueEl) {
      quotaValueEl.textContent = `${this.globalData.remainingQuota} 张`;
      console.log('🔄 已刷新页面配额显示:', this.globalData.remainingQuota);
    }
  }
};

// 页面初始化
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 App初始化...');
  
  // 初始化用户
  await App.initUser();
  
  // 加载配额（会自动检查日期并重置）
  await App.loadQuota();
  
  console.log('✅ 应用初始化完成');
  console.log('  当前配额:', App.globalData.remainingQuota);
  console.log('  上次重置日期:', Utils.storage.get('lastResetDate'));
  
  // 注册路由
  Router.register('index', IndexPage.render);
  Router.register('upload', UploadPage.render);
  Router.register('style-select', StyleSelectPage.render);
  Router.register('result', ResultPage.render);
  
  Router.init();
});
