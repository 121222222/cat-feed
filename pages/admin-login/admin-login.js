const app = getApp();

// 管理员账号配置
const ADMIN_ACCOUNTS = [
  { phone: '15820430351', password: 'admin070025' }
];

Page({
  data: {
    adminPhone: '',
    adminPassword: '',
    showPassword: false
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

  onAdminLogin() {
    const { adminPhone, adminPassword } = this.data;

    if (!adminPhone || adminPhone.length !== 11) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    if (!adminPassword) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }

    // 验证管理员账号
    const admin = ADMIN_ACCOUNTS.find(a => a.phone === adminPhone && a.password === adminPassword);

    if (!admin) {
      wx.showToast({ title: '账号或密码错误', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '登录中...', mask: true });

    // 登录成功，设置管理员信息
    setTimeout(() => {
      app.globalData.userInfo = {
        name: '管理员',
        avatar: '',
        phone: adminPhone,
        isAdmin: true,
        certified: true
      };
      app.globalData.isLogin = true;

      wx.hideLoading();
      wx.showToast({ title: '登录成功', icon: 'success' });

      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/admin/admin'
        });
      }, 1000);
    }, 500);
  },

  goBack() {
    wx.navigateBack();
  }
});
