const app = getApp();

Page({
  data: {
    certified: true
  },

  onLoad() {
    this.setData({ certified: app.globalData.mockUser.certified });
  },

  onSubmit() {
    wx.showModal({
      title: '提交认证',
      content: '认证信息提交后将由管理员审核，预计1-3个工作日内完成',
      confirmColor: '#FF8C42',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '提交成功，请等待审核', icon: 'none' });
        }
      }
    });
  }
});
