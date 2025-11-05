// 全局应用状态
const App = {
  globalData: {
    remainingQuota: 20,
    currentImage: null,
    currentCategory: '',
    currentStyle: ''
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
    // 检查是否需要重置每日配额
    const lastResetDate = Utils.storage.get('lastResetDate');
    const today = new Date().toDateString();
    
    // 如果是新的一天，重置配额为20
    if (lastResetDate !== today) {
      console.log('新的一天，重置配额为20');
      this.globalData.remainingQuota = 20;
      Utils.storage.set('remainingQuota', 20);
      Utils.storage.set('lastResetDate', today);
      
      // 尝试更新服务器端配额
      const user_id = Utils.storage.get('user_id');
      if (user_id) {
        try {
          await API._request('POST', `/users/${user_id}/reset-quota`);
        } catch (error) {
          console.log('服务器重置配额失败，使用本地重置');
        }
      }
      return;
    }
    
    // 尝试从服务器获取用户信息
    const user_id = Utils.storage.get('user_id');
    if (user_id) {
      try {
        const userInfo = await API.getUserInfo(user_id);
        if (userInfo) {
          this.globalData.remainingQuota = userInfo.remaining_quota;
          Utils.storage.set('remainingQuota', userInfo.remaining_quota);
          return;
        }
      } catch (error) {
        console.log('从服务器获取配额失败，使用本地配额');
      }
    }
    
    // 降级到本地存储
    const quota = Utils.storage.get('remainingQuota');
    if (quota !== null) {
      this.globalData.remainingQuota = quota;
    } else {
      this.globalData.remainingQuota = 20;
      Utils.storage.set('remainingQuota', 20);
      Utils.storage.set('lastResetDate', today);
    }
  },
  
  async consumeQuota() {
    if (this.globalData.remainingQuota > 0) {
      // 尝试从服务器消费配额
      const user_id = Utils.storage.get('user_id');
      if (user_id) {
        try {
          const result = await API.consumeQuota(user_id);
          this.globalData.remainingQuota = result.remaining_quota;
          Utils.storage.set('remainingQuota', result.remaining_quota);
          return true;
        } catch (error) {
          console.log('服务器消费配额失败，使用本地配额');
        }
      }
      
      // 降级到本地扣减
      this.globalData.remainingQuota--;
      Utils.storage.set('remainingQuota', this.globalData.remainingQuota);
      return true;
    }
    return false;
  },
  
  getRemainingQuota() {
    return this.globalData.remainingQuota;
  }
};

// 页面初始化
document.addEventListener('DOMContentLoaded', async () => {
  console.log('App初始化...');
  
  // 初始化用户
  await App.initUser();
  
  // 加载配额
  await App.loadQuota();
  
  // 注册路由
  Router.register('index', IndexPage.render);
  Router.register('upload', UploadPage.render);
  Router.register('style-select', StyleSelectPage.render);
  Router.register('result', ResultPage.render);
  
  Router.init();
});
