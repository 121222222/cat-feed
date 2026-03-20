const app = getApp();

Page({
  data: {
    userInfo: {}
  },

  onLoad() {
    this.setData({ userInfo: { ...app.globalData.mockUser } });
  },

  onChangeAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        this.setData({ 'userInfo.avatar': res.tempFiles[0].tempFilePath });
      }
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`userInfo.${field}`]: e.detail.value });
  },

  onSave() {
    wx.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 1000);
  }
});
