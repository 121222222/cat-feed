const db = require('../../utils/db.js');
const util = require('../../utils/util.js');

Page({
  data: {
    filterStatus: '',
    allNeeds: [],
    filteredNeeds: []
  },

  async onLoad() {
    wx.showLoading({ title: '加载中...' });
    const needs = await db.getMyNeeds();
    wx.hideLoading();
    const mapped = needs.map(n => ({
      ...n,
      id: n._id,
      statusText: util.getStatusText(n.status)
    }));
    this.setData({ allNeeds: mapped, filteredNeeds: mapped });
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
