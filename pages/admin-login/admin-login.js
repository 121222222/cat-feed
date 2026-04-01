const app = getApp();

Page({
  data: {
    adminPhone: '',
    adminPassword: '',
    showPassword: false,
    isLoading: false
  },

  onPhoneInput(e) {
    this.setData({ adminPhone: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ adminPassword: e.detail.value });
  },

  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword });
  },

  async onAdminLogin() {
    const { adminPhone, adminPassword, isLoading } = this.data;

    if (isLoading) return;

    if (!adminPhone || adminPhone.length !== 11) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    if (!adminPassword) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }

    this.setData({ isLoading: true });
    wx.showLoading({ title: '登录中...', mask: true });

    try {
      // 调用云函数验证管理员账号
      const result = await wx.cloud.callFunction({
        name: 'adminLogin',
        data: {
          phone: adminPhone,
          password: adminPassword
        }
      });

      wx.hideLoading();
      this.setData({ isLoading: false });

      if (result.result && result.result.success) {
        // 登录成功，保存 token
        wx.setStorageSync('adminToken', result.result.token);
        wx.setStorageSync('adminTokenExpire', result.result.expireTime);
        
        app.globalData.userInfo = {
          name: '管理员',
          avatar: '',
          phone: adminPhone,
          isAdmin: true,
          certified: true
        };
        app.globalData.isLogin = true;

        wx.showToast({ title: '登录成功', icon: 'success' });

        setTimeout(() => {
          wx.redirectTo({
            url: '/pages/admin/admin'
          });
        }, 1000);
      } else {
        wx.showToast({ 
          title: (result.result && result.result.error) || '账号或密码错误', 
          icon: 'none' 
        });
      }
    } catch (err) {
      wx.hideLoading();
      this.setData({ isLoading: false });
      console.error('管理员登录失败:', err);
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    }
  },

  goBack() {
    wx.navigateBack();
  }
});
