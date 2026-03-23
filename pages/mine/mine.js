const app = getApp();

Page({
  data: {
    userInfo: {},
    cats: [],
    catCount: 0
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 });
    }
    // 每次显示时重新加载数据（添加猫咪返回后刷新）
    this.loadData();
  },

  loadData() {
    const userInfo = app.globalData.mockUser;
    const cats = app.globalData.mockCats;
    this.setData({
      userInfo,
      cats,
      catCount: cats.length
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
  }
});
