Page({
  data: {
    phone: '',
    code: '',
    showCodeInput: false,
    codeCooldown: 0,
    agreed: false
  },

  onPhoneInput(e) {
    const phone = e.detail.value;
    this.setData({
      phone,
      showCodeInput: phone.length === 11
    });
  },

  onCodeInput(e) {
    this.setData({ code: e.detail.value });
  },

  // 发送验证码
  sendCode() {
    if (this.data.codeCooldown > 0) return;
    if (this.data.phone.length !== 11) {
      wx.showToast({ title: '请输入正确手机号', icon: 'none' });
      return;
    }

    wx.showToast({ title: '验证码已发送', icon: 'success' });

    this.setData({ codeCooldown: 60 });
    const timer = setInterval(() => {
      if (this.data.codeCooldown <= 1) {
        clearInterval(timer);
        this.setData({ codeCooldown: 0 });
      } else {
        this.setData({ codeCooldown: this.data.codeCooldown - 1 });
      }
    }, 1000);
  },

  // 微信登录
  async onWechatLogin(e) {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先同意用户协议和隐私政策', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '登录中...' });
    const app = getApp();
    
    try {
      await app.loginSuccess({
        name: '微信用户',
        avatar: '',
        dormitory: '',
        phone: '',
        certified: false,
        catExperience: ''
      });
      wx.hideLoading();
      wx.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 1000);
    } catch (err) {
      wx.hideLoading();
      console.error('登录失败:', err);
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    }
  },

  // 手机号登录
  async onPhoneLogin() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先同意用户协议和隐私政策', icon: 'none' });
      return;
    }
    if (!this.data.phone || this.data.phone.length !== 11) {
      wx.showToast({ title: '请输入正确手机号', icon: 'none' });
      return;
    }
    if (!this.data.code || this.data.code.length < 4) {
      wx.showToast({ title: '请输入验证码', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '登录中...' });
    const app = getApp();

    try {
      await app.loginSuccess({
        name: '用户',
        avatar: '',
        dormitory: '',
        phone: this.data.phone,
        certified: false,
        catExperience: ''
      });
      wx.hideLoading();
      wx.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 1000);
    } catch (err) {
      wx.hideLoading();
      console.error('登录失败:', err);
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    }
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
