const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    need: {},
    statusText: '',
    isOwner: false
  },

  onLoad(options) {
    const id = options.id;
    const need = app.globalData.mockNeeds.find(n => n.id === id) || app.globalData.mockNeeds[0];
    this.setData({
      need,
      statusText: util.getStatusText(need.status),
      isOwner: need.userId === app.globalData.mockUser.id
    });
  },

  onApply() {
    wx.navigateTo({ url: `/pages/apply-feed/apply-feed?id=${this.data.need.id}` });
  },

  onContact() {
    wx.navigateTo({ url: `/pages/chat/chat?name=${this.data.need.userName}` });
  },

  onCancel() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个喂养需求吗？',
      confirmColor: '#FF4D4F',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '已取消', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1000);
        }
      }
    });
  },

  onEdit() {
    wx.showToast({ title: '编辑功能开发中', icon: 'none' });
  },

  onConfirm() {
    wx.showToast({ title: '已确认服务', icon: 'success' });
  }
});
