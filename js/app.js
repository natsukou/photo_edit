// 全局应用状态
const App = {
  globalData: {
    remainingQuota: 20,
    currentImage: null,
    currentCategory: '',
    currentStyle: ''
  },
  
  loadQuota() {
    const quota = Utils.storage.get('remainingQuota');
    if (quota !== null) {
      this.globalData.remainingQuota = quota;
    } else {
      this.globalData.remainingQuota = 20;
      Utils.storage.set('remainingQuota', 20);
    }
  },
  
  consumeQuota() {
    if (this.globalData.remainingQuota > 0) {
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
document.addEventListener('DOMContentLoaded', () => {
  console.log('App初始化...');
  App.loadQuota();
  
  Router.register('index', IndexPage.render);
  Router.register('upload', UploadPage.render);
  Router.register('style-select', StyleSelectPage.render);
  Router.register('result', ResultPage.render);
  
  Router.init();
});
