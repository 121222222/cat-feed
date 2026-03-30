const db = require('../../utils/db.js');

Page({
  data: {
    agreed: false
  },

  // 登录
  async onLogin() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先同意用户协议和隐私政策', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '登录中...' });
    const app = getApp();
    
    try {
      // 检查是否已有账号（通过 openid 自动匹配）
      const existUser = await db.getCurrentUser();
      
      if (existUser) {
        // 已有账号，直接登录
        app.globalData.isLoggedIn = true;
        app.globalData.userInfo = existUser;
        wx.setStorageSync('isLoggedIn', true);
        
        wx.hideLoading();
        wx.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => {
          wx.switchTab({ url: '/pages/index/index' });
        }, 1000);
      } else {
        // 没有账号，跳转到注册页面
        wx.hideLoading();
        wx.showModal({
          title: '提示',
          content: '您还没有账号，请先注册',
          confirmText: '去注册',
          confirmColor: '#FFBAA3',
          success: (res) => {
            if (res.confirm) {
              wx.navigateTo({ url: '/pages/register/register' });
            }
          }
        });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('登录失败:', err);
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    }
  },

  // 注册
  onRegister() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先同意用户协议和隐私政策', icon: 'none' });
      return;
    }

    // 跳转到注册页面
    wx.navigateTo({ url: '/pages/register/register' });
  },

  // 跳转管理员登录
  goAdminLogin() {
    wx.navigateTo({
      url: '/pages/admin-login/admin-login'
    });
  },

  // 切换协议勾选
  toggleAgreement() {
    this.setData({ agreed: !this.data.agreed });
  },

  // 查看用户协议
  showUserAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '喵邻帮用户服务协议内容...',
      showCancel: false,
      confirmColor: '#FFBAA3'
    });
  },

  // 查看隐私政策
  showPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '喵邻帮隐私保护政策内容...',
      showCancel: false,
      confirmColor: '#FFBAA3'
    });
  }
});
