App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-9gefok5210204284',
        traceUser: true
      });
    }

    // 检查登录状态
    const isLoggedIn = wx.getStorageSync('isLoggedIn');
    if (isLoggedIn) {
      this.globalData.isLoggedIn = true;
      // 从云数据库加载用户信息
      this.loadUserFromCloud();
    }
  },

  globalData: {
    userInfo: null,
    isLoggedIn: false,
    baseUrl: 'https://api.example.com'
  },

  /** 从云数据库加载当前用户信息 */
  async loadUserFromCloud() {
    const db = require('./utils/db.js');
    const user = await db.getCurrentUser();
    if (user) {
      this.globalData.userInfo = user;
    }
  },

  // 检查登录状态，未登录则跳转登录页
  checkLogin() {
    if (!this.globalData.isLoggedIn) {
      wx.redirectTo({ url: '/pages/login/login' });
      return false;
    }
    return true;
  },

  // 登录成功后调用
  async loginSuccess(userInfo) {
    const db = require('./utils/db.js');
    // 尝试获取已有用户
    let user = await db.getCurrentUser();
    if (!user) {
      // 新用户，创建记录
      user = await db.createUser(userInfo || {
        name: '新用户',
        avatar: '',
        dormitory: '',
        phone: '',
        certified: false,
        catExperience: ''
      });
    }
    this.globalData.isLoggedIn = true;
    this.globalData.userInfo = user;
    wx.setStorageSync('isLoggedIn', true);
  }
});
