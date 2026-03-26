const app = getApp();
const db = require('../../utils/db.js');
const util = require('../../utils/util.js');

Page({
  data: {
    need: {},
    statusText: '',
    isOwner: false
  },

  async onLoad(options) {
    const id = options.id;
    if (!id) return;
    wx.showLoading({ title: '加载中...' });
    const need = await db.getNeedById(id);
    wx.hideLoading();
    if (need) {
      const userInfo = app.globalData.userInfo || {};
      this.setData({
        need: { ...need, id: need._id },
        statusText: util.getStatusText(need.status),
        isOwner: need._openid === userInfo._openid
      });
    } else {
      wx.showToast({ title: '需求不存在', icon: 'none' });
    }
  },

  onApply() {
    wx.navigateTo({ url: `/pages/apply-feed/apply-feed?id=${this.data.need._id}` });
  },

  onContact() {
    wx.navigateTo({ url: `/pages/chat/chat?name=${this.data.need.userName}` });
  },

  onCancel() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个喂养需求吗？',
      confirmColor: '#FF4D4F',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });
          await db.updateNeedStatus(this.data.need._id, 'cancelled');
          wx.hideLoading();
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
    wx.showModal({
      title: '确认完成',
      content: '确定服务已完成吗？',
      confirmColor: '#FFBAA3',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });
          await db.updateNeedStatus(this.data.need._id, 'completed');
          wx.hideLoading();
          wx.showToast({ title: '已确认服务', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1000);
        }
      }
    });
  }
});
