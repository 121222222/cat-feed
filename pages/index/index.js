const app = getApp();

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
    this.setData({
      userInfo: app.globalData.mockUser,
      needs: app.globalData.mockNeeds.filter(n => n.status === 'pending'),
      feeders: app.globalData.mockFeeders
    });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
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
    wx.switchTab({ url: '/pages/service/service' });
  },

  goMoreFeeders() {
    wx.navigateTo({ url: '/pages/accept-list/accept-list' });
  },

  goFeederDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/service-detail/service-detail?id=${id}` });
  },

  onPullDownRefresh() {
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  }
});
