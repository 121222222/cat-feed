const app = getApp();

Page({
  data: {
    needs: []
  },

  onLoad() {
    const needs = app.globalData.mockNeeds || [];
    this.setData({ needs });
  },

  goNeedDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/need-detail/need-detail?id=${id}` });
  }
});
