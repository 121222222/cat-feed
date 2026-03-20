const app = getApp();

Page({
  data: {
    needs: [],
    timeFilter: '',
    dormFilter: '',
    countFilter: ''
  },

  onLoad() {
    const needs = app.globalData.mockNeeds.filter(n => n.status === 'pending');
    this.setData({ needs });
  },

  showFilter(e) {
    const type = e.currentTarget.dataset.type;
    wx.showToast({ title: '筛选功能开发中', icon: 'none' });
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/need-detail/need-detail?id=${e.currentTarget.dataset.id}` });
  },

  onApply(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/apply-feed/apply-feed?id=${id}` });
  }
});
