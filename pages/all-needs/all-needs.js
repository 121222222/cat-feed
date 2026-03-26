const db = require('../../utils/db.js');

Page({
  data: {
    needs: []
  },

  async onLoad() {
    wx.showLoading({ title: '加载中...' });
    const needs = await db.getAllNeeds();
    wx.hideLoading();
    this.setData({ needs: needs.map(n => ({ ...n, id: n._id })) });
  },

  goNeedDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/need-detail/need-detail?id=${id}` });
  }
});
