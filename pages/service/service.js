const app = getApp();
const db = require('../../utils/db.js');
const util = require('../../utils/util.js');

Page({
  data: {
    activeTab: 0,
    myNeeds: [],
    myApplies: [],
    hotNeeds: [],
    statusCount: { pending: 0, accepted: 0, in_progress: 0, completed: 0 },
    applyCount: { reviewing: 0, approved: 0, in_progress: 0, completed: 0 }
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    this.loadData();
  },

  async loadData() {
    const [myNeedsList, hotNeedsList] = await Promise.all([
      db.getMyNeeds(),
      db.getPendingNeeds()
    ]);

    const myNeeds = myNeedsList.map(n => ({
      ...n,
      id: n._id,
      statusText: util.getStatusText(n.status)
    }));

    const statusCount = {
      pending: myNeeds.filter(n => n.status === 'pending').length,
      accepted: myNeeds.filter(n => n.status === 'accepted').length,
      in_progress: myNeeds.filter(n => n.status === 'in_progress').length,
      completed: myNeeds.filter(n => n.status === 'completed').length
    };

    const hotNeeds = hotNeedsList.map(n => ({ ...n, id: n._id }));

    this.setData({
      myNeeds,
      statusCount,
      hotNeeds,
      myApplies: [],
      applyCount: { reviewing: 0, approved: 0, in_progress: 0, completed: 0 }
    });
  },

  switchTab(e) {
    this.setData({ activeTab: Number(e.currentTarget.dataset.tab) });
  },

  goPublish() {
    wx.navigateTo({ url: '/pages/publish/publish' });
  },

  goMyNeeds() {
    wx.navigateTo({ url: '/pages/my-needs/my-needs' });
  },

  goAcceptList() {
    wx.navigateTo({ url: '/pages/accept-list/accept-list' });
  },

  goMyApplies() {
    wx.navigateTo({ url: '/pages/my-applies/my-applies' });
  },

  goNeedDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/need-detail/need-detail?id=${id}` });
  }
});
