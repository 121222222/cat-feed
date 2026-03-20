Page({
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      confirmColor: '#FF4D4F',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '已退出', icon: 'success' });
        }
      }
    });
  }
});
