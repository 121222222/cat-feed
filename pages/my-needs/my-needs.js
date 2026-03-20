const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    filterStatus: '',
    allNeeds: [],
    filteredNeeds: []
  },

  onLoad() {
    const needs = app.globalData.mockNeeds.map(n => ({
      ...n,
      statusText: util.getStatusText(n.status)
    }));
    this.setData({ allNeeds: needs, filteredNeeds: needs });
  },

  onFilter(e) {
    const status = e.currentTarget.dataset.status;
    const filtered = status ? this.data.allNeeds.filter(n => n.status === status) : this.data.allNeeds;
    this.setData({ filterStatus: status, filteredNeeds: filtered });
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/need-detail/need-detail?id=${e.currentTarget.dataset.id}` });
  },

  goPublish() {
    wx.navigateTo({ url: '/pages/publish/publish' });
  }
});
