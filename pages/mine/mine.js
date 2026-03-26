const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    userInfo: {},
    cats: [],
    catCount: 0,
    myNeeds: [],
    statusCount: { pending: 0, accepted: 0, in_progress: 0, completed: 0 }
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    // 每次显示时重新加载数据（添加猫咪返回后刷新）
    this.loadData();
  },

  loadData() {
    const userInfo = app.globalData.mockUser;
    const cats = app.globalData.mockCats;

    // 加载我的需求数据
    const needs = app.globalData.mockNeeds || [];
    const myNeeds = needs.filter(n => n.userId === 'u001').map(n => ({
      ...n,
      statusText: util.getStatusText(n.status)
    }));
    const statusCount = {
      pending: myNeeds.filter(n => n.status === 'pending').length,
      accepted: myNeeds.filter(n => n.status === 'accepted').length,
      in_progress: myNeeds.filter(n => n.status === 'in_progress').length,
      completed: myNeeds.filter(n => n.status === 'completed').length
    };

    this.setData({
      userInfo,
      cats,
      catCount: cats.length,
      myNeeds,
      statusCount
    });
  },

  onChangeAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        const avatarPath = res.tempFiles[0].tempFilePath;
        this.setData({ 'userInfo.avatar': avatarPath });
        // 同步到全局数据
        app.globalData.mockUser.avatar = avatarPath;
      }
    });
  },

  goMyCats() {
    wx.navigateTo({ url: '/pages/my-cats/my-cats' });
  },

  goAddCat() {
    wx.navigateTo({ url: '/pages/add-cat/add-cat' });
  },

  goMyNeeds() {
    wx.navigateTo({ url: '/pages/my-needs/my-needs' });
  },

  goMyApplies() {
    wx.navigateTo({ url: '/pages/my-applies/my-applies' });
  },

  goAuth() {
    wx.navigateTo({ url: '/pages/auth/auth' });
  },

  goRating() {
    wx.showToast({ title: '评价功能开发中', icon: 'none' });
  },

  goProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' });
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' });
  },

  goHelp() {
    wx.navigateTo({ url: '/pages/help/help' });
  },

  goNeedDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/need-detail/need-detail?id=${id}` });
  }
});
