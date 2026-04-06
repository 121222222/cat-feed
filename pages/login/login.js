const db = require('../../utils/db.js');

Page({
  data: {
    agreed: false
  },

  // 微信授权登录
  async onLogin() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先同意用户协议和隐私政策', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '登录中...' });
    const app = getApp();

    try {
      console.log('开始微信登录...');
      
      // 第一步：调用 wx.login 获取 code
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        });
      });

      console.log('wx.login结果:', loginRes);

      if (!loginRes.code) {
        throw new Error('微信登录失败，未获取到code');
      }

      // 第二步：调用云函数获取 openid
      console.log('开始调用云函数getOpenId...');
      
      const cloudRes = await wx.cloud.callFunction({
        name: 'getOpenId',
        data: {}
      });

      console.log('云函数返回:', cloudRes);

      if (!cloudRes.result || !cloudRes.result.openid) {
        throw new Error('云函数返回异常，请确保已部署getOpenId云函数');
      }

      const openid = cloudRes.result.openid;
      console.log('获取到openid:', openid);

      // 第三步：根据 openid 查找用户
      const existUser = await db.getUserByOpenId(openid);
      console.log('查询用户结果:', existUser);

      if (existUser) {
        // 已有账号，直接登录
        app.globalData.isLoggedIn = true;
        app.globalData.userInfo = existUser;
        wx.setStorageSync('isLoggedIn', true);
        wx.setStorageSync('userInfo', existUser);

        wx.hideLoading();
        wx.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => {
          // 返回上一页，如果没有上一页则跳转首页
          const pages = getCurrentPages();
          if (pages.length > 1) {
            wx.navigateBack();
          } else {
            wx.switchTab({ url: '/pages/index/index' });
          }
        }, 1000);
      } else {
        // 没有账号，将 openid 存入缓存，跳转注册页
        wx.setStorageSync('wxUserInfo', {
          openid: openid
        });
        
        wx.hideLoading();
        wx.showModal({
          title: '提示',
          content: '该微信账号未注册，请先完善信息注册账号',
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
      
      // 显示更详细的错误信息
      let errMsg = '登录失败';
      if (err.errMsg) {
        if (err.errMsg.includes('cloud function not found')) {
          errMsg = '请先部署getOpenId云函数';
        } else {
          errMsg = err.errMsg;
        }
      } else if (err.message) {
        errMsg = err.message;
      }
      
      wx.showModal({
        title: '登录失败',
        content: errMsg,
        showCancel: false,
        confirmColor: '#FFBAA3'
      });
    }
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
