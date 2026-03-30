const db = require('../../utils/db.js');

Page({
  data: {
    agreed: false,
    showPhoneLogin: false,
    phone: '',
    verifyCode: '',
    countdown: 0,
    timer: null,
    mockCode: '' // 模拟验证码（测试用）
  },

  onUnload() {
    // 清理定时器
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
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
          wx.switchTab({ url: '/pages/index/index' });
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

  // 显示手机号登录弹窗
  showPhoneLoginPopup() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先同意用户协议和隐私政策', icon: 'none' });
      return;
    }
    this.setData({ showPhoneLogin: true });
  },

  // 隐藏手机号登录弹窗
  hidePhoneLogin() {
    this.setData({ 
      showPhoneLogin: false,
      phone: '',
      verifyCode: ''
    });
  },

  // 输入手机号
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  // 输入验证码
  onCodeInput(e) {
    this.setData({ verifyCode: e.detail.value });
  },

  // 发送验证码
  sendVerifyCode() {
    const phone = this.data.phone.trim();
    if (!phone || phone.length !== 11) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    if (this.data.countdown > 0) return;

    // 生成4位随机验证码（测试用，实际项目应调用短信服务）
    const mockCode = String(Math.floor(1000 + Math.random() * 9000));
    this.setData({ mockCode });
    
    // 显示验证码（测试用，正式环境删除此提示）
    wx.showModal({
      title: '测试验证码',
      content: `您的验证码是：${mockCode}\n（正式环境将通过短信发送）`,
      showCancel: false,
      confirmColor: '#FFBAA3'
    });
    
    // 开始倒计时
    this.setData({ countdown: 60 });
    const timer = setInterval(() => {
      if (this.data.countdown <= 1) {
        clearInterval(timer);
        this.setData({ countdown: 0, timer: null });
      } else {
        this.setData({ countdown: this.data.countdown - 1 });
      }
    }, 1000);
    this.setData({ timer });
  },

  // 手机号登录
  async phoneLogin() {
    const phone = this.data.phone.trim();
    const code = this.data.verifyCode.trim();

    if (!phone || phone.length !== 11) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    if (!code || code.length < 4) {
      wx.showToast({ title: '请输入验证码', icon: 'none' });
      return;
    }

    // 验证验证码（测试用模拟验证码）
    if (code !== this.data.mockCode) {
      wx.showToast({ title: '验证码错误', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '登录中...' });
    const app = getApp();
    
    try {
      // 根据手机号查找用户
      const existUser = await db.getUserByPhone(phone);
      
      if (existUser) {
        // 已有账号，直接登录
        app.globalData.isLoggedIn = true;
        app.globalData.userInfo = existUser;
        wx.setStorageSync('isLoggedIn', true);
        wx.setStorageSync('userInfo', existUser);
        
        wx.hideLoading();
        this.setData({ showPhoneLogin: false, mockCode: '' });
        wx.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => {
          wx.switchTab({ url: '/pages/index/index' });
        }, 1000);
      } else {
        // 没有账号，提示注册
        wx.hideLoading();
        wx.showModal({
          title: '提示',
          content: '该手机号未注册，请先注册账号',
          confirmText: '去注册',
          confirmColor: '#FFBAA3',
          success: (res) => {
            if (res.confirm) {
              this.setData({ showPhoneLogin: false, mockCode: '' });
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
