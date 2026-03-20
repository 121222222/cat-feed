const app = getApp();

Page({
  data: {
    userInfo: {},
    cats: [],
    catCount: 0
  },

  onLoad() {
    const userInfo = app.globalData.mockUser;
    const cats = app.globalData.mockCats;
    this.setData({
      userInfo,
      cats,
      catCount: cats.length
    });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 });
    }
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
  }
});
