const app = getApp();
const db = require('../../utils/db.js');

Page({
  data: {
    userInfo: {},
    needs: [],
    feeders: [],
    notices: [
      '🏠 宿舍养猫须知：请保持公共区域清洁',
      '📋 平台规则更新：服务双方须完成实名认证',
      '🎉 本月优秀喂养人评选开始啦！'
    ]
  },

  onLoad() {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
    this.loadData();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    // 刷新数据
    if (app.globalData.isLoggedIn) {
      this.loadData();
    }
  },

  async loadData() {
    wx.showLoading({ title: '加载中...' });
    try {
      const [needsRaw, userInfo] = await Promise.all([
        db.getRecentNeeds(4),
        this.getUserInfo()
      ]);
      const needs = needsRaw.map(n => ({ ...n, id: n._id }));
      this.setData({ userInfo, needs });
    } catch (err) {
      console.error('首页加载失败:', err);
    }
    wx.hideLoading();
  },

  getUserInfo() {
    return app.globalData.userInfo || {};
  },

  onSearchTap() {
    wx.showToast({ title: '搜索功能开发中', icon: 'none' });
  },

  goPublish() {
    wx.navigateTo({ url: '/pages/publish/publish' });
  },

  goAcceptList() {
    wx.navigateTo({ url: '/pages/accept-list/accept-list' });
  },

  goNotice() {
    wx.switchTab({ url: '/pages/community/community' });
  },

  goNeedDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/need-detail/need-detail?id=${id}` });
  },

  goMoreNeeds() {
    wx.navigateTo({ url: '/pages/all-needs/all-needs' });
  },

  goMoreFeeders() {
    wx.navigateTo({ url: '/pages/accept-list/accept-list' });
  },

  goFeederDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/service-detail/service-detail?id=${id}` });
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
