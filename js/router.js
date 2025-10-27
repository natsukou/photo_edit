// 简单的路由系统

const Router = {
  routes: {},
  currentPage: null,
  
  // 注册路由
  register(path, handler) {
    this.routes[path] = handler;
  },
  
  // 导航到指定页面
  navigate(path, params = {}) {
    if (this.routes[path]) {
      // 隐藏当前页面
      if (this.currentPage) {
        const currentEl = document.querySelector(`[data-page="${this.currentPage}"]`);
        if (currentEl) currentEl.classList.add('hidden');
      }
      
      // 显示新页面
      this.currentPage = path;
      this.routes[path](params);
      
      // 更新URL（不刷新页面）
      const query = Object.keys(params).map(k => `${k}=${encodeURIComponent(params[k])}`).join('&');
      const url = query ? `?page=${path}&${query}` : `?page=${path}`;
      window.history.pushState({ path, params }, '', url);
      
      // 滚动到顶部
      window.scrollTo(0, 0);
    } else {
      console.error('路由不存在:', path);
    }
  },
  
  // 返回上一页
  back() {
    window.history.back();
  },
  
  // 重新加载到指定页面
  reLaunch(path, params = {}) {
    // 清空历史记录并导航
    window.history.replaceState({ path, params }, '', `?page=${path}`);
    this.navigate(path, params);
  },
  
  // 初始化路由
  init() {
    // 监听浏览器前进后退
    window.addEventListener('popstate', (e) => {
      if (e.state) {
        this.navigate(e.state.path, e.state.params);
      }
    });
    
    // 检查URL参数
    const params = Utils.getQueryParams();
    const initialPage = params.page || 'index';
    delete params.page;
    
    this.navigate(initialPage, params);
  }
};
