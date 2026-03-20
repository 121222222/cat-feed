const app = getApp();

Page({
  data: {
    feeder: {},
    reviews: [
      { name: '张三', stars: [1,2,3,4,5], text: '非常负责，每次都按时到，橘座很喜欢她', time: '3天前' },
      { name: '王五', stars: [1,2,3,4,5], text: '很有耐心，猫咪喂药都做得很好', time: '1周前' },
      { name: '李四', stars: [1,2,3,4], text: '服务态度很好，推荐！', time: '2周前' }
    ]
  },

  onLoad(options) {
    const id = options.id;
    const feeder = app.globalData.mockFeeders.find(f => f.id === id) || app.globalData.mockFeeders[0];
    this.setData({ feeder });
  },

  onContact() {
    wx.navigateTo({ url: `/pages/chat/chat?name=${this.data.feeder.name}` });
  },

  onInvite() {
    wx.showToast({ title: '已发送邀请', icon: 'success' });
  }
});
